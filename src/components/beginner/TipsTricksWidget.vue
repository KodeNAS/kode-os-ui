<template>
  <div class="kode-tile tips-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <header class="tile-header">
      <h2 class="tile-title">{{ $t('Tips & tricks') }}</h2>
      <button type="button" class="tips-nav" :aria-label="$t('Previous tip')" @click="prev">
        <b-icon icon="arrow-back" pack="casa" size="is-small" />
      </button>
      <button type="button" class="tips-nav" :aria-label="$t('Next tip')" @click="next">
        <b-icon icon="arrow-right" pack="casa" size="is-small" />
      </button>
    </header>

    <transition name="tip-fade" mode="out-in">
      <div :key="idx" class="tip-body">
        <div class="tip-icon"><b-icon :icon="active.icon" pack="casa" size="is-medium" /></div>
        <div class="tip-text">
          <div class="tip-title">{{ active.title }}</div>
          <div class="tip-desc">{{ active.desc }}</div>
        </div>
      </div>
    </transition>

    <div class="tips-dots">
      <span
        v-for="(t, i) in tips"
        :key="i"
        class="tips-dot"
        :class="{ 'is-active': i === idx }"
        @click="idx = i"
      ></span>
    </div>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

const TIPS = [
  {
    icon: 'control-outline',
    title: 'Customise your dashboard',
    desc: 'Click "Edit layout" in the top right to rearrange widgets, add new ones, and resize columns.',
  },
  {
    icon: 'wallpaper-outline',
    title: 'Save and restore layouts',
    desc: 'In Edit mode, open the Layouts menu and "Save current layout…" to keep your favourite arrangement. Switch between layouts anytime.',
  },
  {
    icon: 'show-search-outline',
    title: 'Find tips by hovering',
    desc: 'Turn on Hint hover mode from the ? button in the top bar — hover any tile to see what it does.',
  },
  {
    icon: 'mobile-outline',
    title: 'Phone photo backup',
    desc: 'Open "Add a device" → Phone to grab a QR code that points the Immich app at your pebble.',
  },
  {
    icon: 'restart-outline',
    title: 'Re-run the setup tour',
    desc: 'Settings → "Setup walkthrough" replays the first-boot wizard. Handy for visitors.',
  },
  {
    icon: 'apps-outline',
    title: 'Multiple shortcuts per app',
    desc: 'You can drop the same app shortcut in more than one column — useful if you want a quick-launch on each side of the screen.',
  },
  {
    icon: 'check',
    title: 'Hold Shift while resizing',
    desc: 'Drag a column divider with Shift held down to snap to clean ratios (1:2:1, etc.) without eyeballing.',
  },
]

export default {
  name: 'TipsTricksWidget',
  mixins: [hintMode],
  data() {
    return {
      tips: TIPS,
      idx: Math.floor(Math.random() * TIPS.length),
      timer: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Bite-sized tips for getting more out of your pebble. Arrows or dots to navigate.')
    },
    active() {
      return this.tips[this.idx] || this.tips[0]
    },
  },
  mounted() {
    // Auto-cycle every 20s.
    this.timer = setInterval(() => this.next(), 20000)
  },
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    next() { this.idx = (this.idx + 1) % this.tips.length },
    prev() { this.idx = (this.idx - 1 + this.tips.length) % this.tips.length },
  },
}
</script>

<style lang="scss" scoped>
.kode-tile {
  position: relative;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 1.1rem 1.25rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
}

.kode-hint {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translate(-50%, -100%);
  background: rgba(15, 25, 30, 0.92);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  line-height: 1.4;
  max-width: 260px;
  white-space: normal;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 50;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}
.kode-tile:hover .kode-hint { opacity: 1; }

.tile-header {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.6rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.tile-title {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  color: rgba(31, 41, 55, 0.7);
  margin: 0;
}
.tips-nav {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.55);
  transition: background 0.15s;

  &:hover { background: rgba(45, 95, 78, 0.18); color: #2d5f4e; }
}

.tip-body {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  min-height: 80px;
}

.tip-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: linear-gradient(135deg, #c47f00, #e6a02a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tip-text {
  flex: 1;
  min-width: 0;
}

.tip-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.2rem;
}

.tip-desc {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.68);
  line-height: 1.5;
}

.tips-dots {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-top: 0.75rem;
}

.tips-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: background 0.15s;

  &.is-active { background: #2d5f4e; }
  &:hover { background: rgba(45, 95, 78, 0.5); }
}

.tip-fade-enter-active,
.tip-fade-leave-active {
  transition: opacity 0.22s, transform 0.22s;
}
.tip-fade-enter,
.tip-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
