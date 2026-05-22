<template>
  <div class="kode-tile weather-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <header class="weather-header">
      <h2 class="tile-title">{{ $t('Weather') }}</h2>
      <span class="weather-location">{{ locationName }}</span>
    </header>

    <div v-if="isLoading" class="weather-loading">{{ $t('Loading...') }}</div>
    <div v-else-if="error" class="weather-error">{{ $t('Couldn\'t reach the weather service.') }}</div>
    <div v-else>
      <div class="weather-now">
        <div class="now-icon">{{ currentEmoji }}</div>
        <div class="now-numbers">
          <div class="now-temp">{{ temp }}°</div>
          <div class="now-condition">{{ condition }}</div>
          <div v-if="feelsLike != null" class="now-feels">{{ $t('Feels like') }} {{ feelsLike }}°</div>
        </div>
      </div>

      <!-- Today extras: humidity / wind / sunrise / sunset -->
      <div class="weather-extras">
        <div class="extra">
          <div class="extra-label">{{ $t('Humidity') }}</div>
          <div class="extra-value">{{ humidity != null ? `${humidity}%` : '—' }}</div>
        </div>
        <div class="extra">
          <div class="extra-label">{{ $t('Wind') }}</div>
          <div class="extra-value">{{ wind != null ? `${wind} km/h` : '—' }}</div>
        </div>
        <div class="extra">
          <div class="extra-label">{{ $t('Sunrise') }}</div>
          <div class="extra-value">{{ sunrise || '—' }}</div>
        </div>
        <div class="extra">
          <div class="extra-label">{{ $t('Sunset') }}</div>
          <div class="extra-value">{{ sunset || '—' }}</div>
        </div>
      </div>

      <!-- 5-day forecast strip -->
      <div v-if="forecast.length > 0" class="weather-forecast">
        <div v-for="d in forecast" :key="d.date" class="forecast-day">
          <div class="forecast-day-label">{{ d.label }}</div>
          <div class="forecast-emoji">{{ d.emoji }}</div>
          <div class="forecast-temps">
            <span class="forecast-high">{{ d.high }}°</span>
            <span class="forecast-low">{{ d.low }}°</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

// Open-Meteo weather codes mapped to label + emoji.
const WEATHER_CODES = {
  0:  { label: 'Clear',           emoji: '☀️' },
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

// Toronto default — user can configure later via the deferred setup wizard.
const DEFAULT_LAT = 43.65
const DEFAULT_LON = -79.38
const DEFAULT_NAME = 'Toronto'

function formatTime(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch (e) { return '' }
}

function dayLabel(iso, offset) {
  if (offset === 0) return 'Today'
  if (offset === 1) return 'Tmrw'
  try {
    return new Date(iso).toLocaleDateString([], { weekday: 'short' })
  } catch (e) { return '' }
}

export default {
  name: 'WeatherWidget',
  mixins: [hintMode],
  data() {
    return {
      temp: null,
      condition: '',
      currentEmoji: '🌡️',
      feelsLike: null,
      humidity: null,
      wind: null,
      sunrise: '',
      sunset: '',
      forecast: [],
      locationName: DEFAULT_NAME,
      isLoading: true,
      error: false,
      pollId: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Live weather from Open-Meteo: current + feels-like, humidity, wind, sunrise/sunset, and a 5-day forecast. Refreshes every 15 minutes.')
    },
  },
  mounted() {
    this.fetchWeather()
    this.pollId = setInterval(() => this.fetchWeather(), 15 * 60 * 1000)
  },
  beforeDestroy() {
    if (this.pollId) clearInterval(this.pollId)
  },
  methods: {
    async fetchWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LAT}&longitude=${DEFAULT_LON}` +
          `&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m` +
          `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset` +
          `&forecast_days=5&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()

        const c = data.current || {}
        this.temp = Math.round(c.temperature_2m)
        this.feelsLike = c.apparent_temperature != null ? Math.round(c.apparent_temperature) : null
        this.humidity = c.relative_humidity_2m != null ? Math.round(c.relative_humidity_2m) : null
        this.wind = c.wind_speed_10m != null ? Math.round(c.wind_speed_10m) : null

        const code = WEATHER_CODES[c.weather_code]
        this.condition = code ? code.label : 'Unknown'
        this.currentEmoji = code ? code.emoji : '🌡️'

        const daily = data.daily || {}
        this.sunrise = formatTime((daily.sunrise && daily.sunrise[0]))
        this.sunset = formatTime((daily.sunset && daily.sunset[0]))

        const days = []
        const len = (daily.time || []).length
        for (let i = 0; i < len; i++) {
          const dCode = WEATHER_CODES[daily.weather_code && daily.weather_code[i]]
          days.push({
            date: daily.time[i],
            label: dayLabel(daily.time[i], i),
            emoji: dCode ? dCode.emoji : '🌡️',
            high: Math.round(daily.temperature_2m_max[i]),
            low: Math.round(daily.temperature_2m_min[i]),
          })
        }
        this.forecast = days
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
  top: -10px; left: 50%;
  transform: translate(-50%, -100%);
  background: rgba(15, 25, 30, 0.92);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  line-height: 1.4;
  max-width: 280px;
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
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.7rem;
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
.weather-location {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
}

.weather-loading,
.weather-error {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.55);
  padding: 0.5rem 0;
}

.weather-now {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.85rem;
}
.now-icon { font-size: 2.6rem; line-height: 1; }
.now-numbers { flex: 1; min-width: 0; }
.now-temp {
  font-size: 2rem;
  font-weight: 500;
  color: #1f2937;
  letter-spacing: -0.02em;
  line-height: 1;
  font-feature-settings: 'tnum' 1;
}
.now-condition {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.7);
  margin-top: 0.2rem;
}
.now-feels {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 1px;
}

.weather-extras {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.85rem;
}
.extra {
  background: rgba(0, 0, 0, 0.04);
  border-radius: 9px;
  padding: 0.4rem 0.6rem;
}
.extra-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.55);
  font-weight: 600;
}
.extra-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  font-feature-settings: 'tnum' 1;
  margin-top: 1px;
}

.weather-forecast {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.35rem;
  padding-top: 0.65rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.forecast-day {
  text-align: center;
  padding: 0.25rem 0;
}
.forecast-day-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.55);
  letter-spacing: 0.04em;
  font-weight: 600;
}
.forecast-emoji { font-size: 1.25rem; line-height: 1; margin: 0.25rem 0; }
.forecast-temps {
  display: flex;
  justify-content: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-feature-settings: 'tnum' 1;
}
.forecast-high { color: #1f2937; font-weight: 500; }
.forecast-low  { color: rgba(0, 0, 0, 0.5); }
</style>
