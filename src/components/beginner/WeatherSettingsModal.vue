<template>
  <div class="modal-card weather-settings-modal">
    <header class="modal-card-head">
      <h3 class="title is-header">{{ $t('Weather settings') }}</h3>
      <b-icon class="close-button" icon="close-outline" pack="casa" @click.native="$emit('close')" />
    </header>

    <section class="modal-card-body">
      <!-- City picker — geocoded against Open-Meteo. Picks a major place
           and seeds lat/lon. The area picker below refines within it. -->
      <div class="setting-row stacked">
        <label class="setting-label">{{ $t('City / region') }}</label>
        <b-autocomplete
          v-model="cityQuery"
          :data="cityResults"
          :loading="cityLoading"
          :placeholder="$t('Type a city, e.g. Toronto')"
          field="displayName"
          icon-pack="casa"
          icon="show-search-outline"
          clearable
          @typing="onCityTyping"
          @select="onCitySelect"
        >
          <template slot="empty">
            <span v-if="cityQuery && !cityLoading">{{ $t('No matches. Try a different spelling.') }}</span>
          </template>
        </b-autocomplete>
        <div v-if="settings.locationName" class="setting-hint">
          {{ $t('Selected:') }} <strong>{{ settings.locationName }}</strong>
        </div>
      </div>

      <!-- Area picker — optional refinement (e.g. Etobicoke within Toronto).
           Filters results to the city's country + admin1 so we don't show
           a same-named place on the other side of the world. -->
      <div class="setting-row stacked">
        <label class="setting-label">
          {{ $t('Neighborhood / district') }}
          <span class="optional">{{ $t('optional') }}</span>
        </label>
        <b-autocomplete
          v-model="areaQuery"
          :data="areaResults"
          :loading="areaLoading"
          :placeholder="cityContext ? $t('e.g. Etobicoke, Scarborough') : $t('Pick a city first')"
          :disabled="!cityContext"
          field="displayName"
          icon-pack="casa"
          icon="show-search-outline"
          clearable
          @typing="onAreaTyping"
          @select="onAreaSelect"
        >
          <template slot="empty">
            <span v-if="areaQuery && !areaLoading">{{ $t('No matches in this region.') }}</span>
          </template>
        </b-autocomplete>
      </div>

      <!-- "Use my current location" — tries browser geo first, falls back
           to IP-based geolocation (works on HTTP / LAN where geo APIs are
           blocked). Reverse-geocodes the result so the name fills in too. -->
      <div class="setting-row">
        <b-button
          rounded
          size="is-small"
          icon-pack="casa"
          icon-left="show-search-outline"
          :loading="isLocating"
          @click="useMyLocation"
        >
          {{ $t('Use my current location') }}
        </b-button>
        <span v-if="locateNote" class="locate-note">{{ locateNote }}</span>
      </div>

      <div class="setting-row">
        <label class="setting-label">{{ $t('Units') }}</label>
        <div class="setting-options">
          <button
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.units === 'celsius' }"
            @click="settings.units = 'celsius'"
          >
            {{ $t('Celsius (°C)') }}
          </button>
          <button
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.units === 'fahrenheit' }"
            @click="settings.units = 'fahrenheit'"
          >
            {{ $t('Fahrenheit (°F)') }}
          </button>
        </div>
      </div>

      <div class="setting-row">
        <label class="setting-label">{{ $t('Forecast') }}</label>
        <div class="setting-options">
          <button
            v-for="opt in forecastOptions"
            :key="opt.days"
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.forecastDays === opt.days }"
            @click="settings.forecastDays = opt.days"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </section>

    <footer class="modal-card-foot">
      <div class="is-flex-grow-1"></div>
      <b-button rounded @click="$emit('close')">{{ $t('Cancel') }}</b-button>
      <b-button rounded type="is-primary" @click="onSave">{{ $t('Save') }}</b-button>
    </footer>
  </div>
</template>

<script>
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const REVERSE_URL = 'https://geocoding-api.open-meteo.com/v1/reverse'
const IP_LOOKUP_URL = 'https://ipapi.co/json/'

function displayName(r) {
  const bits = [r.name, r.admin1, r.country].filter(Boolean)
  return bits.join(', ')
}

export default {
  name: 'WeatherSettingsModal',
  props: {
    value: { type: Object, required: true },
  },
  data() {
    return {
      settings: { ...this.value },
      cityQuery: this.value.locationName || '',
      cityResults: [],
      cityLoading: false,
      cityContext: null,
      areaQuery: '',
      areaResults: [],
      areaLoading: false,
      isLocating: false,
      locateNote: '',
      forecastOptions: [
        { days: 0,  label: this.$t('Current only') },
        { days: 5,  label: this.$t('5-day') },
        { days: 7,  label: this.$t('7-day') },
        { days: 14, label: this.$t('14-day') },
      ],
      _cityDebounce: null,
      _areaDebounce: null,
    }
  },
  methods: {
    async fetchGeocode(query, { language = 'en', count = 8 } = {}) {
      const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=${count}&language=${language}&format=json`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`)
      const json = await res.json()
      return (json.results || []).map(r => ({ ...r, displayName: displayName(r) }))
    },
    onCityTyping(text) {
      if (this._cityDebounce) clearTimeout(this._cityDebounce)
      const trimmed = (text || '').trim()
      if (trimmed.length < 2) {
        this.cityResults = []
        return
      }
      this.cityLoading = true
      this._cityDebounce = setTimeout(async () => {
        try {
          this.cityResults = await this.fetchGeocode(trimmed)
        } catch (e) {
          this.cityResults = []
        } finally {
          this.cityLoading = false
        }
      }, 250)
    },
    onCitySelect(option) {
      if (!option) return
      this.cityContext = {
        country_code: option.country_code,
        admin1: option.admin1 || '',
      }
      this.settings.locationName = option.displayName
      this.settings.latitude = +option.latitude.toFixed(4)
      this.settings.longitude = +option.longitude.toFixed(4)
      // Clear any stale area pick — they need to refine again.
      this.areaQuery = ''
      this.areaResults = []
    },
    onAreaTyping(text) {
      if (this._areaDebounce) clearTimeout(this._areaDebounce)
      const trimmed = (text || '').trim()
      if (trimmed.length < 2 || !this.cityContext) {
        this.areaResults = []
        return
      }
      this.areaLoading = true
      this._areaDebounce = setTimeout(async () => {
        try {
          const all = await this.fetchGeocode(trimmed, { count: 12 })
          // Restrict to the same country + admin1 so "Etobicoke, Australia"
          // doesn't show up when the user is in Toronto, Canada.
          const cc = this.cityContext.country_code
          const a1 = this.cityContext.admin1
          this.areaResults = all.filter(r =>
            r.country_code === cc && (!a1 || (r.admin1 || '') === a1),
          )
        } catch (e) {
          this.areaResults = []
        } finally {
          this.areaLoading = false
        }
      }, 250)
    },
    onAreaSelect(option) {
      if (!option) return
      // The area replaces the lat/lon and the visible name, but we keep
      // the city in the displayed string so the user knows the context.
      this.settings.locationName = `${option.name}, ${option.admin1 || option.country}`
      this.settings.latitude = +option.latitude.toFixed(4)
      this.settings.longitude = +option.longitude.toFixed(4)
    },
    async useMyLocation() {
      this.isLocating = true
      this.locateNote = ''
      const ok = await this.tryBrowserGeo()
      if (!ok) {
        const ipOk = await this.tryIpGeo()
        if (!ipOk) {
          this.locateNote = this.$t('Couldn\'t determine your location automatically. Pick a city above instead.')
        }
      }
      this.isLocating = false
    },
    tryBrowserGeo() {
      // navigator.geolocation only works in secure contexts (HTTPS or
      // localhost). On a LAN IP (kode.local / 192.168.x) it returns a
      // permission error — we treat that as "fall back to IP".
      return new Promise(resolve => {
        if (!navigator.geolocation || !window.isSecureContext) {
          resolve(false)
          return
        }
        const timeout = setTimeout(() => resolve(false), 6000)
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            clearTimeout(timeout)
            await this.applyLatLon(pos.coords.latitude, pos.coords.longitude)
            this.locateNote = this.$t('Located via browser GPS.')
            resolve(true)
          },
          () => {
            clearTimeout(timeout)
            resolve(false)
          },
          { timeout: 5000, maximumAge: 60000 },
        )
      })
    },
    async tryIpGeo() {
      try {
        const res = await fetch(IP_LOOKUP_URL)
        if (!res.ok) return false
        const data = await res.json()
        if (data.latitude == null || data.longitude == null) return false
        await this.applyLatLon(data.latitude, data.longitude, {
          fallbackName: [data.city, data.region, data.country_code].filter(Boolean).join(', '),
        })
        this.locateNote = this.$t('Located by IP (network-level accuracy).')
        return true
      } catch (e) {
        return false
      }
    },
    async applyLatLon(lat, lon, { fallbackName = '' } = {}) {
      this.settings.latitude = +lat.toFixed(4)
      this.settings.longitude = +lon.toFixed(4)
      // Reverse-geocode to fill in a friendly name and seed the city
      // context so the area autocomplete can filter properly.
      try {
        const url = `${REVERSE_URL}?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`
        const res = await fetch(url)
        const json = await res.json()
        const r = (json.results || [])[0]
        if (r) {
          this.settings.locationName = displayName(r)
          this.cityQuery = this.settings.locationName
          this.cityContext = { country_code: r.country_code, admin1: r.admin1 || '' }
          return
        }
      } catch (e) { /* ignore */ }
      if (fallbackName) {
        this.settings.locationName = fallbackName
        this.cityQuery = fallbackName
      }
    },
    onSave() {
      this.$emit('save', { ...this.settings })
      this.$emit('close')
    },
  },
}
</script>

<style lang="scss" scoped>
.weather-settings-modal { width: 520px; max-width: 95vw; }

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child { border-bottom: none; }

  &.stacked {
    flex-direction: column;
    align-items: stretch;
  }
}

.setting-label {
  font-size: 0.9375rem;
  color: #1f2937;
  font-weight: 500;
  flex: 1;
}

.optional {
  margin-left: 0.4rem;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 600;
}

.setting-hint {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
}

.locate-note {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  margin-left: 0.5rem;
}

.setting-options {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.option-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1f2937;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover { background: rgba(45, 95, 78, 0.10); }

  &.is-active {
    background: #2d5f4e;
    color: #fff;
    border-color: #2d5f4e;
  }
}

.modal-card-foot { gap: 0.5rem; }
</style>
