<template>
  <div class="kode-tile network-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <header class="tile-header">
      <h2 class="tile-title">{{ $t('Network') }}</h2>
    </header>

    <div v-if="isLoading" class="net-loading">{{ $t('Loading...') }}</div>
    <div v-else class="net-rows">
      <div class="net-row">
        <span class="net-icon-wrap">
          <b-icon :icon="primaryType === 'wireless' ? 'wifi' : 'computer-outline'" pack="casa" size="is-small" />
        </span>
        <span class="net-label">{{ primaryName }}</span>
        <span class="net-pill" :class="primaryStatus === 'up' ? 'is-up' : 'is-down'">
          {{ primaryStatus === 'up' ? $t('Online') : $t('Offline') }}
        </span>
      </div>
      <div v-if="primaryRx" class="net-stats">
        <span class="net-stat">
          <b-icon icon="down-outline" pack="casa" size="is-small" />
          {{ primaryRx }}
        </span>
        <span class="net-stat">
          <b-icon icon="up-outline" pack="casa" size="is-small" />
          {{ primaryTx }}
        </span>
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
  name: 'NetworkInfoWidget',
  mixins: [hintMode],
  data() {
    return {
      isLoading: true,
      primaryName: '',
      primaryType: 'wired',
      primaryStatus: 'up',
      primaryRx: '',
      primaryTx: '',
      pollId: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Active network interface (Ethernet or Wi-Fi) plus current usage. Refreshes every 5 seconds.')
    },
  },
  mounted() {
    this.fetch()
    this.pollId = setInterval(() => this.fetch(), 5000)
  },
  beforeDestroy() {
    if (this.pollId) clearInterval(this.pollId)
  },
  methods: {
    async fetch() {
      try {
        const res = await this.$api.sys.getNetworkInfo()
        const data = (res && res.data && res.data.data) || []
        // Defensive: the upstream shape can be an array of interfaces or
        // an object. Walk until we find one with bytes_recv / bytes_sent.
        const list = Array.isArray(data) ? data : (data.network || data.interfaces || Object.values(data))
        // Prefer wireless if present + up; otherwise first wired up; else first.
        const ranked = (list || [])
          .filter(i => i && (i.name || i.interface_name))
          .map(i => ({
            name: i.name || i.interface_name,
            type: (i.driver || i.type || (i.is_wireless ? 'wireless' : 'wired') || '').toString().toLowerCase(),
            up: (i.flags || []).includes('up') || i.is_up === true || i.state === 'up' || true,
            rx: Number(i.bytes_recv || i.rx || 0),
            tx: Number(i.bytes_sent || i.tx || 0),
          }))
        const prefer = ranked.find(i => i.type.includes('wireless') && i.up) || ranked.find(i => i.up) || ranked[0]
        if (prefer) {
          this.primaryName = prefer.name || 'eth0'
          this.primaryType = prefer.type.includes('wireless') ? 'wireless' : 'wired'
          this.primaryStatus = prefer.up ? 'up' : 'down'
          this.primaryRx = formatBytes(prefer.rx)
          this.primaryTx = formatBytes(prefer.tx)
        } else {
          this.primaryName = this.$t('No interface')
          this.primaryStatus = 'down'
        }
      } catch (e) {
        this.primaryName = this.$t('Couldn\'t read network')
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
  max-width: 260px;
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
  margin-bottom: 0.65rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.tile-title {
  font-size: 0.9375rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  color: rgba(31, 41, 55, 0.7);
  margin: 0;
}

.net-loading { font-size: 0.875rem; color: rgba(0,0,0,.55); padding: 0.5rem 0; }

.net-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.9375rem;
}

.net-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2d5f4e, #3f7a66);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.net-label {
  flex: 1;
  color: #1f2937;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.net-pill {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;

  &.is-up   { background: rgba(45, 95, 78, 0.18); color: #2d5f4e; }
  &.is-down { background: rgba(176, 74, 74, 0.18); color: #b04a4a; }
}

.net-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.65);
  font-feature-settings: 'tnum' 1;
}

.net-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
</style>
