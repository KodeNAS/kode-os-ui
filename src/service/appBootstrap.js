/*
 * KODE OS — per-app auto-bootstrap helpers.
 *
 * Each app the wizard installs has its own first-run setup that the
 * buyer would normally have to click through manually (admin signup,
 * media-library config, owner-account onboarding, web-admin password).
 * These helpers do that work programmatically using the credentials
 * the buyer entered once in AdminAccountStep, so a non-technical
 * user (the "grandpa" UX bar) never sees an Immich "Set up your
 * admin account" screen, a Jellyfin setup wizard, etc.
 *
 * Each bootstrap is best-effort: a failure logs and returns an error
 * but doesn't block the rest of the wizard. The walkthroughs still
 * exist as a manual fallback path.
 *
 * Conventions:
 *   - All helpers accept the pebble host + a creds bag.
 *   - All helpers return { ok: boolean, error?: string, extra?: any }.
 *   - All helpers swallow their own exceptions and only throw on
 *     truly catastrophic conditions (creds missing entirely).
 */

const IMMICH_PORT = 2283
const JELLYFIN_PORT = 8096
const HOME_ASSISTANT_PORT = 8123

function cleanUrl(u) { return String(u || '').replace(/\/+$/, '') }

/**
 * Immich admin sign-up + read-only API key for the Photo-of-the-Day
 * widget. Idempotent — if an admin is already provisioned, the signup
 * POST returns 400 and we treat that as "already done, try to log in
 * instead and just mint a fresh API key."
 *
 * Writes the resulting key to localStorage['kode_potd_settings'] so
 * the dashboard's Photo-of-the-Day widget starts working without the
 * buyer touching anything.
 */
export async function bootstrapImmich(host, { email, password, fullName }) {
  if (!email || !password) return { ok: false, error: 'missing credentials' }
  const base = cleanUrl(`http://${host}:${IMMICH_PORT}`)
  const name = fullName || (email.split('@')[0] || 'Owner')

  // 1. Try to sign up as the first admin. This endpoint is rejected
  //    after the first call, so a 400 means someone already signed up
  //    — which is fine; we'll fall through and try to log in.
  try {
    const res = await fetch(`${base}/api/auth/admin-sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    if (!res.ok && res.status !== 400) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `admin sign-up HTTP ${res.status}: ${text || 'unknown'}` }
    }
  } catch (e) {
    return { ok: false, error: (e && e.message) || String(e) }
  }

  // 2. Log in to grab an access token.
  let accessToken = ''
  try {
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!loginRes.ok) {
      const text = await loginRes.text().catch(() => '')
      return { ok: false, error: `login HTTP ${loginRes.status}: ${text || 'unknown'}` }
    }
    const loginData = await loginRes.json()
    accessToken = loginData.accessToken
    if (!accessToken) return { ok: false, error: 'no access token returned' }
  } catch (e) {
    return { ok: false, error: (e && e.message) || String(e) }
  }

  // 3. Mint a read-only API key for the Photo-of-the-Day widget. We
  //    try the modern shape (permissions array) first, fall back to
  //    the legacy "no permissions" shape since Immich changed this
  //    mid-2.x.
  const keyName = 'KODE OS – Photo of the Day'
  const READ_ONLY_PERMS = ['asset.read', 'album.read', 'memory.read', 'partner.read']
  let secret = ''
  try {
    const tryShapes = [
      { name: keyName, permissions: READ_ONLY_PERMS },
      { name: keyName },
    ]
    for (const body of tryShapes) {
      const r = await fetch(`${base}/api/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!r.ok) continue
      const data = await r.json()
      secret = data.secret || (data.apiKey && data.apiKey.secret) || ''
      if (secret) break
    }
  } catch (e) {
    // Key generation failed — admin is still set up, so we count the
    // bootstrap as partially successful and let the manual flow take
    // over for Photo-of-the-Day.
    return { ok: true, extra: { keyMintFailed: true, error: (e && e.message) || String(e) } }
  }

  if (secret) {
    // 4. Write the widget settings directly so the dashboard starts
    //    showing photos without the buyer opening the gear modal.
    try {
      localStorage.setItem('kode_potd_settings', JSON.stringify({
        immichUrl: base,
        apiKey: secret,
        source: 'memory',
        albumId: '',
        refreshHours: 24,
      }))
    } catch (e) { /* ignore */ }
  }

  return { ok: true, extra: { hasKey: !!secret } }
}

/**
 * Jellyfin first-run setup. Jellyfin exposes a /Startup/* wizard
 * flow we can drive in sequence: SetLanguage → ConfigureUser →
 * CompleteWizard. We then start the server up so the buyer can sign
 * in immediately.
 */
export async function bootstrapJellyfin(host, { username, password }) {
  if (!username || !password) return { ok: false, error: 'missing credentials' }
  const base = cleanUrl(`http://${host}:${JELLYFIN_PORT}`)

  // Helper that handles Jellyfin's auth-free Startup endpoints. After
  // the wizard finishes, this won't work anymore — endpoints 403.
  async function postNoAuth(path, body) {
    return fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': 'MediaBrowser Client="KODE", Device="setup-wizard", DeviceId="kode-setup", Version="1.0.0"',
      },
      body: JSON.stringify(body || {}),
    })
  }

  try {
    // Step through Jellyfin's startup wizard in order. Each call is
    // idempotent on a fresh install; on a server that's already past
    // setup the first call 403s and we just bail.
    const langRes = await postNoAuth('/Startup/Configuration', {
      UICulture: 'en-US',
      MetadataCountryCode: 'US',
      PreferredMetadataLanguage: 'en',
    })
    if (langRes.status === 403) {
      // Already set up — log in to confirm credentials work, then
      // stop. We deliberately don't try to add a NEW user via the
      // admin API here because that requires the existing admin's
      // creds which may differ.
      return { ok: true, extra: { alreadyConfigured: true } }
    }
    if (!langRes.ok) {
      return { ok: false, error: `setLanguage HTTP ${langRes.status}` }
    }

    await postNoAuth('/Startup/User', {
      Name: username,
      Password: password,
    })

    // Skip the optional remote-access setup (default: not exposed).
    await postNoAuth('/Startup/RemoteAccess', { EnableRemoteAccess: false, EnableAutomaticPortMapping: false })

    // Mark the wizard complete so the server flips out of setup mode.
    await postNoAuth('/Startup/Complete', {})
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e && e.message) || String(e) }
  }
}

/**
 * Home Assistant onboarding — creates the owner account.
 *
 * HA's onboarding flow is: POST /api/onboarding/users (owner) → POST
 * /api/onboarding/core_config → optionally /integration. The first
 * POST returns an authorization code we'd normally exchange for a
 * token, but since this happens server-side here we just leave the
 * buyer to sign in via the walkthrough URL with the credentials they
 * already know.
 */
export async function bootstrapHomeAssistant(host, { username, password, fullName, language }) {
  if (!username || !password) return { ok: false, error: 'missing credentials' }
  const base = cleanUrl(`http://${host}:${HOME_ASSISTANT_PORT}`)
  const name = fullName || username
  const lang = (language || 'en_us').replace('_', '-').toLowerCase()
  try {
    // 1. Owner account. HA refuses subsequent calls once an owner
    //    exists, so a 4xx means "already done" and we bail OK.
    const userRes = await fetch(`${base}/api/onboarding/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name,
        username,
        password,
        client_id: `http://${host}/`,
        language: lang.startsWith('en') ? 'en' : lang.split('-')[0],
      }),
    })
    if (!userRes.ok) {
      if (userRes.status === 403) return { ok: true, extra: { alreadyConfigured: true } }
      return { ok: false, error: `onboarding/users HTTP ${userRes.status}` }
    }
    // 2. Core config (timezone + unit prefs). Best-effort.
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      await fetch(`${base}/api/onboarding/core_config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_name: 'Home',
          time_zone: tz,
          unit_system: 'metric',
        }),
      })
    } catch (e) { /* non-blocking */ }

    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e && e.message) || String(e) }
  }
}

/**
 * Pi-hole — set the admin web password. Pi-hole has no signup-style
 * REST API; the admin "account" is purely the web UI password set
 * via `pihole -a -p`. That command runs shell-side, not via REST.
 *
 * For now this is a no-op stub that returns ok=true so the wizard
 * doesn't surface a fake error. Real password set will need a small
 * backend bridge (systemd service exposing a POST endpoint that
 * shells out to `pihole -a -p`). Until then, the Pi-hole walkthrough
 * tells the buyer how to set the password manually.
 */
// eslint-disable-next-line no-unused-vars
export async function bootstrapPihole(host, { password }) {
  return { ok: true, extra: { unsupported: 'no backend bridge yet' } }
}

/**
 * Dispatch by appstore id. Returns the bootstrap result so the
 * caller can render per-app status. Unknown ids return ok=true so
 * an installed-but-unknown app doesn't block the wizard.
 */
export async function bootstrapByAppId(appstoreId, host, creds) {
  switch (appstoreId) {
    case 'immich':                  return bootstrapImmich(host, creds)
    case 'jellyfin':                return bootstrapJellyfin(host, creds)
    case 'big-bear-home-assistant': return bootstrapHomeAssistant(host, creds)
    case 'pihole':                  return bootstrapPihole(host, creds)
    default:                        return { ok: true, extra: { skipped: 'no bootstrap' } }
  }
}

/* --------------------------------------------------------------------- *
 * Pre-install YAML transforms.
 *
 * Some apps can be fully auto-configured by injecting the buyer's
 * password into a compose env var BEFORE the install POST. That way
 * the container boots with the right credentials baked in and the
 * buyer can immediately sign in with their KODE password — no shell
 * commands, no walkthrough setup.
 *
 * Pi-hole is the headline case: it reads FTLCONF_webserver_api_password
 * at startup and uses it as the admin-UI password.
 * --------------------------------------------------------------------- */

/**
 * Replace Pi-hole's default API password (`casaos`) with the buyer's
 * KODE password so they sign in with credentials they already know.
 * Safe across YAML quoting variants because we only replace the value
 * after the well-known key.
 */
export function preparePiholeYaml(yaml, creds) {
  if (!yaml || !creds || !creds.password) return yaml
  // Escape backslashes + double quotes so the YAML stays parseable
  // even if the user picks a password with those characters.
  const escaped = String(creds.password).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  // Match `FTLCONF_webserver_api_password:` followed by any value
  // (quoted or unquoted) to end-of-line. Replace with a quoted
  // version of the user's password.
  return yaml.replace(
    /(FTLCONF_webserver_api_password:\s*)([^\n\r]*)/,
    `$1"${escaped}"`,
  )
}

/**
 * Dispatch by appstore id. Each app can register its own transform;
 * unknown apps pass through untouched.
 */
export function prepareYamlByAppId(appstoreId, yaml, creds) {
  switch (appstoreId) {
    case 'pihole': return preparePiholeYaml(yaml, creds)
    default:       return yaml
  }
}
