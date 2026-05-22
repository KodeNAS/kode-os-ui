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
        <!-- Apps parent entry — expandable into individual app shortcuts -->
        <div class="widget-option is-group" :class="{ 'is-open': appsOpen }">
          <button
            type="button"
            class="widget-option-row"
            @click="appsOpen = !appsOpen"
          >
            <span class="widget-option-icon is-apps">
              <b-icon icon="apps-outline" pack="casa" size="is-medium" />
            </span>
            <span class="widget-option-text">
              <span class="widget-option-title">{{ $t('Apps') }}</span>
              <span class="widget-option-desc">{{ $t('Shortcut tiles for each installed app, or the whole grid as one tile.') }}</span>
            </span>
            <b-icon
              :icon="appsOpen ? 'arrow-down' : 'arrow-right'"
              pack="casa"
              size="is-small"
              class="widget-option-chevron"
            />
          </button>

          <div v-show="appsOpen" class="widget-option-children">
            <button
              v-for="app in APP_OPTIONS"
              :key="app.key"
              type="button"
              class="widget-option child"
              @click="add(`app:${app.key}`)"
            >
              <span class="widget-option-icon" :class="`is-${app.key}`">
                <b-icon :icon="app.icon" pack="casa" size="is-small" />
              </span>
              <span class="widget-option-text">
                <span class="widget-option-title">{{ app.title }}</span>
                <span class="widget-option-desc">{{ app.tagline }}</span>
              </span>
              <span
                v-if="placedAppTypes.has(`app:${app.key}`)"
                class="widget-option-pill"
                :title="$t('Already on the dashboard — click to add another.')"
              >+ {{ $t('add another') }}</span>
            </button>

            <!-- Whole-grid option lives under the same parent for discoverability -->
            <button
              type="button"
              class="widget-option child"
              :class="{ 'is-placed': placedSet.has('apps') }"
              :disabled="placedSet.has('apps')"
              @click="add('apps')"
            >
              <span class="widget-option-icon is-apps-grid">
                <b-icon icon="apps-outline" pack="casa" size="is-small" />
              </span>
              <span class="widget-option-text">
                <span class="widget-option-title">{{ $t('All apps (grid)') }}</span>
                <span class="widget-option-desc">{{ $t('A single tile that shows every installed app. Best in a wide column.') }}</span>
              </span>
              <span v-if="placedSet.has('apps')" class="widget-option-pill">{{ $t('On dashboard') }}</span>
            </button>
          </div>
        </div>

        <!-- Flat (non-grouped) widget options -->
        <button
          v-for="w in OTHER_WIDGETS"
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
          <span v-if="placedSet.has(w.key)" class="widget-option-pill">{{ $t('On dashboard') }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script>
// Five recommended apps shown when the Apps group is expanded.
const APP_OPTIONS = [
  { key: 'immich',        icon: 'image',          title: 'Immich',         tagline: 'Photos & video backup from your phone' },
  { key: 'jellyfin',      icon: 'video',          title: 'Jellyfin',       tagline: 'Movies & music to any screen' },
  { key: 'filebrowser',   icon: 'folder',         title: 'File Browser',   tagline: 'Open the CasaOS file browser app' },
  { key: 'pihole',        icon: 'shield-outline', title: 'Pi-hole',        tagline: 'Network-wide ad blocker' },
  { key: 'homeassistant', icon: 'home-outline',   title: 'Home Assistant', tagline: 'Smart-home hub' },
]

const OTHER_WIDGETS = [
  { key: 'clock',     icon: 'time-outline',        title: 'Clock',           desc: 'Local time + date.' },
  { key: 'weather',   icon: 'wallpaper-outline',   title: 'Weather',         desc: 'Current temperature + conditions, refreshed every 15 min.' },
  { key: 'search',    icon: 'show-search-outline', title: 'Web search',      desc: 'Search box that opens DuckDuckGo (or your engine) in a new tab.' },
  { key: 'sysInfo',   icon: 'cpu-outline',         title: 'System info',     desc: 'CPU, memory, and disk usage. Updates every 10 s.' },
  { key: 'files',     icon: 'folder',              title: 'Files',           desc: 'Tile that opens the built-in CasaOS file browser.' },
  { key: 'recent',    icon: 'time-outline',        title: 'Recent activity', desc: 'Your six most recently changed files.' },
  { key: 'family',    icon: 'account-outline',     title: 'On your pebble',  desc: 'Family member accounts.' },
  { key: 'addDevice', icon: 'plus-outline',        title: 'Add a device',    desc: 'Connect a phone, computer, or smart TV.' },
]

export default {
  name: 'AddWidgetPanel',
  props: {
    placed: { type: Array, default: () => [] },
  },
  data() {
    return {
      APP_OPTIONS,
      OTHER_WIDGETS,
      appsOpen: true,  // start expanded so the recommended apps are visible
    }
  },
  computed: {
    placedSet() {
      // Strip "#N" instance suffix when checking whether the generic
      // widget is already placed. App shortcuts intentionally allow
      // duplicates — those are never disabled in the picker even if
      // an instance already exists.
      const flat = (this.placed || []).map(k => (typeof k === 'string' ? k.split('#')[0] : ''))
      return new Set(flat)
    },
    placedAppTypes() {
      // For app shortcuts, surface "already placed" hint without disabling.
      return new Set((this.placed || []).filter(k => typeof k === 'string' && k.startsWith('app:')).map(k => k.split('#')[0]))
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
.add-widget-modal { width: 580px; max-width: 95vw; }

.intro {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 1rem;
}

.widget-grid {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: 1fr;
}

.widget-option {
  position: relative;
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  text-align: left;
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s, background 0.15s;

  &:hover:not(:disabled) {
    border-color: rgba(45, 95, 78, 0.55);
    transform: translateY(-1px);
  }

  &.is-placed {
    background: rgba(0, 0, 0, 0.04);
    cursor: not-allowed;
    opacity: 0.65;
  }

  &.is-group {
    cursor: default;
    background: rgba(45, 95, 78, 0.06);
    border-color: rgba(45, 95, 78, 0.18);

    &.is-open {
      background: rgba(45, 95, 78, 0.08);
    }
  }

  &.child {
    grid-template-columns: 32px 1fr auto;
    padding: 0.6rem 0.85rem;
    background: rgba(255, 255, 255, 0.7);

    .widget-option-icon {
      width: 32px;
      height: 32px;
      border-radius: 9px;
    }
  }
}

.widget-option-row {
  display: contents;  // pass grid layout through to children
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.widget-option-chevron {
  color: rgba(0, 0, 0, 0.45);
}

.widget-option-children {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
  padding-left: 0.75rem;
  border-left: 2px solid rgba(45, 95, 78, 0.18);
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
  &.is-apps,
  &.is-apps-grid { background: linear-gradient(135deg, #1f2937, #4b5563); }
  // App-specific colors (mirror AppShortcutWidget)
  &.is-immich        { background: linear-gradient(135deg, #b45f6d, #d97e8c); }
  &.is-jellyfin      { background: linear-gradient(135deg, #5e6ad2, #7c8af0); }
  &.is-filebrowser   { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }
  &.is-pihole        { background: linear-gradient(135deg, #a83239, #d04a51); }
  &.is-homeassistant { background: linear-gradient(135deg, #1e4a72, #2d6aa6); }
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
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.55);
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 8px;
  border-radius: 999px;
}
</style>
