<template>
  <div class="kode-tile apps-running-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <div class="ar-main">
      <div class="ar-count">{{ running }}</div>
      <div class="ar-text">
        <div class="ar-label">{{ $t('apps running') }}</div>
        <div class="ar-sublabel">{{ $t('out of {n} installed', { n: total }) || `of ${total} installed` }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

export default {
  name: 'AppsRunningWidget',
  mixins: [hintMode],
  data() {
    return {
      running: 0,
      total: 0,
      pollId: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('How many apps are running on your pebble right now. Refreshes every 15 seconds.')
    },
  },
  mounted() {
    this.fetch()
    this.pollId = setInterval(() => this.fetch(), 15000)
  },
  beforeDestroy() {
    if (this.pollId) clearInterval(this.pollId)
  },
  methods: {
    async fetch() {
      try {
        const res = await this.$openAPI.appManagement.compose.myComposeAppList()
        const data = (res && res.data && res.data.data) || {}
        const apps = Array.isArray(data) ? data : Object.values(data)
        this.total = apps.length
        this.running = apps.filter(a => {
          const s = (a && (a.status || (a.main_app && a.main_app.status))) || ''
          return /run/i.test(s)
        }).length
      } catch (e) { /* keep prior values */ }
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

.ar-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ar-count {
  font-size: 2.5rem;
  font-weight: 500;
  color: #2d5f4e;
  line-height: 1;
  letter-spacing: -0.03em;
  font-feature-settings: 'tnum' 1;
}

.ar-text {
  flex: 1;
  min-width: 0;
}

.ar-label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1f2937;
}

.ar-sublabel {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 1px;
}
</style>
