<template>
  <b-sidebar
    v-model="open"
    right
    fullheight
    overlay
    type="is-light"
    can-cancel
    class="app-guides-sidebar"
  >
    <div class="guides-content">
      <!-- Header: shows title when at list, shows back arrow when in walkthrough -->
      <header class="guides-header">
        <button
          v-if="selectedKey"
          class="guides-back"
          :aria-label="$t('Back to list')"
          @click="selectedKey = ''"
        >
          <b-icon icon="left-outline" pack="casa" size="is-small" />
          <span>{{ $t('All guides') }}</span>
        </button>
        <h2 v-else class="guides-title">{{ $t('App guides') }}</h2>
        <p v-if="!selectedKey" class="guides-subtitle">
          {{ $t('Step-by-step setup walkthroughs for each app on your pebble.') }}
        </p>

        <button class="guides-close" :aria-label="$t('Close')" @click="open = false">
          <b-icon icon="close-outline" pack="casa" size="is-small" />
        </button>
      </header>

      <!-- List view -->
      <ul v-if="!selectedKey" class="guides-list">
        <li v-for="app in apps" :key="app.key" class="guides-row" @click="selectedKey = app.key">
          <span class="guide-icon" :class="`is-${app.key}`">
            <b-icon :icon="app.icon" pack="casa" size="is-medium" />
          </span>
          <div class="guide-text">
            <div class="guide-name">{{ app.title }}</div>
            <div class="guide-tagline">{{ app.tagline }}</div>
          </div>
          <b-icon icon="right-outline" pack="casa" size="is-small" class="guide-chevron" />
        </li>
      </ul>

      <!-- Inline walkthrough view -->
      <div v-else class="guides-walkthrough">
        <component
          :is="walkthroughComponent"
          :host="host"
          :is-last="true"
          @done="onWalkthroughDone"
        />
      </div>

      <p v-if="!selectedKey" class="guides-foot">
        {{ $t('You can replay any guide from this panel anytime.') }}
      </p>
    </div>
  </b-sidebar>
</template>

<script>
import ImmichWalkthrough from '@/components/firstboot/walkthroughs/ImmichWalkthrough.vue'
import JellyfinWalkthrough from '@/components/firstboot/walkthroughs/JellyfinWalkthrough.vue'
import FileBrowserWalkthrough from '@/components/firstboot/walkthroughs/FileBrowserWalkthrough.vue'
import PiHoleWalkthrough from '@/components/firstboot/walkthroughs/PiHoleWalkthrough.vue'
import HomeAssistantWalkthrough from '@/components/firstboot/walkthroughs/HomeAssistantWalkthrough.vue'

// Icon names must exist in the casa pack. Earlier values (`image`,
// `video`, `folder`, `shield-outline`, `home-outline`) aren't in the
// pack, so each row rendered with no visible icon and the panel
// looked broken. Verified casa-* glyph names below.
const APPS = [
  { key: 'immich',        icon: 'gallery-outline',        title: 'Immich',         tagline: 'Photo & video backup from your phone.' },
  { key: 'jellyfin',      icon: 'media-outline',          title: 'Jellyfin',       tagline: 'Stream movies and music to your TV.' },
  { key: 'filebrowser',   icon: 'folder-outline',         title: 'File Browser',   tagline: 'Manage your files from any browser.' },
  { key: 'pihole',        icon: 'protection-outline',     title: 'Pi-hole',        tagline: 'Block ads on your whole network.' },
  { key: 'homeassistant', icon: 'view-dashboard-outline', title: 'Home Assistant', tagline: 'Smart-home hub for lights, thermostats, sensors.' },
]

const WALKTHROUGHS = {
  immich: ImmichWalkthrough,
  jellyfin: JellyfinWalkthrough,
  filebrowser: FileBrowserWalkthrough,
  pihole: PiHoleWalkthrough,
  homeassistant: HomeAssistantWalkthrough,
}

export default {
  name: 'AppGuidesPanel',
  components: {
    ImmichWalkthrough,
    JellyfinWalkthrough,
    FileBrowserWalkthrough,
    PiHoleWalkthrough,
    HomeAssistantWalkthrough,
  },
  data() {
    return {
      open: true,
      apps: APPS,
      selectedKey: '',
      host: window.location.hostname || 'pebble.local',
    }
  },
  computed: {
    walkthroughComponent() {
      return WALKTHROUGHS[this.selectedKey] || null
    },
  },
  watch: {
    open(val) {
      if (!val) this.$emit('close')
    },
  },
  methods: {
    onWalkthroughDone() {
      // Walkthrough finished — return to the list rather than closing the
      // whole sidebar, so the user can browse another.
      this.selectedKey = ''
    },
  },
}
</script>

<style lang="scss" scoped>
.app-guides-sidebar ::v-deep .sidebar-content {
  width: 460px;
  max-width: 95vw;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-left: 1px solid rgba(0, 0, 0, 0.08);
}

.guides-content {
  padding: 1.5rem 1.25rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.guides-header {
  position: relative;
  margin-bottom: 1.25rem;
  padding-right: 2rem;
  flex-shrink: 0;
}

.guides-title {
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #1f2937;
  margin: 0 0 0.25rem;
}

.guides-subtitle {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.5;
  margin: 0;
}

.guides-back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  color: #2d5f4e;
  cursor: pointer;
  padding: 0.25rem 0;

  &:hover {
    color: #3f7a66;
  }
}

.guides-close {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.55);
  padding: 0.25rem;
  border-radius: 50%;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }
}

.guides-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  flex: 1;
  overflow-y: auto;
}

.guides-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 0.85rem;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s, background 0.15s;

  &:hover {
    border-color: rgba(45, 95, 78, 0.4);
    background: rgba(255, 255, 255, 1);
    transform: translateY(-1px);
  }
}

.guide-chevron {
  color: rgba(0, 0, 0, 0.35);
}

.guide-icon {
  flex: 0 0 44px;
  height: 44px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  &.is-immich        { background: linear-gradient(135deg, #b45f6d, #d97e8c); }
  &.is-jellyfin      { background: linear-gradient(135deg, #5e6ad2, #7c8af0); }
  &.is-filebrowser   { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }
  &.is-pihole        { background: linear-gradient(135deg, #a83239, #d04a51); }
  &.is-homeassistant { background: linear-gradient(135deg, #1e4a72, #2d6aa6); }
}

.guide-text {
  flex: 1;
  min-width: 0;
}

.guide-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1f2937;
}

.guide-tagline {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 1px;
}

.guides-walkthrough {
  flex: 1;
  overflow-y: auto;
  margin: 0 -0.25rem;  // small breath so the walkthrough card edges line up
}

/* The walkthrough's outer .walkthrough already has its own glass styling;
   loosen the padding so it fits the narrower sidebar nicely. */
.guides-walkthrough ::v-deep .walkthrough {
  padding: 1rem;
}

.guides-foot {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.5);
  text-align: center;
  margin-top: 1rem;
  flex-shrink: 0;
}
</style>
