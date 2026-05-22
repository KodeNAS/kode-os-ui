/*
 * KODE OS — `hintMode` mixin.
 *
 * Exposes a reactive `hintModeOn` boolean to any component that includes
 * the mixin. Reads the initial value from localStorage via tour.js and
 * keeps in sync via the `kode:hint-mode` window event that HintButton
 * dispatches when the toggle changes.
 *
 * Consumer components bind `:title="hintModeOn ? hintLabel : null"`
 * (or a richer tooltip) on whatever element should surface the hint.
 */
import { isHintModeOn } from '@/service/tour'

export const hintMode = {
  data() {
    return {
      hintModeOn: isHintModeOn(),
    }
  },
  mounted() {
    this._onKodeHintMode = (e) => {
      this.hintModeOn = !!(e && e.detail && e.detail.on)
    }
    window.addEventListener('kode:hint-mode', this._onKodeHintMode)
  },
  beforeDestroy() {
    if (this._onKodeHintMode) {
      window.removeEventListener('kode:hint-mode', this._onKodeHintMode)
    }
  },
}
