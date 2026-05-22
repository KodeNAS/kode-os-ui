<template>
  <div class="fb-step pebble-name-step">
    <h2 class="step-title">{{ $t('Name your pebble') }}</h2>
    <p class="step-intro">
      {{ $t('Pick a friendly name. You\'ll see it on the OLED screen and when you connect from other devices.') }}
    </p>

    <b-field :label="$t('Pebble name')">
      <b-input
        v-model="hostname"
        type="text"
        :placeholder="$t('e.g. living-room or family')"
        maxlength="32"
        @keyup.enter.native="submit"
      />
    </b-field>

    <p class="hint">
      {{ $t('Letters, numbers, and hyphens only. No spaces.') }}
    </p>

    <div class="step-actions">
      <b-button
        rounded
        type="is-primary"
        :disabled="!isValid"
        :loading="isSubmitting"
        @click="submit"
      >
        {{ $t('Continue') }}
      </b-button>
    </div>
  </div>
</template>

<script>
const VALID = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/

export default {
  name: 'PebbleNameStep',
  data() {
    return {
      hostname: 'pebble',
      isSubmitting: false,
    }
  },
  computed: {
    isValid() {
      return VALID.test(this.hostname || '')
    },
  },
  methods: {
    async submit() {
      if (!this.isValid) return
      this.isSubmitting = true
      try {
        // Store the chosen name in user-service custom storage so any later
        // sync to the OS hostname can pick it up. The actual hostname change
        // typically needs a backend hook (out of scope here).
        await this.$api.users.setCustomStorage('kode_pebble_name', { name: this.hostname }).catch(() => {})
        this.$emit('next', { hostname: this.hostname })
      } finally {
        this.isSubmitting = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.step-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
  margin-bottom: 0.5rem;
}

.step-intro {
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
  margin-bottom: 1.25rem;
}

.hint {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.25rem;
  margin-bottom: 1.25rem;
}

::v-deep .field .label { color: rgba(255, 255, 255, 0.9); }
::v-deep .input { background: rgba(255, 255, 255, 0.85); border-color: transparent; }

.step-actions { display: flex; justify-content: flex-end; }
</style>
