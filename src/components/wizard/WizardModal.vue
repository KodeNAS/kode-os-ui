<template>
  <div class="modal-card kode-wizard">
    <header class="modal-card-head kode-wizard-head">
      <div class="kode-wizard-titlebar">
        <h3 class="title is-header kode-wizard-title">{{ title }}</h3>
        <b-icon
          class="close-button"
          icon="close-outline"
          pack="casa"
          @click.native="$emit('close')"
        />
      </div>

      <ol v-if="steps.length > 1" class="kode-wizard-stepper">
        <li
          v-for="(label, i) in steps"
          :key="i"
          class="kode-wizard-stepper-item"
          :class="{
            'is-current': i === current,
            'is-done': i < current,
          }"
        >
          <span class="kode-wizard-stepper-dot">
            <span v-if="i < current" class="kode-wizard-stepper-check">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span class="kode-wizard-stepper-label">{{ label }}</span>
        </li>
      </ol>
    </header>

    <section class="modal-card-body kode-wizard-body">
      <!-- Active step content. Children get the index + a goTo helper. -->
      <slot
        :step="current"
        :go-to="goTo"
        :next="next"
        :back="back"
        :set-can-advance="setCanAdvance"
      />
    </section>

    <footer class="modal-card-foot kode-wizard-foot">
      <b-button
        v-if="current > 0"
        :label="$t('Back')"
        rounded
        @click="back"
      />
      <div class="is-flex-grow-1"></div>
      <b-button
        :label="isLast ? $t('Done') : $t('Next')"
        :disabled="!canAdvance"
        rounded
        type="is-primary"
        @click="next"
      />
    </footer>
  </div>
</template>

<script>
/**
 * Reusable multi-step modal shell used by the Add-device wizard (Phase 2)
 * and the first-boot wizard (Phase 4). The parent supplies a `steps` array
 * of labels and renders step content inside the default slot keyed off the
 * exposed `step` index.
 *
 * The active step can call `setCanAdvance(bool)` to gate the Next button,
 * or directly call `next()` / `goTo(i)` from inside its own controls.
 */
export default {
  name: 'WizardModal',
  props: {
    title: {
      type: String,
      default: '',
    },
    steps: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      current: 0,
      canAdvance: true,
    }
  },
  computed: {
    isLast() {
      return this.current >= this.steps.length - 1
    },
  },
  watch: {
    current() {
      // Default each step to allowing advance — children opt into gating.
      this.canAdvance = true
    },
  },
  methods: {
    next() {
      if (this.isLast) {
        this.$emit('finish')
        this.$emit('close')
        return
      }
      this.current += 1
    },
    back() {
      if (this.current > 0) this.current -= 1
    },
    goTo(index) {
      if (index >= 0 && index < this.steps.length) {
        this.current = index
      }
    },
    setCanAdvance(val) {
      this.canAdvance = !!val
    },
  },
}
</script>

<style lang="scss" scoped>
.kode-wizard {
  width: 560px;
  max-width: 100%;
}

.kode-wizard-head {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  padding-bottom: 1rem;
}

.kode-wizard-titlebar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.kode-wizard-title {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0 !important;
}

.kode-wizard-stepper {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 0.5rem;
}

.kode-wizard-stepper-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.05);
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.55);
  transition: background 0.18s, color 0.18s;

  &.is-current {
    background: rgba(45, 95, 78, 0.12);
    color: #2d5f4e;
    font-weight: 500;
  }

  &.is-done {
    color: #2d5f4e;
  }
}

.kode-wizard-stepper-dot {
  flex: 0 0 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.12);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 500;

  .is-current & {
    background: #2d5f4e;
  }
  .is-done & {
    background: #2d5f4e;
  }
}

.kode-wizard-stepper-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kode-wizard-body {
  min-height: 260px;
  padding: 1.5rem;
}

.kode-wizard-foot {
  gap: 0.5rem;
}
</style>
