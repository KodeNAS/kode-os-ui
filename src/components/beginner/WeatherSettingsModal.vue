<template>
  <div class="modal-card weather-settings-modal">
    <header class="modal-card-head">
      <h3 class="title is-header">{{ $t('Weather settings') }}</h3>
      <b-icon class="close-button" icon="close-outline" pack="casa" @click.native="$emit('close')" />
    </header>

    <section class="modal-card-body">
      <div class="setting-row stacked">
        <label class="setting-label">{{ $t('Location') }}</label>
        <b-input v-model="settings.locationName" :placeholder="$t('e.g. Toronto')" maxlength="40" />
      </div>

      <div class="setting-row two-col">
        <div class="setting-sub">
          <label class="setting-label small">{{ $t('Latitude') }}</label>
          <b-input
            v-model.number="settings.latitude"
            type="number"
            step="0.0001"
            min="-90"
            max="90"
          />
        </div>
        <div class="setting-sub">
          <label class="setting-label small">{{ $t('Longitude') }}</label>
          <b-input
            v-model.number="settings.longitude"
            type="number"
            step="0.0001"
            min="-180"
            max="180"
          />
        </div>
      </div>

      <div class="setting-row">
        <b-button
          rounded
          size="is-small"
          icon-pack="casa"
          icon-left="show-search-outline"
          :loading="isLocating"
          @click="useBrowserLocation"
        >
          {{ $t('Use my current location') }}
        </b-button>
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
export default {
  name: 'WeatherSettingsModal',
  props: {
    value: { type: Object, required: true },
  },
  data() {
    return {
      settings: { ...this.value },
      isLocating: false,
      forecastOptions: [
        { days: 0,  label: this.$t('Current only') },
        { days: 5,  label: this.$t('5-day') },
        { days: 7,  label: this.$t('7-day') },
        { days: 14, label: this.$t('14-day') },
      ],
    }
  },
  methods: {
    useBrowserLocation() {
      if (!navigator.geolocation) {
        this.$buefy.toast.open({
          message: this.$t('Browser geolocation isn\'t available.'),
          type: 'is-warning',
          position: 'is-top',
        })
        return
      }
      this.isLocating = true
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.settings.latitude = +pos.coords.latitude.toFixed(4)
          this.settings.longitude = +pos.coords.longitude.toFixed(4)
          this.isLocating = false
          this.$buefy.toast.open({
            message: this.$t('Location set. Remember to give it a name above.'),
            type: 'is-success',
            position: 'is-top',
          })
        },
        () => {
          this.isLocating = false
          this.$buefy.toast.open({
            message: this.$t('Couldn\'t read your location. Try entering coordinates manually.'),
            type: 'is-danger',
            position: 'is-top',
          })
        },
        { timeout: 8000 },
      )
    },
    onSave() {
      this.$emit('save', { ...this.settings })
      this.$emit('close')
    },
  },
}
</script>

<style lang="scss" scoped>
.weather-settings-modal { width: 480px; max-width: 95vw; }

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child { border-bottom: none; }

  &.stacked {
    flex-direction: column;
    align-items: stretch;
  }

  &.two-col {
    gap: 0.75rem;
  }
}

.setting-sub {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting-label {
  font-size: 0.9375rem;
  color: #1f2937;
  font-weight: 500;
  flex: 1;

  &.small {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(0, 0, 0, 0.6);
    font-weight: 600;
  }
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
