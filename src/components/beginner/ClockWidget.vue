<template>
  <div
    class="kode-tile clock-widget"
    :class="`is-${settings.mode}`"
    @click="onTileClick"
    :title="$t('Click to switch face. Gear in edit mode for more options.')"
  >
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <button
      v-if="editMode"
      type="button"
      class="widget-gear"
      :aria-label="$t('Clock settings')"
      :title="$t('Clock settings')"
      @click.stop="openSettings"
    >
      <b-icon icon="control-outline" pack="casa" size="is-small" />
    </button>

    <!-- Digital -->
    <template v-if="settings.mode === 'digital'">
      <div class="clock-time">{{ formattedTime }}</div>
      <div v-if="settings.showDate" class="clock-date">{{ formattedDate }}</div>
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

        <circle cx="50" cy="50" r="48" class="face-outer" />
        <circle cx="50" cy="50" r="46" class="face-bg" fill="url(#faceShade)" />
        <circle cx="50" cy="50" r="46" class="face-inner-ring" />

        <g class="ticks-cardinal">
          <line v-for="t in [0, 3, 6, 9]" :key="`c-${t}`"
                x1="50" y1="5" x2="50" y2="13"
                :transform="`rotate(${t * 30} 50 50)`" />
        </g>
        <g class="ticks-hour">
          <line v-for="t in [1, 2, 4, 5, 7, 8, 10, 11]" :key="`h-${t}`"
                x1="50" y1="5.5" x2="50" y2="10"
                :transform="`rotate(${t * 30} 50 50)`" />
        </g>

        <line class="hand hour"
              :x1="50 - Math.sin(hourAngle) * 4"
              :y1="50 + Math.cos(hourAngle) * 4"
              :x2="50 + Math.sin(hourAngle) * 22"
              :y2="50 - Math.cos(hourAngle) * 22" />
        <line class="hand minute"
              :x1="50 - Math.sin(minuteAngle) * 5"
              :y1="50 + Math.cos(minuteAngle) * 5"
              :x2="50 + Math.sin(minuteAngle) * 32"
              :y2="50 - Math.cos(minuteAngle) * 32" />
        <line v-if="settings.showSeconds" class="hand second"
              :x1="50 - Math.sin(secondAngle) * 8"
              :y1="50 + Math.cos(secondAngle) * 8"
              :x2="50 + Math.sin(secondAngle) * 38"
              :y2="50 - Math.cos(secondAngle) * 38" />

        <circle cx="50" cy="50" r="3.2" class="hub-outer" />
        <circle cx="50" cy="50" r="1.4" class="hub-inner" />
      </svg>
      <div v-if="settings.showDate" class="clock-date analog-date">{{ formattedDate }}</div>
    </template>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'
import ClockSettingsModal from '@/components/beginner/ClockSettingsModal.vue'

const SETTINGS_KEY = 'kode_clock_settings'
const DEFAULT_SETTINGS = {
  mode: 'digital',     // 'digital' | 'analog'
  format: '24h',       // '12h' | '24h'
  showSeconds: false,  // digital: include :SS / analog: show second hand
  showDate: true,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

export default {
  name: 'ClockWidget',
  mixins: [hintMode],
  props: {
    editMode: { type: Boolean, default: false },
  },
  data() {
    return {
      now: new Date(),
      settings: loadSettings(),
      timer: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Local time + date. Click to swap digital/analog. Gear in edit mode for 12/24h, seconds, etc.')
    },
    formattedTime() {
      try {
        return this.now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: this.settings.showSeconds ? '2-digit' : undefined,
          hour12: this.settings.format === '12h',
        })
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
    onTileClick(e) {
      // Don't toggle mode when the click landed on the gear icon.
      if (e && e.target && e.target.closest && e.target.closest('.widget-gear')) return
      this.settings = { ...this.settings, mode: this.settings.mode === 'digital' ? 'analog' : 'digital' }
      this.persist()
    },
    persist() {
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)) } catch (e) { /* ignore */ }
    },
    openSettings() {
      this.$buefy.modal.open({
        parent: this,
        component: ClockSettingsModal,
        hasModalCard: true,
        trapFocus: true,
        scroll: 'keep',
        animation: 'zoom-in',
        props: { value: { ...this.settings } },
        events: {
          save: (next) => {
            this.settings = { ...this.settings, ...next }
            this.persist()
          },
        },
      })
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

/* Per-widget gear button — visible only in edit mode. */
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

  &:hover {
    background: rgba(45, 95, 78, 0.18);
    color: #2d5f4e;
  }
}

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

.analog-face {
  width: 160px;
  height: 160px;
  margin: 0 auto 0.45rem;
  display: block;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.22));

  .face-outer { fill: #1a1f2e; }
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

    &.hour   { stroke: #1a1f2e; stroke-width: 4; }
    &.minute { stroke: #1a1f2e; stroke-width: 2.6; }
    &.second {
      stroke: #b45f6d;
      stroke-width: 1.2;
      transition: none;
    }
  }
  .hub-outer { fill: #1a1f2e; }
  .hub-inner { fill: #b45f6d; }
}

.analog-date { margin-top: 0.2rem; }
</style>
