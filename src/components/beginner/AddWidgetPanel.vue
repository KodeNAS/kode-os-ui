<template>
  <div class="modal-card add-widget-modal">
    <header class="modal-card-head">
      <h3 class="title is-header">{{ $t('Add a widget') }}</h3>
      <b-icon
        class="close-button"
        icon="close-outline"
        pack="casa"
        @click.native="$emit('close')"
      />
    </header>

    <section class="modal-card-body">
      <p class="intro">{{ $t('Pick a widget to add to your dashboard. Already-placed widgets are dimmed.') }}</p>

      <div class="widget-grid">
        <button
          v-for="w in catalog"
          :key="w.key"
          type="button"
          class="widget-option"
          :class="{ 'is-placed': placedSet.has(w.key) }"
          :disabled="placedSet.has(w.key)"
          @click="add(w.key)"
        >
          <span class="widget-option-icon" :class="`is-${w.key}`">
            <b-icon :icon="w.icon" pack="casa" size="is-medium" />
          </span>
          <span class="widget-option-text">
            <span class="widget-option-title">{{ w.title }}</span>
            <span class="widget-option-desc">{{ w.desc }}</span>
          </span>
          <span v-if="placedSet.has(w.key)" class="widget-option-pill">{{ $t('Already on dashboard') }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script>
const CATALOG = [
  {
    key: 'clock',
    icon: 'time-outline',
    title: 'Clock',
    desc: 'Local time + date. Updates every second.',
  },
  {
    key: 'weather',
    icon: 'wallpaper-outline',
    title: 'Weather',
    desc: 'Current temperature and conditions, refreshed every 15 min.',
  },
  {
    key: 'search',
    icon: 'show-search-outline',
    title: 'Web search',
    desc: 'Search bar that opens DuckDuckGo (or your chosen engine) in a new tab.',
  },
  {
    key: 'sysInfo',
    icon: 'cpu-outline',
    title: 'System info',
    desc: 'CPU, memory, and disk usage on your pebble. Updates every 10 s.',
  },
  {
    key: 'files',
    icon: 'folder',
    title: 'Files',
    desc: 'Open the built-in file browser.',
  },
  {
    key: 'recent',
    icon: 'time-outline',
    title: 'Recent activity',
    desc: 'Your six most recently changed files.',
  },
  {
    key: 'family',
    icon: 'account-outline',
    title: 'On your pebble',
    desc: 'Family member accounts.',
  },
  {
    key: 'addDevice',
    icon: 'plus-outline',
    title: 'Add a device',
    desc: 'Connect a phone, computer, or smart TV.',
  },
  {
    key: 'apps',
    icon: 'apps-outline',
    title: 'Apps',
    desc: 'Grid of installed apps. Big — best in a wide column.',
  },
]

export default {
  name: 'AddWidgetPanel',
  props: {
    placed: { type: Array, default: () => [] },
  },
  data() {
    return { catalog: CATALOG }
  },
  computed: {
    placedSet() {
      return new Set(this.placed || [])
    },
  },
  methods: {
    add(key) {
      this.$emit('add-widget', key)
      this.$emit('close')
    },
  },
}
</script>

<style lang="scss" scoped>
.add-widget-modal { width: 560px; max-width: 95vw; }

.intro {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 1rem;
}

.widget-grid {
  display: grid;
  gap: 0.6rem;
  grid-template-columns: 1fr;
}

.widget-option {
  position: relative;
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  text-align: left;
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;

  &:hover:not(:disabled) {
    border-color: rgba(45, 95, 78, 0.55);
    transform: translateY(-1px);
  }

  &.is-placed {
    background: rgba(0, 0, 0, 0.04);
    cursor: not-allowed;
    opacity: 0.65;
  }
}

.widget-option-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  &.is-clock     { background: linear-gradient(135deg, #1e4a72, #2d6aa6); }
  &.is-weather   { background: linear-gradient(135deg, #5e6ad2, #7c8af0); }
  &.is-search    { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }
  &.is-sysInfo   { background: linear-gradient(135deg, #a83239, #d04a51); }
  &.is-files     { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }
  &.is-recent    { background: linear-gradient(135deg, #b45f6d, #d97e8c); }
  &.is-family    { background: linear-gradient(135deg, #c47f00, #e6a02a); }
  &.is-addDevice { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }
  &.is-apps      { background: linear-gradient(135deg, #1f2937, #4b5563); }
}

.widget-option-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.widget-option-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1f2937;
}

.widget-option-desc {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 1px;
  line-height: 1.4;
}

.widget-option-pill {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.55);
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 8px;
  border-radius: 999px;
}
</style>
