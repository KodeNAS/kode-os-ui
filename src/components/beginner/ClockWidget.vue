<template>
  <div class="kode-tile clock-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <div class="clock-time">{{ formattedTime }}</div>
    <div class="clock-date">{{ formattedDate }}</div>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

export default {
  name: 'ClockWidget',
  mixins: [hintMode],
  data() {
    return {
      now: new Date(),
      timer: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Local time and date. Updates every second.')
    },
    formattedTime() {
      try {
        return this.now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch (e) { return '' }
    },
    formattedDate() {
      try {
        return this.now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
      } catch (e) { return '' }
    },
  },
  mounted() {
    this.timer = setInterval(() => { this.now = new Date() }, 1000)
  },
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer)
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
  padding: 1.25rem 1.5rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
  text-align: center;
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

.clock-time {
  font-size: 2.25rem;
  font-weight: 500;
  font-feature-settings: 'tnum' 1;
  color: #1f2937;
  letter-spacing: -0.02em;
  line-height: 1;
}

.clock-date {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 0.4rem;
}
</style>
