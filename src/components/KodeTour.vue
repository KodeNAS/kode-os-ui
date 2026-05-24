<!--
  KodeTour — the dashboard's onboarding tour overlay. Replaces driver.js
  (whose 1.4 release positioned popovers to (0,0) on KODE layouts no
  matter what side/align we passed). Listens for a window event so the
  service layer doesn't need a Vue handle to drive it.

  Wire-up:
    1. App.vue mounts <KodeTour /> once at the root so it can paint over
       anything (TopBar, modals, etc.).
    2. service/tour.js calls `startEasyTour(steps)` which dispatches a
       `kode:tour-show` CustomEvent with the steps payload.
    3. The component shows itself, walks the steps, then hides on done
       or close. The service layer writes the "tour seen" stamp.

  Each step is one of:
    - { selector: '[data-tour="clock"]', title, description, side? }
        → highlights the matching element with a cutout + anchored card
    - { title, description }
        → centered modal card (no element, used for intro/outro)
-->
<template>
  <transition name="kode-tour-fade">
    <div
      v-if="visible"
      class="kode-tour"
      @click.self="onBackdropClick"
    >
      <!-- Spotlight implementation: 4 darkened panels arranged around
           the highlighted rect, leaving a clear "hole" over the widget.
           More reliable than the box-shadow trick (which fights with
           transformed stacking contexts on widget tiles and would
           silently fail to darken the rest of the page). When no
           element is anchored, we render a single full-screen dim
           instead so intro/outro popovers still have a backdrop. -->
      <template v-if="spot">
        <div class="kode-tour-panel kode-tour-panel-top"    :style="dimTopStyle"></div>
        <div class="kode-tour-panel kode-tour-panel-bottom" :style="dimBottomStyle"></div>
        <div class="kode-tour-panel kode-tour-panel-left"   :style="dimLeftStyle"></div>
        <div class="kode-tour-panel kode-tour-panel-right"  :style="dimRightStyle"></div>
        <div
          class="kode-tour-spotlight"
          :style="spotStyle"
        ></div>
      </template>
      <div
        v-else
        class="kode-tour-dim"
      ></div>

      <!-- Popover. Position computed from spot rect or centered. -->
      <div
        ref="popover"
        class="kode-tour-popover"
        :class="{ 'is-modal': !spot }"
        :style="popoverStyle"
      >
        <div class="kode-tour-progress">{{ index + 1 }} / {{ steps.length }}</div>
        <h3 class="kode-tour-title">{{ currentStep.title }}</h3>
        <p class="kode-tour-description">{{ currentStep.description }}</p>
        <div class="kode-tour-actions">
          <button
            v-if="index > 0"
            type="button"
            class="kode-tour-btn"
            @click="prev"
          >{{ $t('Back') }}</button>
          <div class="kode-tour-spacer"></div>
          <button
            type="button"
            class="kode-tour-btn is-primary"
            @click="next"
          >{{ isLast ? $t('Done') : $t('Next') }}</button>
        </div>
        <button
          type="button"
          class="kode-tour-close"
          :aria-label="$t('Close')"
          @click="close"
        >×</button>
      </div>
    </div>
  </transition>
</template>

<script>
const SHOW_EVENT = 'kode:tour-show'
// Padding around the spotlighted element (px).
const SPOT_PAD = 8
// Distance between the spotlight edge and the popover (px).
const POPOVER_GAP = 14
// Default popover dimensions used for placement fallback math
// (matches the actual rendered size to one decimal).
const POPOVER_W = 340
const POPOVER_H_ESTIMATE = 180

export default {
  name: 'KodeTour',
  data() {
    return {
      visible: false,
      steps: [],
      index: 0,
      spot: null,            // { top, left, width, height } or null
      popoverStyle: {},
      // Cached for resize/scroll repositioning.
      _resizeHandler: null,
    }
  },
  computed: {
    currentStep() { return this.steps[this.index] || {} },
    isLast() { return this.index === this.steps.length - 1 },
    spotStyle() {
      if (!this.spot) return {}
      return {
        top: `${this.spot.top - SPOT_PAD}px`,
        left: `${this.spot.left - SPOT_PAD}px`,
        width: `${this.spot.width + SPOT_PAD * 2}px`,
        height: `${this.spot.height + SPOT_PAD * 2}px`,
      }
    },
    // The four panels together darken every pixel of the viewport
    // EXCEPT the spotlight rectangle. Each panel is positioned to
    // exactly tile around the spot+pad box.
    holeRect() {
      if (!this.spot) return null
      return {
        top: this.spot.top - SPOT_PAD,
        left: this.spot.left - SPOT_PAD,
        right: this.spot.left + this.spot.width + SPOT_PAD,
        bottom: this.spot.top + this.spot.height + SPOT_PAD,
      }
    },
    dimTopStyle() {
      const r = this.holeRect
      if (!r) return { display: 'none' }
      return { top: '0', left: '0', right: '0', height: `${Math.max(0, r.top)}px` }
    },
    dimBottomStyle() {
      const r = this.holeRect
      if (!r) return { display: 'none' }
      return { top: `${r.bottom}px`, left: '0', right: '0', bottom: '0' }
    },
    dimLeftStyle() {
      const r = this.holeRect
      if (!r) return { display: 'none' }
      return {
        top: `${r.top}px`,
        left: '0',
        width: `${Math.max(0, r.left)}px`,
        height: `${Math.max(0, r.bottom - r.top)}px`,
      }
    },
    dimRightStyle() {
      const r = this.holeRect
      if (!r) return { display: 'none' }
      return {
        top: `${r.top}px`,
        left: `${r.right}px`,
        right: '0',
        height: `${Math.max(0, r.bottom - r.top)}px`,
      }
    },
  },
  mounted() {
    window.addEventListener(SHOW_EVENT, this.onShow)
    this._resizeHandler = () => this.reposition()
    window.addEventListener('resize', this._resizeHandler)
    window.addEventListener('scroll', this._resizeHandler, true)
    // External re-measure hook — steps with onEnter side-effects that
    // change the target's rect after a delay (e.g. the topbar slide-
    // down) dispatch this event so we can re-measure post-animation.
    window.addEventListener('kode:tour-reposition', this._resizeHandler)
  },
  beforeDestroy() {
    window.removeEventListener(SHOW_EVENT, this.onShow)
    window.removeEventListener('resize', this._resizeHandler)
    window.removeEventListener('scroll', this._resizeHandler, true)
    window.removeEventListener('kode:tour-reposition', this._resizeHandler)
  },
  methods: {
    onShow(e) {
      const steps = (e && e.detail && Array.isArray(e.detail.steps)) ? e.detail.steps : []
      if (steps.length === 0) return
      this.steps = steps
      this.index = 0
      this.visible = true
      this.$nextTick(() => this.applyStep())
    },
    onBackdropClick() {
      // Allow click-outside to close — matches the dismissibility users
      // expect from a modal overlay. Skipping marks tour-seen anyway.
      this.close()
    },
    next() {
      if (this.isLast) { this.close(); return }
      this.index += 1
      this.$nextTick(() => this.applyStep())
    },
    prev() {
      if (this.index === 0) return
      this.index -= 1
      this.$nextTick(() => this.applyStep())
    },
    close() {
      const step = this.currentStep
      if (step && typeof step.onLeave === 'function') {
        try { step.onLeave() } catch (e) { /* ignore */ }
      }
      this.visible = false
      this.steps = []
      this.index = 0
      this.spot = null
      this.popoverStyle = {}
      window.dispatchEvent(new CustomEvent('kode:tour-done'))
    },
    applyStep() {
      const step = this.currentStep
      // Trigger onEnter hooks (used to reveal the auto-hidden topbar).
      if (step && typeof step.onEnter === 'function') {
        try { step.onEnter() } catch (e) { /* ignore */ }
      }
      this.reposition()
    },
    reposition() {
      if (!this.visible) return
      const step = this.currentStep
      if (!step) return

      // Resolve the spotlight rect. Missing selector OR missing element
      // → spot stays null and the popover renders as a centered modal.
      let rect = null
      let measureEl = null
      if (step.selector) {
        try {
          const el = document.querySelector(step.selector)
          if (el) {
            // The widget-slot wrappers in BeginnerDashboard use
            // `display: contents` so they have NO box of their own
            // (getBoundingClientRect returns 0,0,0,0 for them). When
            // that happens, fall back to measuring the first child
            // descendant that DOES have a box.
            measureEl = el
            let r = el.getBoundingClientRect()
            if (r.width === 0 && r.height === 0) {
              const child = this.findFirstSizedDescendant(el)
              if (child) {
                measureEl = child
                r = child.getBoundingClientRect()
              }
            }
            if (r.width > 0 && r.height > 0) {
              rect = { top: r.top, left: r.left, width: r.width, height: r.height }
            }
            // Scroll into view if even partially offscreen, but DON'T
            // bail out — we still set the spot from the current rect.
            // The reposition watcher fires again on the next scroll
            // tick and updates if needed.
            if (rect && (rect.top + rect.height < 0 || rect.top > window.innerHeight)) {
              try { measureEl.scrollIntoView({ behavior: 'smooth', block: 'center' }) } catch (e) { /* ignore */ }
              setTimeout(() => this.reposition(), 380)
            }
          }
        } catch (e) { /* selector lookup failed — fall through to modal */ }
      }
      this.spot = rect

      // Position the popover.
      if (!rect) {
        this.popoverStyle = {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
        return
      }

      // Place beside the anchor on the requested side, with viewport
      // clamping so we never spill off-screen. Use estimated dims for
      // first paint, then re-run after the popover renders so the math
      // uses the real size.
      const popEl = this.$refs.popover
      const popW = (popEl && popEl.offsetWidth) || POPOVER_W
      const popH = (popEl && popEl.offsetHeight) || POPOVER_H_ESTIMATE
      const vw = window.innerWidth
      const vh = window.innerHeight

      const side = step.side || this.autoSide(rect, popW, popH, vw, vh)
      let top, left

      switch (side) {
        case 'top':
          top = rect.top - popH - POPOVER_GAP
          left = rect.left + rect.width / 2 - popW / 2
          break
        case 'bottom':
          top = rect.top + rect.height + POPOVER_GAP
          left = rect.left + rect.width / 2 - popW / 2
          break
        case 'left':
          top = rect.top + rect.height / 2 - popH / 2
          left = rect.left - popW - POPOVER_GAP
          break
        case 'right':
        default:
          top = rect.top + rect.height / 2 - popH / 2
          left = rect.left + rect.width + POPOVER_GAP
          break
      }

      // Clamp inside viewport with a small margin.
      const margin = 12
      top = Math.max(margin, Math.min(vh - popH - margin, top))
      left = Math.max(margin, Math.min(vw - popW - margin, left))

      this.popoverStyle = {
        top: `${top}px`,
        left: `${left}px`,
      }

      // Re-measure once the popover has been painted with real content.
      // Skip if we already measured a real size (avoids infinite loop).
      if (!popEl || popEl.offsetWidth !== popW || popEl.offsetHeight !== popH) {
        this.$nextTick(() => this.reposition())
      }
    },
    findFirstSizedDescendant(root) {
      // BFS through descendants to find the first element with a
      // non-zero bounding rect. Used when the matched element itself
      // has `display: contents` (no box) — we measure its child
      // instead so the spotlight has something to highlight.
      if (!root) return null
      const queue = [...root.children]
      while (queue.length > 0) {
        const el = queue.shift()
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) return el
        for (const c of el.children) queue.push(c)
      }
      return null
    },
    autoSide(rect, popW, popH, vw, vh) {
      // Pick whichever side has the most room. Right preferred when tied
      // (matches reading direction).
      const space = {
        right: vw - (rect.left + rect.width),
        left: rect.left,
        bottom: vh - (rect.top + rect.height),
        top: rect.top,
      }
      const order = ['right', 'bottom', 'left', 'top']
      const needHoriz = popW + POPOVER_GAP + 24
      const needVert = popH + POPOVER_GAP + 24
      for (const k of order) {
        const need = (k === 'left' || k === 'right') ? needHoriz : needVert
        if (space[k] >= need) return k
      }
      // Fallback: side with the most absolute room.
      return order.sort((a, b) => space[b] - space[a])[0]
    },
  },
}
</script>

<style lang="scss" scoped>
.kode-tour {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: auto;
}

/* Modal-style full-screen dim used when no element is anchored. */
.kode-tour-dim {
  position: absolute;
  inset: 0;
  background: rgba(15, 25, 30, 0.62);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

/* The four dim panels surround the spotlight rect and together
   darken every pixel of the viewport except the clear spotlight
   area. Plain rgba background — no box-shadow tricks that get
   trapped by transformed stacking contexts on widget tiles. */
.kode-tour-panel {
  position: absolute;
  background: rgba(15, 25, 30, 0.62);
  pointer-events: none;
}

/* Spotlight: the clear "hole" that sits on top of the widget. The
   white inset stroke + outer glow draw the eye without obscuring
   the widget content underneath. */
.kode-tour-spotlight {
  position: absolute;
  border-radius: 18px;
  pointer-events: none;
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.85),
    0 0 0 4px rgba(45, 95, 78, 0.55),
    0 0 28px rgba(45, 95, 78, 0.55);
  transition:
    top 0.3s cubic-bezier(0.34, 1.2, 0.64, 1),
    left 0.3s cubic-bezier(0.34, 1.2, 0.64, 1),
    width 0.3s cubic-bezier(0.34, 1.2, 0.64, 1),
    height 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.kode-tour-popover {
  position: absolute;
  width: 340px;
  max-width: calc(100vw - 32px);
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 18px;
  padding: 1.1rem 1.2rem 1rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 18px 48px rgba(0, 0, 0, 0.28);
  color: #1f2937;
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition:
    top 0.3s cubic-bezier(0.34, 1.2, 0.64, 1),
    left 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.kode-tour-progress {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(45, 95, 78, 0.85);
  margin-bottom: 0.45rem;
}

.kode-tour-title {
  font-size: 1.0625rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #1f2937;
  margin: 0 0 0.4rem 0;
}

.kode-tour-description {
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.72);
  margin: 0 0 0.85rem 0;
}

.kode-tour-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kode-tour-spacer { flex: 1; }

.kode-tour-btn {
  background: rgba(0, 0, 0, 0.06);
  color: #1f2937;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover { background: rgba(0, 0, 0, 0.10); }

  &.is-primary {
    background: #2d5f4e;
    color: #fff;
    border-color: #2d5f4e;

    &:hover { background: #3f7a66; border-color: #3f7a66; }
  }
}

.kode-tour-close {
  position: absolute;
  top: 8px;
  right: 10px;
  background: none;
  border: none;
  color: rgba(0, 0, 0, 0.45);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.2rem 0.45rem;
  border-radius: 8px;

  &:hover { color: rgba(0, 0, 0, 0.75); background: rgba(0, 0, 0, 0.06); }
}

/* Enter/leave fade. */
.kode-tour-fade-enter-active,
.kode-tour-fade-leave-active {
  transition: opacity 0.2s ease;
}
.kode-tour-fade-enter,
.kode-tour-fade-leave-to {
  opacity: 0;
}
</style>
