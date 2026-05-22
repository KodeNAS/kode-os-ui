<template>
  <div class="modal-card network-settings-modal">
    <header class="modal-card-head">
      <h3 class="title is-header">{{ $t('Network settings') }}</h3>
      <b-icon class="close-button" icon="close-outline" pack="casa" @click.native="$emit('close')" />
    </header>

    <section class="modal-card-body">
      <div class="setting-row">
        <label class="setting-label">{{ $t('Show traffic graph') }}</label>
        <b-switch v-model="settings.showGraph" type="is-dark" />
      </div>
      <div class="setting-row">
        <label class="setting-label">{{ $t('Show host name') }}</label>
        <b-switch v-model="settings.showHost" type="is-dark" />
      </div>
      <div class="setting-row">
        <label class="setting-label">{{ $t('Show interface picker') }}</label>
        <b-switch v-model="settings.showPicker" type="is-dark" />
      </div>

      <div class="setting-row">
        <label class="setting-label">{{ $t('Refresh interval') }}</label>
        <div class="setting-options">
          <button
            v-for="opt in pollOptions"
            :key="opt.value"
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.pollMs === opt.value }"
            @click="settings.pollMs = opt.value"
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
  name: 'NetworkSettingsModal',
  props: {
    value: { type: Object, required: true },
  },
  data() {
    return {
      settings: { ...this.value },
      pollOptions: [
        { value: 1000,  label: this.$t('1s') },
        { value: 2000,  label: this.$t('2s') },
        { value: 5000,  label: this.$t('5s') },
        { value: 10000, label: this.$t('10s') },
      ],
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
.network-settings-modal { width: 460px; max-width: 95vw; }

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child { border-bottom: none; }
}

.setting-label { font-size: 0.9375rem; color: #1f2937; font-weight: 500; flex: 1; }
.setting-options { display: flex; gap: 0.35rem; flex-wrap: wrap; }

.option-chip {
  display: inline-flex;
  align-items: center;
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
