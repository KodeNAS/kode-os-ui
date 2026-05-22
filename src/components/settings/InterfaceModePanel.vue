<template>
  <div class="modal-card interface-mode-panel">
    <header class="modal-card-head">
      <div class="is-flex-grow-1">
        <h3 class="title is-header">{{ $t('Mode') }}</h3>
      </div>
      <b-icon
        class="close-button"
        icon="close-outline"
        pack="casa"
        @click.native="$emit('close')"
      />
    </header>

    <section class="modal-card-body">
      <div class="mode-options">
        <button
          type="button"
          class="mode-option"
          :class="{ 'is-selected': selected === 'beginner' }"
          @click="select('beginner')"
        >
          <div class="mode-option-title">{{ $t('Easy mode') }}</div>
          <div class="mode-option-desc">
            {{ $t('A simpler view designed for everyday use — your apps, files, and a few essentials.') }}
          </div>
        </button>

        <button
          type="button"
          class="mode-option"
          :class="{ 'is-selected': selected === 'advanced' }"
          @click="select('advanced')"
        >
          <div class="mode-option-title">{{ $t('Advanced mode') }}</div>
          <div class="mode-option-desc">
            {{ $t('Shows everything: app store, system stats, terminal, network and storage settings. For power users.') }}
          </div>
        </button>
      </div>
    </section>

    <footer class="modal-card-foot is-flex is-align-items-center">
      <div class="is-flex-grow-1"></div>
      <b-button
        :label="$t('Save')"
        :disabled="selected === current"
        rounded
        type="is-primary"
        @click="save"
      />
    </footer>
  </div>
</template>

<script>
export default {
  name: 'InterfaceModePanel',
  data() {
    return {
      selected: this.$store.state.interfaceMode,
    }
  },
  computed: {
    current() {
      return this.$store.state.interfaceMode
    },
  },
  methods: {
    select(mode) {
      this.selected = mode
    },
    save() {
      this.$store.commit('SET_INTERFACE_MODE', this.selected)
      this.$emit('close')
    },
  },
}
</script>

<style lang="scss" scoped>
.interface-mode-panel {
  width: 480px;
  max-width: 100%;
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-option {
  text-align: left;
  padding: 16px 18px;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: rgba(45, 95, 78, 0.4);
  }

  &.is-selected {
    border-color: #2d5f4e;
    background: rgba(45, 95, 78, 0.08);
  }
}

.mode-option-title {
  font-weight: 500;
  font-size: 15px;
  margin-bottom: 4px;
}

.mode-option-desc {
  font-size: 13px;
  opacity: 0.7;
  line-height: 1.4;
}
</style>
