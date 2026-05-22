/*
 * KODE OS — advancedGate mixin.
 *
 * Mix in `advancedGate` to expose `this.requireAdvanced(action, opts)`.
 * In Advanced mode the action runs immediately. In Beginner mode the
 * user sees AdvancedFeatureWarning first; confirming flips the mode
 * and runs the action.
 *
 * Usage:
 *   import { advancedGate } from '@/mixins/advancedGate'
 *
 *   export default {
 *     mixins: [advancedGate],
 *     methods: {
 *       openTerminal() {
 *         this.requireAdvanced(() => this.$router.push('/terminal'), {
 *           title: this.$t('Open Terminal'),
 *           message: this.$t('The terminal is a power-user feature ...'),
 *         })
 *       },
 *     },
 *   }
 */
import AdvancedFeatureWarning from '@/components/feedback/AdvancedFeatureWarning.vue'

export const advancedGate = {
  methods: {
    requireAdvanced(action, opts = {}) {
      if (!this.$store.getters.isBeginner) {
        if (typeof action === 'function') action()
        return
      }

      this.$buefy.modal.open({
        parent: this,
        component: AdvancedFeatureWarning,
        hasModalCard: true,
        trapFocus: true,
        scroll: 'keep',
        animation: 'zoom-in',
        props: {
          title: opts.title || '',
          message: opts.message || '',
          onProceed: action,
        },
      })
    },
  },
}
