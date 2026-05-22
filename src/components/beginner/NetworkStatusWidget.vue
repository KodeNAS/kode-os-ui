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
          <b-icon :icon="iconFor(currentName)" pack="casa" size="is-small" />
        </span>
        <div class="net-primary-text">
          <div class="net-primary-name">{{ currentName || 'No connection' }}</div>
          <div class="net-primary-host">{{ host }}</div>
        </div>
        <!-- Interface picker. Auto means "pick the most active up interface". -->
        <select v-if="interfaces.length > 0" v-model="selectedInterface" class="net-picker" @change="onSelectInterface">
          <option value="">{{ $t('Auto') }}</option>
          <option v-for="iface in interfaces" :key="iface.name" :value="iface.name">
            {{ iface.name }}
          </option>
        </select>
      </div>

      <div class="net-stats">
        <div class="net-stat">
          <span class="net-stat-label">
            <b-icon icon="arrow-down" pack="casa" size="is-small" /> {{ $t('Down') }}
          </span>
          <span class="net-stat-value">{{ rxRate }}/s</span>
        </div>
        <div class="net-stat">
          <span class="net-stat-label">
            <b-icon icon="arrow-up" pack="casa" size="is-small" /> {{ $t('Up') }}
          </span>
          <span class="net-stat-value">{{ txRate }}/s</span>
        </div>
      </div>

      <!-- Sparkline. Rx is the lower band, Tx the upper. Both auto-scale to
           the max value in the visible window. -->
      <svg
        v-if="rxSamples.length > 1"
        class="net-graph"
        :viewBox="`0 0 ${graphWidth} ${graphHeight}`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path :d="rxPath" class="net-graph-line is-rx" />
        <path :d="rxFillPath" class="net-graph-fill is-rx" />
        <path :d="txPath" class="net-graph-line is-tx" />
        <path :d="txFillPath" class="net-graph-fill is-tx" />
      </svg>
    </div>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

const POLL_MS = 2000
const SAMPLE_WINDOW = 30  // 30 samples * 2s = 60 seconds of history
const SELECTED_INTERFACE_KEY = 'kode_network_interface'

function formatBytes(b) {
  if (!b || !isFinite(b)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let val = Math.abs(b)
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return `${val.toFixed(val >= 10 ? 0 : 1)} ${units[i]}`
}

export default {
  name: 'NetworkStatusWidget',
  mixins: [hintMode],
  data() {
    return {
      isLoading: true,
      interfaces: [],         // [{ name, state, bytesRecv, bytesSent }]
      selectedInterface: '',  // '' = auto-pick the busiest up interface
      currentName: '',
      primaryStatus: 'down',
      rxRate: '0 B',
      txRate: '0 B',
      rxSamples: [],   // bytes/sec per sample
      txSamples: [],
      _lastRx: null,
      _lastTx: null,
      _lastSampleTs: 0,
      host: window.location.hostname || 'pebble.local',
      pollId: null,
      graphWidth: 100,
      graphHeight: 36,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Active interface, online status, and a 60-second history of download / upload rates. Refreshes every 2 seconds.')
    },
    rxPath() { return this.linePath(this.rxSamples) },
    rxFillPath() { return this.fillPath(this.rxSamples) },
    txPath() { return this.linePath(this.txSamples) },
    txFillPath() { return this.fillPath(this.txSamples) },
  },
  async mounted() {
    // Saved interface preference.
    try {
      this.selectedInterface = localStorage.getItem(SELECTED_INTERFACE_KEY) || ''
    } catch (e) { /* ignore */ }

    // Saved hostname (kode_pebble_name) if set.
    try {
      const res = await this.$api.users.getCustomStorage('kode_pebble_name')
      const name = res && res.data && res.data.data && res.data.data.name
      if (name) this.host = name
    } catch (e) { /* fall back to window.location.hostname */ }

    this.fetch()
    this.pollId = setInterval(() => this.fetch(), POLL_MS)
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
    onSelectInterface() {
      try {
        if (this.selectedInterface) {
          localStorage.setItem(SELECTED_INTERFACE_KEY, this.selectedInterface)
        } else {
          localStorage.removeItem(SELECTED_INTERFACE_KEY)
        }
      } catch (e) { /* ignore */ }
      // Reset rate samples since we're tracking a different interface now.
      this.rxSamples = []
      this.txSamples = []
      this._lastRx = null
      this._lastTx = null
    },
    pickInterface(ifaces) {
      // If user picked one explicitly, use it.
      if (this.selectedInterface) {
        return ifaces.find(i => i.name === this.selectedInterface) || ifaces[0] || null
      }
      // Otherwise auto-pick: prefer "up" with most traffic.
      const up = ifaces.filter(i => i.state === 'up')
      up.sort((a, b) => (b.bytesRecv + b.bytesSent) - (a.bytesRecv + a.bytesSent))
      return up[0] || ifaces[0] || null
    },
    async fetch() {
      try {
        const res = await this.$api.sys.getUtilization()
        const data = (res && res.data && res.data.data) || {}
        const ifaces = Array.isArray(data.net) ? data.net : []
        this.interfaces = ifaces

        const primary = this.pickInterface(ifaces)
        if (!primary) {
          this.currentName = ''
          this.primaryStatus = 'down'
          return
        }

        this.currentName = primary.name
        this.primaryStatus = primary.state === 'up' ? 'up' : 'down'

        // Compute per-second rates from byte counter deltas. The first
        // sample after a mount or interface switch has nothing to compare
        // against, so we skip it.
        const now = Date.now()
        const rx = Number(primary.bytesRecv) || 0
        const tx = Number(primary.bytesSent) || 0
        if (this._lastRx != null && this._lastSampleTs > 0) {
          const dtSec = Math.max(0.5, (now - this._lastSampleTs) / 1000)
          // Guard against counter resets (e.g. interface restart).
          const rxRate = Math.max(0, (rx - this._lastRx) / dtSec)
          const txRate = Math.max(0, (tx - this._lastTx) / dtSec)
          this.rxSamples = [...this.rxSamples, rxRate].slice(-SAMPLE_WINDOW)
          this.txSamples = [...this.txSamples, txRate].slice(-SAMPLE_WINDOW)
          this.rxRate = formatBytes(rxRate)
          this.txRate = formatBytes(txRate)
        }
        this._lastRx = rx
        this._lastTx = tx
        this._lastSampleTs = now
      } catch (e) {
        this.primaryStatus = 'down'
      } finally {
        this.isLoading = false
      }
    },
    linePath(samples) {
      if (!samples || samples.length < 2) return ''
      const max = Math.max(...samples, 1)
      const step = this.graphWidth / (SAMPLE_WINDOW - 1)
      const pts = samples.map((v, i) => {
        const x = (i + (SAMPLE_WINDOW - samples.length)) * step
        const y = this.graphHeight - (v / max) * (this.graphHeight - 2) - 1
        return `${x.toFixed(2)},${y.toFixed(2)}`
      })
      return `M${pts.join(' L')}`
    },
    fillPath(samples) {
      const line = this.linePath(samples)
      if (!line || samples.length < 2) return ''
      const step = this.graphWidth / (SAMPLE_WINDOW - 1)
      const startX = ((SAMPLE_WINDOW - samples.length)) * step
      const endX = (SAMPLE_WINDOW - 1) * step
      return `${line} L${endX},${this.graphHeight} L${startX},${this.graphHeight} Z`
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
  top: -10px; left: 50%;
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
  margin-bottom: 0.65rem;
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
  margin-bottom: 0.7rem;
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

.net-primary-text { flex: 1; min-width: 0; }

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

.net-picker {
  background: rgba(0, 0, 0, 0.06);
  border: none;
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 0.75rem;
  color: #1f2937;
  cursor: pointer;
  outline: none;
  font-family: inherit;

  &:focus { background: rgba(45, 95, 78, 0.16); }
}

.net-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.7rem;
}

.net-stat {
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  padding: 0.5rem 0.65rem;
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

.net-graph {
  display: block;
  width: 100%;
  height: 36px;
  margin-top: 0.25rem;
}

.net-graph-line {
  fill: none;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;

  &.is-rx { stroke: #2d5f4e; }
  &.is-tx { stroke: #b45f6d; }
}

.net-graph-fill {
  stroke: none;

  &.is-rx { fill: rgba(45, 95, 78, 0.22); }
  &.is-tx { fill: rgba(180, 95, 109, 0.18); }
}
</style>
