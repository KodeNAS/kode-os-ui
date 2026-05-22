<template>
  <div class="kode-tile clock-widget" :class="`is-${mode}`" @click="toggleMode" :title="$t('Click to switch between digital and analog')">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>

    <!-- Digital -->
    <template v-if="mode === 'digital'">
      <div class="clock-time">{{ formattedTime }}</div>
      <div class="clock-date">{{ formattedDate }}</div>
    </template>

    <!-- Analog -->
    <template v-else>
      <svg class="analog-face" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="48" class="face-bg" />
        <circle cx="50" cy="50" r="48" class="face-ring" />
        <!-- Hour ticks -->
        <g class="face-ticks">
          <line v-for="t in 12" :key="`t-${t}`"
                x1="50" :y1="4" x2="50" :y2="9"
                :transform="`rotate(${t * 30} 50 50)`" />
        </g>
        <!-- Hands -->
        <line class="hand hour"
              x1="50" y1="50"
              :x2="50 + Math.sin(hourAngle) * 22"
              :y2="50 - Math.cos(hourAngle) * 22" />
        <line class="hand minute"
              x1="50" y1="50"
              :x2="50 + Math.sin(minuteAngle) * 32"
              :y2="50 - Math.cos(minuteAngle) * 32" />
        <line class="hand second"
              x1="50" y1="50"
              :x2="50 + Math.sin(secondAngle) * 36"
              :y2="50 - Math.cos(secondAngle) * 36" />
        <circle cx="50" cy="50" r="2.5" class="face-pin" />
      </svg>
      <div class="clock-date analog-date">{{ formattedDate }}</div>
    </template>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

const MODE_KEY = 'kode_clock_mode'  // 'digital' | 'analog'

export default {
  name: 'ClockWidget',
  mixins: [hintMode],
  data() {
    let saved = 'digital'
    try { saved = localStorage.getItem(MODE_KEY) || 'digital' } catch (e) { /* ignore */ }
    return {
      now: new Date(),
      mode: saved === 'analog' ? 'analog' : 'digital',
      timer: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Local time and date. Click the tile to swap between digital and analog faces.')
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
    secondAngle() {
      return (this.now.getSeconds() / 60) * Math.PI * 2
    },
    minuteAngle() {
      const m = this.now.getMinutes() + this.now.getSeconds() / 60
      return (m / 60) * Math.PI * 2
    },
    hourAngle() {
      const h = (this.now.getHours() % 12) + this.now.getMinutes() / 60
      return (h / 12) * Math.PI * 2
    },
  },
  mounted() {
    this.timer = setInterval(() => { this.now = new Date() }, 1000)
  },
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    toggleMode() {
      this.mode = this.mode === 'digital' ? 'analog' : 'digital'
      try { localStorage.setItem(MODE_KEY, this.mode) } catch (e) { /* ignore */ }
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
  padding: 1.25rem 1.5rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
  text-align: center;
  cursor: pointer;
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

/* Analog face */
.analog-face {
  width: 140px;
  height: 140px;
  margin: 0 auto 0.4rem;
  display: block;

  .face-bg { fill: #fff; }
  .face-ring {
    fill: none;
    stroke: rgba(45, 95, 78, 0.18);
    stroke-width: 2;
  }
  .face-ticks line {
    stroke: rgba(31, 41, 55, 0.5);
    stroke-width: 1.6;
    stroke-linecap: round;
  }
  .hand {
    stroke-linecap: round;
    transition: x2 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                y2 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &.hour   { stroke: #1f2937; stroke-width: 3.5; }
    &.minute { stroke: #1f2937; stroke-width: 2.5; }
    &.second {
      stroke: #b45f6d;
      stroke-width: 1.5;
      // Disable transition on second hand for crisp ticks.
      transition: none;
    }
  }
  .face-pin {
    fill: #b45f6d;
  }
}

.analog-date {
  margin-top: 0.2rem;
}
</style>
