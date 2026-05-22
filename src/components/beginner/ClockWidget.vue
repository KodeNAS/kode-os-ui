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
        <defs>
          <radialGradient id="faceShade" cx="50%" cy="42%" r="55%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="85%" stop-color="#f5f7fa" />
            <stop offset="100%" stop-color="#e6e9ee" />
          </radialGradient>
        </defs>

        <!-- Outer ring + face -->
        <circle cx="50" cy="50" r="48" class="face-outer" />
        <circle cx="50" cy="50" r="46" class="face-bg" fill="url(#faceShade)" />
        <circle cx="50" cy="50" r="46" class="face-inner-ring" />

        <!-- Cardinal ticks (12 / 3 / 6 / 9) — thick + long -->
        <g class="ticks-cardinal">
          <line v-for="t in [0, 3, 6, 9]" :key="`c-${t}`"
                x1="50" y1="5" x2="50" y2="13"
                :transform="`rotate(${t * 30} 50 50)`" />
        </g>
        <!-- Hour ticks (the other 8) — thinner, shorter -->
        <g class="ticks-hour">
          <line v-for="t in [1, 2, 4, 5, 7, 8, 10, 11]" :key="`h-${t}`"
                x1="50" y1="5.5" x2="50" y2="10"
                :transform="`rotate(${t * 30} 50 50)`" />
        </g>

        <!-- Hour hand: rooted slightly behind center for a more watch-like look -->
        <line class="hand hour"
              :x1="50 - Math.sin(hourAngle) * 4"
              :y1="50 + Math.cos(hourAngle) * 4"
              :x2="50 + Math.sin(hourAngle) * 22"
              :y2="50 - Math.cos(hourAngle) * 22" />
        <!-- Minute hand: longer, thinner -->
        <line class="hand minute"
              :x1="50 - Math.sin(minuteAngle) * 5"
              :y1="50 + Math.cos(minuteAngle) * 5"
              :x2="50 + Math.sin(minuteAngle) * 32"
              :y2="50 - Math.cos(minuteAngle) * 32" />
        <!-- Second hand with a short counterweight tail -->
        <line class="hand second"
              :x1="50 - Math.sin(secondAngle) * 8"
              :y1="50 + Math.cos(secondAngle) * 8"
              :x2="50 + Math.sin(secondAngle) * 38"
              :y2="50 - Math.cos(secondAngle) * 38" />

        <!-- Center hub: dark ring with terracotta inset for a brass-pin feel -->
        <circle cx="50" cy="50" r="3.2" class="hub-outer" />
        <circle cx="50" cy="50" r="1.4" class="hub-inner" />
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

/* Analog face — slate-on-bone with a soft inset ring and brass hub.
   100x100 viewBox keeps coordinate math simple; the actual rendered size
   is set on the SVG element via width/height. filter: drop-shadow gives
   subtle depth without needing inner-shadow gymnastics. */
.analog-face {
  width: 160px;
  height: 160px;
  margin: 0 auto 0.45rem;
  display: block;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.22));

  /* Outer ring — the requested "bit of black outline". */
  .face-outer {
    fill: #1a1f2e;
  }
  .face-bg {
    /* fill set inline via gradient id */
  }
  .face-inner-ring {
    fill: none;
    stroke: rgba(26, 31, 46, 0.18);
    stroke-width: 0.6;
  }

  .ticks-cardinal line {
    stroke: #1a1f2e;
    stroke-width: 2.4;
    stroke-linecap: round;
  }
  .ticks-hour line {
    stroke: rgba(26, 31, 46, 0.78);
    stroke-width: 1.3;
    stroke-linecap: round;
  }

  .hand {
    stroke-linecap: round;
    transition: x1 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                y1 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                x2 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                y2 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &.hour   {
      stroke: #1a1f2e;
      stroke-width: 4;
    }
    &.minute {
      stroke: #1a1f2e;
      stroke-width: 2.6;
    }
    &.second {
      stroke: #b45f6d;
      stroke-width: 1.2;
      /* Crisp tick rather than easing for the second hand. */
      transition: none;
    }
  }

  .hub-outer {
    fill: #1a1f2e;
  }
  .hub-inner {
    fill: #b45f6d;
  }
}

.analog-date {
  margin-top: 0.2rem;
}
</style>
