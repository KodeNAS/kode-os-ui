<template>
  <div class="kode-tile weather-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <header class="weather-header">
      <h2 class="tile-title">{{ $t('Weather') }}</h2>
    </header>

    <div v-if="isLoading" class="weather-loading">{{ $t('Loading...') }}</div>
    <div v-else-if="error" class="weather-error">{{ $t('Couldn\'t reach the weather service.') }}</div>
    <div v-else class="weather-body">
      <div class="weather-icon">{{ emoji }}</div>
      <div class="weather-numbers">
        <div class="weather-temp">{{ temp }}°</div>
        <div class="weather-condition">{{ condition }}</div>
      </div>
    </div>

    <footer v-if="!isLoading && !error" class="weather-foot">
      {{ locationName }}
    </footer>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

// Open-Meteo weather codes (https://open-meteo.com/en/docs)
// Mapped to a human label and a simple emoji.
const WEATHER_CODES = {
  0:  { label: 'Clear',          emoji: '☀️' },
  1:  { label: 'Mainly clear',    emoji: '🌤️' },
  2:  { label: 'Partly cloudy',   emoji: '⛅' },
  3:  { label: 'Overcast',        emoji: '☁️' },
  45: { label: 'Fog',             emoji: '🌫️' },
  48: { label: 'Rime fog',        emoji: '🌫️' },
  51: { label: 'Light drizzle',   emoji: '🌦️' },
  53: { label: 'Drizzle',         emoji: '🌦️' },
  55: { label: 'Heavy drizzle',   emoji: '🌧️' },
  61: { label: 'Light rain',      emoji: '🌦️' },
  63: { label: 'Rain',            emoji: '🌧️' },
  65: { label: 'Heavy rain',      emoji: '🌧️' },
  71: { label: 'Light snow',      emoji: '🌨️' },
  73: { label: 'Snow',            emoji: '❄️' },
  75: { label: 'Heavy snow',      emoji: '❄️' },
  77: { label: 'Snow grains',     emoji: '🌨️' },
  80: { label: 'Showers',         emoji: '🌦️' },
  81: { label: 'Heavy showers',   emoji: '🌧️' },
  82: { label: 'Violent showers', emoji: '⛈️' },
  85: { label: 'Snow showers',    emoji: '🌨️' },
  86: { label: 'Heavy snow showers', emoji: '❄️' },
  95: { label: 'Thunderstorm',    emoji: '⛈️' },
  96: { label: 'Thunder + hail',  emoji: '⛈️' },
  99: { label: 'Thunder + hail',  emoji: '⛈️' },
}

// Default to Toronto (per brief §8.3 — timezone America/Toronto). User can
// configure location later via a future widget settings flow.
const DEFAULT_LAT = 43.65
const DEFAULT_LON = -79.38
const DEFAULT_NAME = 'Toronto'

export default {
  name: 'WeatherWidget',
  mixins: [hintMode],
  data() {
    return {
      temp: null,
      condition: '',
      emoji: '🌡️',
      locationName: DEFAULT_NAME,
      isLoading: true,
      error: false,
      pollId: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Live weather from Open-Meteo. Refreshes every 15 minutes.')
    },
  },
  mounted() {
    this.fetchWeather()
    // Refresh every 15 minutes.
    this.pollId = setInterval(() => this.fetchWeather(), 15 * 60 * 1000)
  },
  beforeDestroy() {
    if (this.pollId) clearInterval(this.pollId)
  },
  methods: {
    async fetchWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LAT}&longitude=${DEFAULT_LON}&current=temperature_2m,weather_code&temperature_unit=celsius`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const c = data.current || {}
        this.temp = Math.round(c.temperature_2m)
        const code = WEATHER_CODES[c.weather_code]
        this.condition = code ? code.label : 'Unknown'
        this.emoji = code ? code.emoji : '🌡️'
        this.error = false
      } catch (e) {
        this.error = true
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

.weather-header {
  margin-bottom: 0.5rem;
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

.weather-body {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.weather-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.weather-numbers {
  flex: 1;
  min-width: 0;
}

.weather-temp {
  font-size: 1.75rem;
  font-weight: 500;
  color: #1f2937;
  letter-spacing: -0.02em;
  line-height: 1;
  font-feature-settings: 'tnum' 1;
}

.weather-condition {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.65);
  margin-top: 0.2rem;
}

.weather-loading,
.weather-error {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.55);
  padding: 0.5rem 0;
}

.weather-foot {
  margin-top: 0.5rem;
  font-size: 0.6875rem;
  color: rgba(0, 0, 0, 0.5);
  text-align: right;
}
</style>
