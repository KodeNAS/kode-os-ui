/*
 * KODE OS — runtime app endpoint resolver.
 *
 * Walkthroughs and wizards need to point users at "the Immich web UI" or
 * "the Pi-hole admin" without hardcoding host ports, because CasaOS remaps
 * container ports unpredictably across installs (e.g. Jellyfin's internal
 * 8096 lands on host 8097 here). We query the app-management API at mount
 * time to discover the real protocol/host/port/index for each known app
 * and build a URL. On API failure callers fall back to a hardcoded URL.
 */
import api from './index'

// Maps our internal walkthrough/wizard keys to the compose app IDs as
// registered with CasaOS on this install. Names follow the upstream
// big-bear-* convention where applicable.
const APP_ID_MAP = {
  immich: ['immich', 'immich-server'],
  jellyfin: ['jellyfin'],
  pihole: ['pihole'],
  homeassistant: ['big-bear-home-assistant', 'home-assistant', 'homeassistant'],
  filebrowser: ['big-bear-filebrowser', 'filebrowser'],
}

function buildUrl(info, fallbackHost) {
  if (!info) return null
  const scheme = info.scheme || 'http'
  const host = info.hostname || fallbackHost
  const port = info.port_map ? `:${info.port_map}` : ''
  let path = info.index || '/'
  if (!path.startsWith('/')) path = '/' + path
  return `${scheme}://${host}${port}${path}`
}

async function tryLookup(appId) {
  try {
    const res = await api.appManagement.compose.myComposeApp(appId)
    return (res && res.data && res.data.data && res.data.data.store_info) || null
  } catch (e) {
    return null
  }
}

/**
 * Resolve the user-facing URL for an app key (e.g. 'jellyfin'). Tries each
 * candidate compose ID in APP_ID_MAP; returns null if all calls fail so the
 * caller can fall back to a hardcoded URL.
 */
export async function resolveAppUrl(appKey, fallbackHost) {
  const ids = APP_ID_MAP[appKey] || [appKey]
  for (const id of ids) {
    const info = await tryLookup(id)
    if (info) {
      const url = buildUrl(info, fallbackHost)
      if (url) return url
    }
  }
  return null
}
