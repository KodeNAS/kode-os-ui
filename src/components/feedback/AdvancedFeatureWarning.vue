<template>
  <div class="modal-card advanced-warning">
    <header class="modal-card-head">
      <div class="is-flex-grow-1">
        <h3 class="title is-header">{{ title || $t('Heads up') }}</h3>
      </div>
      <b-icon
        class="close-button"
        icon="close-outline"
        pack="casa"
        @click.native="onCancel"
      />
    </header>

    <section class="modal-card-body">
      <p class="warning-body">
        {{ message || $t('This is an Advanced feature. It shows more technical detail and may require some setup. Switch to Advanced mode to continue?') }}
      </p>
    </section>

    <footer class="modal-card-foot is-flex is-align-items-center">
      <div class="is-flex-grow-1"></div>
      <b-button
        :label="$t('Cancel')"
        rounded
        @click="onCancel"
      />
      <b-button
        :label="$t('Switch & continue')"
        rounded
        type="is-primary"
        @click="onConfirm"
      />
    </footer>
  </div>
</template>

<script>
export default {
  name: 'AdvancedFeatureWarning',
  props: {
    title: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      default: '',
    },
    onProceed: {
      type: Function,
      default: null,
    },
  },
  methods: {
    onCancel() {
      this.$emit('close')
    },
    onConfirm() {
      this.$store.commit('SET_INTERFACE_MODE', 'advanced')
      this.$emit('close')
      if (typeof this.onProceed === 'function') {
        this.$nextTick(() => this.onProceed())
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.advanced-warning {
  width: 480px;
  max-width: 100%;
}

.warning-body {
  font-size: 14px;
  line-height: 1.6;
}

.modal-card-foot {
  gap: 8px;
}
</style>
