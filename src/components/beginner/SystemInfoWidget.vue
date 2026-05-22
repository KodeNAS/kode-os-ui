<template>
  <div class="kode-tile sysinfo-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <header class="sysinfo-header">
      <h2 class="tile-title">{{ $t('System') }}</h2>
    </header>

    <div v-if="isLoading" class="sysinfo-loading">{{ $t('Loading...') }}</div>
    <div v-else class="sysinfo-rows">
      <div class="sysinfo-row">
        <div class="sysinfo-row-head">
          <span class="sysinfo-label">{{ $t('CPU') }}</span>
          <span class="sysinfo-value">{{ cpu }}%</span>
        </div>
        <div class="sysinfo-bar">
          <div class="sysinfo-bar-fill" :class="barClass(cpu)" :style="{ width: cpu + '%' }"></div>
        </div>
      </div>

      <div class="sysinfo-row">
        <div class="sysinfo-row-head">
          <span class="sysinfo-label">{{ $t('Memory') }}</span>
          <span class="sysinfo-value">{{ ram }}%</span>
        </div>
        <div class="sysinfo-bar">
          <div class="sysinfo-bar-fill" :class="barClass(ram)" :style="{ width: ram + '%' }"></div>
        </div>
      </div>

      <div class="sysinfo-row">
        <div class="sysinfo-row-head">
          <span class="sysinfo-label">{{ $t('Storage free') }}</span>
          <span class="sysinfo-value">{{ storageFree }}</span>
        </div>
        <div class="sysinfo-bar">
          <div class="sysinfo-bar-fill is-ok" :style="{ width: (100 - storagePct) + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

export default {
  name: 'SystemInfoWidget',
  mixins: [hintMode],
  data() {
    return {
      cpu: 0,
      ram: 0,
      storagePct: 0,
      storageFree: '—',
      isLoading: true,
      pollId: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('CPU, memory, and disk usage on your pebble. Refreshes every 10 seconds.')
    },
  },
  mounted() {
    this.fetch()
    this.pollId = setInterval(() => this.fetch(), 10000)
  },
  beforeDestroy() {
    if (this.pollId) clearInterval(this.pollId)
  },
  methods: {
    async fetch() {
      try {
        const res = await this.$api.sys.getUtilization()
        const data = (res && res.data && res.data.data) || {}
        // The CasaOS utilization response shape uses {cpu: {percent}, memory: {usedPercent or percent},
        // disk: {free, used, total}}. Be defensive about the keys.
        const cpu = (data.cpu && (data.cpu.percent || data.cpu.usedPercent)) || 0
        const ram = (data.memory && (data.memory.usedPercent || data.memory.percent)) || 0
        const disk = data.disk || {}
        const free = disk.free || disk.avail || 0
        const total = disk.total || (disk.used + free) || 0
        this.cpu = Math.round(cpu)
        this.ram = Math.round(ram)
        if (total > 0) {
          this.storagePct = Math.round((total - free) / total * 100)
          this.storageFree = `${Math.round(free / (1024 ** 3))} GB`
        } else {
          this.storagePct = 0
          this.storageFree = '—'
        }
      } catch (e) {
        /* keep prior values */
      } finally {
        this.isLoading = false
      }
    },
    barClass(pct) {
      if (pct >= 90) return 'is-danger'
      if (pct >= 70) return 'is-warning'
      return 'is-ok'
    },
  },
}
</script>

<style lang="scss" scoped>
.kode-tile {
  position: relative;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
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

.sysinfo-header {
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

.sysinfo-loading {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.55);
  padding: 0.5rem 0;
}

.sysinfo-rows {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sysinfo-row-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 0.25rem;
}

.sysinfo-label { color: rgba(0, 0, 0, 0.6); }

.sysinfo-value {
  font-feature-settings: 'tnum' 1;
  font-weight: 500;
  color: #1f2937;
}

.sysinfo-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.sysinfo-bar-fill {
  height: 100%;
  transition: width 0.6s ease;
  border-radius: 3px;

  &.is-ok      { background: linear-gradient(90deg, #2d5f4e, #3f7a66); }
  &.is-warning { background: linear-gradient(90deg, #c47f00, #e6a02a); }
  &.is-danger  { background: linear-gradient(90deg, #a83239, #d04a51); }
}
</style>
