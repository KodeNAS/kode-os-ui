<template>
  <div class="kode-tile weather-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <button
      v-if="editMode"
      type="button"
      class="widget-gear"
      :aria-label="$t('Weather settings')"
      :title="$t('Weather settings')"
      @click.stop="openSettings"
    >
      <b-icon icon="control-outline" pack="casa" size="is-small" />
    </button>
    <button
      type="button"
      class="weather-toggle"
      :class="{ 'has-gear': editMode }"
      :aria-label="expanded ? $t('Collapse details') : $t('Show more details')"
      :title="expanded ? $t('Hide details') : $t('Show details')"
      @click="toggleExpanded"
    >
      <b-icon :icon="expanded ? 'arrow-up' : 'arrow-down'" pack="casa" size="is-small" />
    </button>
    <header class="weather-header">
      <h2 class="tile-title">{{ $t('Weather') }}</h2>
      <span class="weather-location">{{ settings.locationName }}</span>
    </header>

    <div v-if="isLoading" class="weather-loading">{{ $t('Loading...') }}</div>
    <div v-else-if="error" class="weather-error">{{ $t('Couldn\'t reach the weather service.') }}</div>
    <div v-else>
      <!-- Always visible: current temp + condition. -->
      <div class="weather-now">
        <div class="now-icon">{{ currentEmoji }}</div>
        <div class="now-numbers">
          <div class="now-temp">{{ temp }}°</div>
          <div class="now-condition">{{ condition }}</div>
          <div v-if="feelsLike != null" class="now-feels">{{ $t('Feels like') }} {{ feelsLike }}°</div>
        </div>
      </div>

      <!-- Collapsible: extras grid + forecast strip. -->
      <transition name="weather-expand">
        <div v-if="expanded" class="weather-collapsible">
          <div class="weather-extras">
            <div class="extra">
              <div class="extra-label">{{ $t('Humidity') }}</div>
              <div class="extra-value">{{ humidity != null ? `${humidity}%` : '—' }}</div>
            </div>
            <div class="extra">
              <div class="extra-label">{{ $t('Wind') }}</div>
              <div class="extra-value">{{ wind != null ? `${wind} ${windUnit}` : '—' }}</div>
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

          <!-- Horizontally scrollable forecast strip. Each day card has a
               fixed minimum width so 5/7/14-day layouts never compress;
               instead the user scrolls/swipes to see further out. The
               edge fades hint that there's more on either side. -->
          <div v-if="settings.forecastDays > 0 && forecast.length > 0" class="weather-forecast-wrap">
            <div class="weather-forecast" ref="forecastStrip">
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
      </transition>
    </div>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'
import WeatherSettingsModal from '@/components/beginner/WeatherSettingsModal.vue'

const SETTINGS_KEY = 'kode_weather_settings'
const DEFAULT_SETTINGS = {
  locationName: 'Toronto',
  latitude: 43.65,
  longitude: -79.38,
  units: 'celsius',     // 'celsius' | 'fahrenheit'
  forecastDays: 5,      // 0 / 5 / 7 / 14
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

const EXPANDED_KEY = 'kode_weather_expanded'

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
  props: {
    editMode: { type: Boolean, default: false },
  },
  data() {
    let savedExpanded = false
    try { savedExpanded = localStorage.getItem(EXPANDED_KEY) === '1' } catch (e) { /* ignore */ }
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
      settings: loadSettings(),
      isLoading: true,
      error: false,
      pollId: null,
      expanded: savedExpanded,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Live weather from Open-Meteo. Gear in edit mode for location, units, and forecast horizon.')
    },
    windUnit() {
      return this.settings.units === 'fahrenheit' ? 'mph' : 'km/h'
    },
  },
  watch: {
    settings: {
      handler() { this.fetchWeather() },
      deep: true,
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
    toggleExpanded() {
      this.expanded = !this.expanded
      try { localStorage.setItem(EXPANDED_KEY, this.expanded ? '1' : '0') } catch (e) { /* ignore */ }
    },
    openSettings() {
      this.$buefy.modal.open({
        parent: this,
        component: WeatherSettingsModal,
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
    async fetchWeather() {
      try {
        const lat = this.settings.latitude
        const lon = this.settings.longitude
        const tempUnit = this.settings.units === 'fahrenheit' ? 'fahrenheit' : 'celsius'
        const windUnit = this.settings.units === 'fahrenheit' ? 'mph' : 'kmh'
        const days = Math.max(1, this.settings.forecastDays || 0)
        const includeDaily = (this.settings.forecastDays || 0) > 0
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m` +
          (includeDaily
            ? `&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&forecast_days=${days}`
            : '&daily=sunrise,sunset&forecast_days=1') +
          `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto`
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

        const forecastDays = []
        const len = (daily.time || []).length
        if (daily.temperature_2m_max && daily.temperature_2m_min) {
          for (let i = 0; i < len; i++) {
            const dCode = WEATHER_CODES[daily.weather_code && daily.weather_code[i]]
            forecastDays.push({
              date: daily.time[i],
              label: dayLabel(daily.time[i], i),
              emoji: dCode ? dCode.emoji : '🌡️',
              high: Math.round(daily.temperature_2m_max[i]),
              low: Math.round(daily.temperature_2m_min[i]),
            })
          }
        }
        this.forecast = forecastDays
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

/* Gear button — identical to ClockWidget so they look uniform in
   edit mode. Sits in the corner; the expand chevron shifts left when
   the gear is showing so they don't overlap. */
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

.weather-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.7rem;
  padding-bottom: 0.5rem;
  padding-right: 70px; /* reserve room for absolute gear + chevron */
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
  flex: 1;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Expand / collapse chevron — pinned top-right, shifts left when the
   edit-mode gear button is showing so the two never overlap. */
.weather-toggle {
  position: absolute;
  top: 11px;
  right: 11px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.55);
  transition: background 0.15s, color 0.15s, right 0.18s ease;
  z-index: 4;

  &:hover { background: rgba(45, 95, 78, 0.18); color: #2d5f4e; }
  &.has-gear { right: 42px; }
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

.weather-collapsible {
  margin-top: 0.85rem;
  overflow: hidden;
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

/* Horizontal-scroll forecast strip. The wrap holds the edge fades and
   the inner div scrolls. Each day card has a fixed minimum width so
   the row never compresses below a readable size. */
.weather-forecast-wrap {
  position: relative;
  margin-top: 0.65rem;
  padding-top: 0.65rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0.65rem;
    bottom: 0;
    width: 18px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.18s ease;
    z-index: 1;
  }
  &::before { left: 0; background: linear-gradient(to right, rgba(245, 247, 250, 0.95), transparent); }
  &::after  { right: 0; background: linear-gradient(to left,  rgba(245, 247, 250, 0.95), transparent); }
  &:hover::before,
  &:hover::after { opacity: 1; }
}

.weather-forecast {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.18) transparent;
  padding-bottom: 4px;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.18);
    border-radius: 4px;
  }
}

.forecast-day {
  flex: 0 0 56px;
  scroll-snap-align: start;
  text-align: center;
  padding: 0.3rem 0.1rem;
  border-radius: 10px;
  transition: background 0.15s ease;

  &:hover { background: rgba(45, 95, 78, 0.08); }
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

/* Collapse / expand transition for the details section. */
.weather-expand-enter-active,
.weather-expand-leave-active {
  transition: opacity 0.22s ease, transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.28s ease;
  max-height: 600px;
}
.weather-expand-enter,
.weather-expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}
</style>
