<template>
  <div class="kode-tile network-status-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <header class="tile-header">
      <h2 class="tile-title">{{ $t('Network') }}</h2>
      <span class="net-pill" :class="primaryStatus === 'up' ? 'is-up' : 'is-down'">
        {{ primaryStatus === 'up' ? $t('Online') : $t('Offline') }}
      </span>
    </header>

    <div v-if="isLoading" class="net-loading">{{ $t('Loading...') }}</div>
    <div v-else>
      <div class="net-primary">
        <span class="net-icon-wrap">
          <b-icon :icon="iconFor(primaryName)" pack="casa" size="is-small" />
        </span>
        <div class="net-primary-text">
          <div class="net-primary-name">{{ primaryName || 'No connection' }}</div>
          <div class="net-primary-host">{{ host }}</div>
        </div>
      </div>

      <div class="net-stats">
        <div class="net-stat">
          <span class="net-stat-label">
            <b-icon icon="arrow-down" pack="casa" size="is-small" /> {{ $t('Down') }}
          </span>
          <span class="net-stat-value">{{ rx }}</span>
        </div>
        <div class="net-stat">
          <span class="net-stat-label">
            <b-icon icon="arrow-up" pack="casa" size="is-small" /> {{ $t('Up') }}
          </span>
          <span class="net-stat-value">{{ tx }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

function formatBytes(b) {
  if (!b || !isFinite(b)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (b >= 1024 && i < units.length - 1) { b /= 1024; i++ }
  return `${b.toFixed(b >= 10 ? 0 : 1)} ${units[i]}`
}

export default {
  name: 'NetworkStatusWidget',
  mixins: [hintMode],
  data() {
    return {
      isLoading: true,
      primaryName: '',
      primaryStatus: 'down',
      rx: '0 B',
      tx: '0 B',
      host: window.location.hostname || 'pebble.local',
      pollId: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Combined network + address widget — shows the active interface (Ethernet or Wi-Fi), the pebble\'s local hostname, and total bytes received / sent. Refreshes every 5 seconds.')
    },
  },
  async mounted() {
    // Prefer the user-chosen pebble name when present.
    try {
      const res = await this.$api.users.getCustomStorage('kode_pebble_name')
      const name = res && res.data && res.data.data && res.data.data.name
      if (name) this.host = name
    } catch (e) { /* fall back to window.location.hostname */ }

    this.fetch()
    this.pollId = setInterval(() => this.fetch(), 5000)
  },
  beforeDestroy() {
    if (this.pollId) clearInterval(this.pollId)
  },
  methods: {
    iconFor(name) {
      const n = String(name || '').toLowerCase()
      if (n.startsWith('wlan') || n.startsWith('wlp') || n.includes('wifi')) return 'wifi'
      return 'computer-outline'
    },
    async fetch() {
      try {
        const res = await this.$api.sys.getUtilization()
        const data = (res && res.data && res.data.data) || {}
        // The real shape (verified against the pebble): data.net is an array
        // of interfaces { name, bytesSent, bytesRecv, state }. Prefer the
        // one that's "up" with the most traffic; fall back to the first.
        const ifaces = Array.isArray(data.net) ? data.net : []
        const up = ifaces.filter(i => i.state === 'up')
        // Sort up interfaces by total bytes desc — picks the actively-used one.
        up.sort((a, b) => (b.bytesRecv + b.bytesSent) - (a.bytesRecv + a.bytesSent))
        const primary = up[0] || ifaces[0]
        if (primary) {
          this.primaryName = primary.name
          this.primaryStatus = primary.state === 'up' ? 'up' : 'down'
          this.rx = formatBytes(primary.bytesRecv)
          this.tx = formatBytes(primary.bytesSent)
        } else {
          this.primaryName = ''
          this.primaryStatus = 'down'
        }
      } catch (e) {
        this.primaryStatus = 'down'
      } finally {
        this.isLoading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.kode-tile {
  position: relative;
  background: rgba(245, 247, 250, 0.82);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 20px;
  padding: 1.1rem 1.25rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
}

.kode-hint {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translate(-50%, -100%);
  background: rgba(15, 25, 30, 0.92);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  line-height: 1.4;
  max-width: 280px;
  white-space: normal;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 50;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}
.kode-tile:hover .kode-hint { opacity: 1; }

.tile-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.7rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.tile-title {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  color: rgba(31, 41, 55, 0.7);
  margin: 0;
}

.net-pill {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;

  &.is-up   { background: rgba(45, 95, 78, 0.18); color: #2d5f4e; }
  &.is-down { background: rgba(176, 74, 74, 0.18); color: #b04a4a; }
}

.net-loading { font-size: 0.875rem; color: rgba(0, 0, 0, 0.55); padding: 0.5rem 0; }

.net-primary {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.85rem;
}

.net-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: linear-gradient(135deg, #2d5f4e, #3f7a66);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.net-primary-text { min-width: 0; }

.net-primary-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.net-primary-host {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 1px;
  font-feature-settings: 'tnum' 1;
}

.net-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.net-stat {
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
}

.net-stat-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.55);
  font-weight: 600;
}

.net-stat-value {
  display: block;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1f2937;
  margin-top: 0.2rem;
  font-feature-settings: 'tnum' 1;
}
</style>
