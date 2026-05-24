<template>
  <div class="kode-tile sysinfo-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <button
      v-if="editMode"
      type="button"
      class="widget-gear"
      :aria-label="$t('System monitor settings')"
      :title="$t('System monitor settings')"
      @click.stop="openSettings"
    >
      <b-icon icon="control-outline" pack="casa" size="is-small" />
    </button>
    <header class="sysinfo-header">
      <h2 class="tile-title">{{ $t('System') }}</h2>
      <span v-if="settings.showTemp && temperature != null" class="sysinfo-temp" :class="tempClass">
        {{ temperature }}°C
      </span>
    </header>

    <div v-if="isLoading" class="sysinfo-loading">{{ $t('Loading...') }}</div>
    <div v-else class="sysinfo-rows">
      <div class="sysinfo-row">
        <div class="sysinfo-row-head">
          <span class="sysinfo-label">
            {{ $t('CPU') }}
            <span v-if="settings.showCores && cores" class="sysinfo-sub">{{ cores }} {{ $t('cores') }}</span>
          </span>
          <span class="sysinfo-value">{{ cpu }}%</span>
        </div>
        <div class="sysinfo-bar">
          <div class="sysinfo-bar-fill" :class="barClass(cpu)" :style="{ width: cpu + '%' }"></div>
        </div>
        <!-- Optional rolling 60-sample sparkline of CPU%, auto-scaled
             so quiet periods still show motion. -->
        <svg
          v-if="settings.showSparkline && cpuSamples.length > 1"
          class="sysinfo-spark"
          viewBox="0 0 100 24"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path :d="cpuSparkLine" class="spark-line" />
          <path :d="cpuSparkFill" class="spark-fill" />
        </svg>
      </div>

      <div class="sysinfo-row">
        <div class="sysinfo-row-head">
          <span class="sysinfo-label">{{ $t('Memory') }}</span>
          <span class="sysinfo-value">
            {{ ram }}%
            <span v-if="settings.showMemBytes && memUsedGb != null" class="sysinfo-sub">
              {{ memUsedGb }} / {{ memTotalGb }} GB
            </span>
          </span>
        </div>
        <div class="sysinfo-bar">
          <div class="sysinfo-bar-fill" :class="barClass(ram)" :style="{ width: ram + '%' }"></div>
        </div>
      </div>

      <div v-if="settings.showStorage" class="sysinfo-row">
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
import SystemInfoSettingsModal from '@/components/beginner/SystemInfoSettingsModal.vue'

const SETTINGS_KEY = 'kode_sysinfo_settings'
const DEFAULT_SETTINGS = {
  showTemp: true,
  showCores: true,
  showMemBytes: true,
  showSparkline: true,
  showStorage: true,
  // 10s default. The sysinfo endpoint walks /proc and shells out for
  // SMART data — at 5s the Pi 5's casaos-main process showed
  // measurable idle CPU just answering this widget.
  pollMs: 10000,
}
const SAMPLE_WINDOW = 30

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

export default {
  name: 'SystemInfoWidget',
  mixins: [hintMode],
  props: {
    editMode: { type: Boolean, default: false },
  },
  data() {
    return {
      cpu: 0,
      ram: 0,
      cores: null,
      temperature: null,
      memUsedGb: null,
      memTotalGb: null,
      storagePct: 0,
      storageFree: '—',
      cpuSamples: [],
      isLoading: true,
      pollId: null,
      settings: loadSettings(),
    }
  },
  computed: {
    hintLabel() {
      return this.$t('CPU, memory, and disk usage on your pebble. Gear in edit mode for extras.')
    },
    tempClass() {
      if (this.temperature == null) return ''
      if (this.temperature >= 75) return 'is-danger'
      if (this.temperature >= 60) return 'is-warning'
      return 'is-ok'
    },
    cpuSparkLine() {
      const s = this.cpuSamples
      if (s.length < 2) return ''
      const step = 100 / (SAMPLE_WINDOW - 1)
      const max = Math.max(...s, 1)
      return 'M' + s.map((v, i) => {
        const x = (i + (SAMPLE_WINDOW - s.length)) * step
        const y = 22 - (v / max) * 20
        return `${x.toFixed(2)},${y.toFixed(2)}`
      }).join(' L')
    },
    cpuSparkFill() {
      const line = this.cpuSparkLine
      if (!line) return ''
      const step = 100 / (SAMPLE_WINDOW - 1)
      const startX = (SAMPLE_WINDOW - this.cpuSamples.length) * step
      const endX = (SAMPLE_WINDOW - 1) * step
      return `${line} L${endX},24 L${startX},24 Z`
    },
  },
  watch: {
    'settings.pollMs'() { this.restartPolling() },
  },
  mounted() {
    this.fetch()
    this.restartPolling()
  },
  beforeDestroy() {
    if (this.pollId) clearInterval(this.pollId)
  },
  methods: {
    restartPolling() {
      if (this.pollId) clearInterval(this.pollId)
      this.pollId = setInterval(() => this.fetch(), this.settings.pollMs || 10000)
    },
    openSettings() {
      this.$buefy.modal.open({
        parent: this,
        component: SystemInfoSettingsModal,
        hasModalCard: true,
        trapFocus: true,
        scroll: 'keep',
        animation: 'zoom-in',
        props: { value: { ...this.settings } },
        events: {
          save: (next) => {
            this.settings = { ...this.settings, ...next }
            try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)) } catch (e) { /* ignore */ }
          },
        },
      })
    },
    async fetch() {
      try {
        const res = await this.$api.sys.getUtilization()
        const data = (res && res.data && res.data.data) || {}
        const cpu = (data.cpu && (data.cpu.percent || data.cpu.usedPercent)) || 0
        this.cores = (data.cpu && data.cpu.num) || null
        this.temperature = (data.cpu && data.cpu.temperature != null)
          ? Math.round(data.cpu.temperature)
          : null
        const mem = data.mem || data.memory || {}
        const ram = mem.usedPercent || mem.percent || 0
        if (mem.total) {
          this.memTotalGb = (mem.total / (1024 ** 3)).toFixed(1)
          this.memUsedGb = ((mem.used || (mem.total - (mem.available || mem.free || 0))) / (1024 ** 3)).toFixed(1)
        }
        const disk = data.sys_disk || data.disk || {}
        const free = Number(disk.avail || disk.free || 0)
        const total = Number(disk.size || disk.total || (Number(disk.used) + free)) || 0
        this.cpu = Math.round(cpu)
        this.ram = Math.round(ram)
        this.cpuSamples = [...this.cpuSamples, this.cpu].slice(-SAMPLE_WINDOW)
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

.widget-gear {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  border: none;
  color: rgba(0, 0, 0, 0.7);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  transition: background 0.15s, color 0.15s;

  &:hover { background: rgba(45, 95, 78, 0.18); color: #2d5f4e; }
}

.sysinfo-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
  padding-bottom: 0.5rem;
  padding-right: 36px; /* reserve room for absolute gear */
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

.sysinfo-temp {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 2px 8px;
  border-radius: 999px;
  font-feature-settings: 'tnum' 1;

  &.is-ok      { background: rgba(45, 95, 78, 0.16); color: #2d5f4e; }
  &.is-warning { background: rgba(196, 127, 0, 0.18); color: #8a5a00; }
  &.is-danger  { background: rgba(168, 50, 57, 0.18); color: #a83239; }
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
  align-items: baseline;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 0.25rem;
}

.sysinfo-label {
  color: rgba(0, 0, 0, 0.6);
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
}

.sysinfo-sub {
  font-size: 0.6875rem;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 500;
  font-feature-settings: 'tnum' 1;
}

.sysinfo-value {
  font-feature-settings: 'tnum' 1;
  font-weight: 500;
  color: #1f2937;
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
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

.sysinfo-spark {
  display: block;
  width: 100%;
  height: 24px;
  margin-top: 0.25rem;
}
.spark-line {
  fill: none;
  stroke: #2d5f4e;
  stroke-width: 1.4;
  vector-effect: non-scaling-stroke;
}
.spark-fill {
  fill: rgba(45, 95, 78, 0.18);
  stroke: none;
}
</style>
