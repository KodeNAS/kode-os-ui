/*
 * KODE OS — advancedGate mixin.
 *
 * Historically this gated power-user actions behind a "you're in Easy
 * mode" warning that, on confirm, would flip the user to Advanced and
 * run the action. KODE OS no longer has an Advanced mode — there's
 * only the one widget canvas — so this just runs the action directly
 * now. Kept as a no-op wrapper so the call sites that already use
 * `this.requireAdvanced(...)` don't need to be touched.
 */
export const advancedGate = {
  methods: {
    requireAdvanced(action /* opts */) {
      if (typeof action === 'function') action()
    },
  },
}
