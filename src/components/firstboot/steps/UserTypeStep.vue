<template>
  <div class="fb-step user-type-step">
    <h2 class="step-title">{{ $t('Pick your style') }}</h2>
    <p class="step-intro">
      {{ $t('How would you describe yourself? This sets the default interface mode and tunes how much hand-holding you get.') }}
    </p>

    <div class="type-grid">
      <button
        v-for="opt in options"
        :key="opt.key"
        type="button"
        class="type-option"
        :class="{ 'is-selected': value === opt.key, [`is-${opt.key}`]: true }"
        @click="select(opt.key)"
      >
        <span class="type-icon">
          <b-icon :icon="opt.icon" pack="casa" size="is-medium" />
        </span>
        <span class="type-label">{{ opt.label }}</span>
        <span class="type-desc">{{ opt.desc }}</span>
      </button>
    </div>

    <div v-if="value === 'developer'" class="dev-warning">
      <b-icon icon="alert" pack="casa" size="is-small" />
      <span>
        {{ $t('Developer mode skips the setup wizard. You\'ll land in the full CasaOS app store with no hand-holding. Your dashboard starts in Advanced mode. You can switch to Easy mode anytime from the bottom-right pill.') }}
      </span>
    </div>

    <div class="step-actions">
      <div class="is-flex-grow-1"></div>
      <b-button
        rounded
        type="is-primary"
        :disabled="!value"
        @click="commit"
      >
        {{ continueLabel }}
      </b-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserTypeStep',
  data() {
    return {
      value: '',
      options: [
        {
          key: 'beginner',
          icon: 'home-outline',
          label: this.$t('Beginner'),
          desc: this.$t("I'm new to all this. Walk me through everything and default to Easy mode."),
        },
        {
          key: 'normal',
          icon: 'computer-outline',
          label: this.$t('Normal'),
          desc: this.$t("I've used a NAS before. Full wizard, but drop me into Advanced mode at the end."),
        },
        {
          key: 'developer',
          icon: 'terminal-outline',
          label: this.$t('Developer'),
          desc: this.$t('Skip the setup. Take me straight to the app store. Advanced mode by default.'),
        },
      ],
    }
  },
  computed: {
    continueLabel() {
      if (!this.value) return this.$t('Pick one')
      if (this.value === 'developer') return this.$t('Take me to the app store')
      return this.$t('Continue')
    },
  },
  methods: {
    select(key) {
      this.value = key
    },
    commit() {
      if (!this.value) return
      this.$emit('next', { userType: this.value })
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
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
  margin-bottom: 1.25rem;
}

.type-grid {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.type-option {
  display: grid;
  grid-template-columns: 48px 1fr;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0.25rem 1rem;
  padding: 1rem 1.25rem;
  text-align: left;
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 14px;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 4px 16px rgba(0, 0, 0, 0.15);
  transition: border-color 0.15s, background 0.15s, transform 0.15s;

  &:hover {
    border-color: rgba(45, 95, 78, 0.55);
    transform: translateY(-1px);
  }
  &.is-selected {
    border-color: #2d5f4e;
    background: rgba(225, 240, 234, 0.95);
  }
  &.is-developer.is-selected {
    border-color: #c47f00;
    background: rgba(245, 233, 215, 0.95);
  }
}

.type-icon {
  grid-row: 1 / span 2;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  .is-beginner & { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }
  .is-normal &   { background: linear-gradient(135deg, #5e6ad2, #7c8af0); }
  .is-developer & { background: linear-gradient(135deg, #c47f00, #e6a02a); }
}

.type-label {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
}

.type-desc {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.45;
}

.dev-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(196, 127, 0, 0.18);
  border: 1px solid rgba(196, 127, 0, 0.35);
  border-radius: 12px;
  color: #fff;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

.step-actions { display: flex; align-items: center; gap: 0.5rem; }
</style>
