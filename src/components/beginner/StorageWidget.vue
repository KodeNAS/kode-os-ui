<template>
  <div class="kode-tile storage-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <header class="tile-header">
      <h2 class="tile-title">{{ $t('Storage') }}</h2>
      <span class="storage-health" :class="healthClass">{{ healthLabel }}</span>
    </header>

    <div v-if="isLoading" class="st-loading">{{ $t('Loading...') }}</div>
    <div v-else>
      <div class="storage-headline">
        <span class="storage-free">{{ formatGB(free) }} GB</span>
        <span class="storage-free-label">{{ $t('free of {n} GB', { n: formatGB(total) }) || `free of ${formatGB(total)} GB` }}</span>
      </div>
      <div class="storage-bar">
        <div class="storage-bar-fill" :class="barClass" :style="{ width: usedPct + '%' }"></div>
      </div>
      <div class="storage-rows">
        <div class="storage-row">
          <span class="dot is-used"></span>
          <span class="storage-row-label">{{ $t('Used') }}</span>
          <span class="storage-row-value">{{ formatGB(used) }} GB</span>
        </div>
        <div class="storage-row">
          <span class="dot is-free"></span>
          <span class="storage-row-label">{{ $t('Free') }}</span>
          <span class="storage-row-value">{{ formatGB(free) }} GB</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

export default {
  name: 'StorageWidget',
  mixins: [hintMode],
  data() {
    return {
      isLoading: true,
      total: 0,
      used: 0,
      free: 0,
      pollId: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Disk usage on your pebble. Health is green under 70%, amber under 90%, red above. Refreshes every 30 seconds.')
    },
    usedPct() {
      return this.total > 0 ? Math.round(this.used / this.total * 100) : 0
    },
    barClass() {
      if (this.usedPct >= 90) return 'is-danger'
      if (this.usedPct >= 70) return 'is-warning'
      return 'is-ok'
    },
    healthLabel() {
      if (this.usedPct >= 90) return this.$t('Full')
      if (this.usedPct >= 70) return this.$t('Filling')
      return this.$t('Healthy')
    },
    healthClass() {
      if (this.usedPct >= 90) return 'is-danger'
      if (this.usedPct >= 70) return 'is-warning'
      return 'is-ok'
    },
  },
  mounted() {
    this.fetch()
    this.pollId = setInterval(() => this.fetch(), 30000)
  },
  beforeDestroy() {
    if (this.pollId) clearInterval(this.pollId)
  },
  methods: {
    async fetch() {
      try {
        const res = await this.$api.sys.getUtilization()
        const disk = (res && res.data && res.data.data && res.data.data.disk) || {}
        this.free = disk.free || disk.avail || 0
        this.used = disk.used || 0
        this.total = disk.total || (this.used + this.free)
      } catch (e) {
        /* keep prior */
      } finally {
        this.isLoading = false
      }
    },
    formatGB(b) {
      return Math.round((Number(b) || 0) / (1024 ** 3))
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

.tile-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
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

.storage-health {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;

  &.is-ok      { background: rgba(45, 95, 78, 0.18);  color: #2d5f4e; }
  &.is-warning { background: rgba(196, 127, 0, 0.18); color: #c47f00; }
  &.is-danger  { background: rgba(176, 74, 74, 0.18); color: #b04a4a; }
}

.st-loading { font-size: 0.875rem; color: rgba(0,0,0,.55); padding: 0.5rem 0; }

.storage-headline {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.storage-free {
  font-size: 1.5rem;
  font-weight: 500;
  color: #1f2937;
  letter-spacing: -0.02em;
  font-feature-settings: 'tnum' 1;
}

.storage-free-label {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
}

.storage-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.6rem;
}

.storage-bar-fill {
  height: 100%;
  transition: width 0.6s ease;
  border-radius: 4px;

  &.is-ok      { background: linear-gradient(90deg, #2d5f4e, #3f7a66); }
  &.is-warning { background: linear-gradient(90deg, #c47f00, #e6a02a); }
  &.is-danger  { background: linear-gradient(90deg, #a83239, #d04a51); }
}

.storage-rows {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
}

.storage-row {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.is-used { background: #2d5f4e; }
  &.is-free { background: rgba(0, 0, 0, 0.12); }
}

.storage-row-label { color: rgba(0, 0, 0, 0.6); }
.storage-row-value {
  color: #1f2937;
  font-weight: 500;
  font-feature-settings: 'tnum' 1;
}
</style>
