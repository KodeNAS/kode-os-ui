/*
 * KODE OS — app sync helpers used by the first-boot wizard.
 *
 * Wraps the CasaOS app-management OpenAPI to:
 *   - list currently installed compose apps (myComposeAppList)
 *   - install one app by its appstore id (fetch YAML → POST compose)
 *   - uninstall one app by its compose id (DELETE compose)
 *   - reconcile a target set: install missing, uninstall extras
 *
 * The caller passes the appstore-id list (not the picker keys). The
 * picker maps key → appstoreId in PickAppsStep's catalog; this module
 * is one layer below that, working purely on CasaOS-native ids.
 *
 * Each operation reports progress via the provided callback so the UI
 * can render per-app state without polling.
 */

// The OpenAPI client is exposed on every Vue instance as $openAPI, but
// this module isn't a Vue component — so we accept the OpenAPI handle
// as an argument and don't reach into Vue at all. Keeps it testable.

/**
 * List currently installed compose apps. Returns an array of app ids
 * (the keys you'd pass to uninstall / use as a primary key).
 */
export async function listInstalledAppIds(openAPI) {
  try {
    const res = await openAPI.appManagement.compose.myComposeAppList()
    const data = (res && res.data && res.data.data) || {}
    if (Array.isArray(data)) {
      return data.map(a => (a && (a.name || (a.compose && a.compose.name) || a.id))).filter(Boolean)
    }
    // Map shape: { id1: {...}, id2: {...} }
    return Object.keys(data)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('appSync.listInstalledAppIds failed:', e)
    return []
  }
}

/**
 * Install a single app by its appstore id. Two-step: fetch the YAML
 * template, then POST it. Returns true on success.
 *
 * The POST returns as soon as the install is QUEUED — the actual
 * Docker pull + container start happens asynchronously and can take
 * 30s–2min per app. Callers that need to wait for "actually running"
 * should follow up with waitForRunning().
 */
export async function installApp(openAPI, appstoreId) {
  // Fetch the compose YAML. The OpenAPI client supports a per-call
  // headers config — we need application/yaml on both ends so the
  // server returns YAML and the install endpoint accepts it.
  const yamlRes = await openAPI.appManagement.appStore.composeApp(appstoreId, {
    headers: {
      'content-type': 'application/yaml',
      'accept': 'application/yaml',
    },
  })
  const yaml = yamlRes && yamlRes.data
  if (!yaml) throw new Error(`empty compose YAML for ${appstoreId}`)
  // Install: (yaml, dryRun, checkPortConflict).
  await openAPI.appManagement.compose.installComposeApp(yaml, false, true)
  return true
}

/**
 * Look up a single app's status from the compose-app list. Returns
 * '' if the app isn't in the list yet (container still being created).
 */
async function getAppStatus(openAPI, appId) {
  const res = await openAPI.appManagement.compose.myComposeAppList()
  const data = (res && res.data && res.data.data) || {}
  const entry = Array.isArray(data) ? data.find(a => (a.name || (a.compose && a.compose.name)) === appId) : data[appId]
  if (!entry) return ''
  return (entry.status || (entry.main_app && entry.main_app.status) || '') + ''
}

/**
 * Poll the compose-app status until it reports a "running" state, an
 * error state, or the timeout elapses. Returns the final status
 * string. Used after installApp() so the wizard doesn't move on
 * until the container is actually up.
 *
 * Note: "dead" is treated as a transient state for the first ~30s
 * after install because docker compose can briefly mark containers
 * as dead while it's still bringing up dependencies (db, etc.).
 */
export async function waitForRunning(openAPI, appId, { timeoutMs = 240000, intervalMs = 4000, onTick } = {}) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    let state = ''
    try {
      state = await getAppStatus(openAPI, appId)
    } catch (e) {
      // Status endpoint may 404 briefly during create. Treat as pending.
      state = 'pending'
    }
    if (onTick) {
      try { onTick(state) } catch (e) { /* swallow */ }
    }
    if (/^run/i.test(state)) return state
    // Only consider "exited" / "dead" terminal AFTER 30s of polling —
    // compose can transiently mark services dead while bringing up
    // their dependencies.
    const elapsed = Date.now() - started
    if (elapsed > 30000 && /(exited|dead)/i.test(state)) {
      throw new Error(`app entered state: ${state}`)
    }
    await new Promise(r => setTimeout(r, intervalMs))
  }
  throw new Error('install timed out — container did not reach running state in 4 min')
}

/**
 * Uninstall a single app by its id. Pass `deleteUserdata: true` to
 * also remove the app's data folder; we default to false so accidental
 * un-picks during wizard replay don't nuke photos / config.
 */
export async function uninstallApp(openAPI, appId, { deleteUserdata = false } = {}) {
  await openAPI.appManagement.compose.uninstallComposeApp(appId, deleteUserdata)
  return true
}

/**
 * Diff a target set against currently-installed apps and apply the
 * deltas. The callback fires for every app the diff touched with
 * a status object: { id, action: 'install'|'uninstall', state, error? }.
 *
 * @param openAPI   the $openAPI handle from any Vue instance
 * @param targetIds array of appstore ids the user *wants* installed
 * @param onUpdate  fired with { id, action, state, error? } per step
 * @param opts.deleteUserdata - pass to uninstall (default false)
 */
export async function syncApps(openAPI, targetIds, onUpdate, opts = {}) {
  const installed = new Set(await listInstalledAppIds(openAPI))
  const target = new Set((targetIds || []).filter(Boolean))

  const toInstall = [...target].filter(id => !installed.has(id))
  const toUninstall = [...installed].filter(id => !target.has(id))

  const report = (entry) => { try { onUpdate && onUpdate(entry) } catch (e) { /* swallow */ } }

  // Install sequentially. Docker pulls + container startup are heavy;
  // running 5 in parallel on a Pi can OOM or stall. After each install
  // we poll the compose status until the container reports "running"
  // (or we time out) — the install API itself returns as soon as the
  // job is QUEUED, not when the container is actually up.
  for (const id of toInstall) {
    report({ id, action: 'install', state: 'running' })
    try {
      await installApp(openAPI, id)
      report({ id, action: 'install', state: 'starting' })
      await waitForRunning(openAPI, id, {
        onTick: (s) => report({ id, action: 'install', state: 'starting', detail: s }),
      })
      report({ id, action: 'install', state: 'done' })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('appSync: install failed for', id, e)
      report({ id, action: 'install', state: 'error', error: (e && e.message) || String(e) })
    }
  }

  for (const id of toUninstall) {
    report({ id, action: 'uninstall', state: 'running' })
    try {
      await uninstallApp(openAPI, id, { deleteUserdata: opts.deleteUserdata === true })
      report({ id, action: 'uninstall', state: 'done' })
    } catch (e) {
      report({ id, action: 'uninstall', state: 'error', error: e && e.message })
    }
  }

  return { installed: toInstall, uninstalled: toUninstall }
}
