<template>
  <div class="modal-card clock-settings-modal">
    <header class="modal-card-head">
      <h3 class="title is-header">{{ $t('Clock settings') }}</h3>
      <b-icon class="close-button" icon="close-outline" pack="casa" @click.native="$emit('close')" />
    </header>

    <section class="modal-card-body">
      <div class="setting-row">
        <label class="setting-label">{{ $t('Face style') }}</label>
        <div class="setting-options">
          <button
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.mode === 'digital' }"
            @click="settings.mode = 'digital'"
          >
            <b-icon icon="time-outline" pack="casa" size="is-small" />
            {{ $t('Digital') }}
          </button>
          <button
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.mode === 'analog' }"
            @click="settings.mode = 'analog'"
          >
            <b-icon icon="restart-outline" pack="casa" size="is-small" />
            {{ $t('Analog') }}
          </button>
        </div>
      </div>

      <div class="setting-row">
        <label class="setting-label">{{ $t('Time format') }}</label>
        <div class="setting-options">
          <button
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.format === '12h' }"
            @click="settings.format = '12h'"
          >
            {{ $t('12-hour') }}
          </button>
          <button
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.format === '24h' }"
            @click="settings.format = '24h'"
          >
            {{ $t('24-hour') }}
          </button>
        </div>
      </div>

      <div class="setting-row">
        <label class="setting-label">{{ $t('Show seconds') }}</label>
        <b-switch v-model="settings.showSeconds" type="is-dark" />
      </div>

      <div class="setting-row">
        <label class="setting-label">{{ $t('Show date') }}</label>
        <b-switch v-model="settings.showDate" type="is-dark" />
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
  name: 'ClockSettingsModal',
  props: {
    value: { type: Object, required: true },
  },
  data() {
    return {
      settings: { ...this.value },
    }
  },
  methods: {
    onSave() {
      this.$emit('save', { ...this.settings })
      this.$emit('close')
    },
  },
}
</script>

<style lang="scss" scoped>
.clock-settings-modal { width: 460px; max-width: 95vw; }

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child { border-bottom: none; }
}

.setting-label {
  font-size: 0.9375rem;
  color: #1f2937;
  font-weight: 500;
  flex: 1;
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
