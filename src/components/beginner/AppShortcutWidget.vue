<template>
  <button
    type="button"
    class="kode-tile app-shortcut-widget"
    :class="`is-${appKey}`"
    :aria-label="$t('Open {name}', { name: meta.title }) || `Open ${meta.title}`"
    @click="open"
  >
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <span class="shortcut-icon" :class="`is-${appKey}`">
      <b-icon :icon="meta.icon" pack="casa" size="is-medium" />
    </span>
    <span class="shortcut-text">
      <span class="shortcut-title">{{ meta.title }}</span>
      <span class="shortcut-tagline">{{ meta.tagline }}</span>
    </span>
  </button>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'
import { resolveAppUrl } from '@/service/kodeApps'

const APP_META = {
  immich:        { icon: 'image',          title: 'Immich',         tagline: 'Photos & video' },
  jellyfin:      { icon: 'video',          title: 'Jellyfin',       tagline: 'Movies & music' },
  filebrowser:   { icon: 'folder',         title: 'File Browser',   tagline: 'Files in browser' },
  pihole:        { icon: 'shield-outline', title: 'Pi-hole',        tagline: 'Ad blocker' },
  homeassistant: { icon: 'home-outline',   title: 'Home Assistant', tagline: 'Smart home' },
}

const FALLBACK_PORTS = {
  immich: 2283,
  jellyfin: 8096,
  homeassistant: 8123,
}

export default {
  name: 'AppShortcutWidget',
  mixins: [hintMode],
  props: {
    appKey: { type: String, required: true },
  },
  data() {
    return {
      host: window.location.hostname || 'pebble.local',
      url: '',
    }
  },
  computed: {
    meta() {
      return APP_META[this.appKey] || { icon: 'apps-outline', title: this.appKey, tagline: '' }
    },
    hintLabel() {
      return this.$t('Quick shortcut to {name}. Click to open in a new tab.', { name: this.meta.title }) || `Open ${this.meta.title} in a new tab`
    },
  },
  async created() {
    // Try live lookup via the CasaOS app-management API (kodeApps service
    // resolves protocol/host/port for installed apps); fall back to a
    // hardcoded port if the API call fails or the app isn't found.
    const live = await resolveAppUrl(this.appKey, this.host)
    if (live) {
      this.url = this.appKey === 'pihole' && !live.endsWith('/admin/')
        ? live.replace(/\/+$/, '') + '/admin/'
        : live
    } else {
      const port = FALLBACK_PORTS[this.appKey]
      this.url = port
        ? `http://${this.host}:${port}`
        : (this.appKey === 'pihole' ? `http://${this.host}/admin/` : `http://${this.host}`)
    }
  },
  methods: {
    open() {
      if (!this.url) return
      window.open(this.url, '_blank', 'noopener')
    },
  },
}
</script>

<style lang="scss" scoped>
.kode-tile {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s, box-shadow 0.18s;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      0 14px 36px rgba(0, 0, 0, 0.22);
  }
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

.shortcut-icon {
  flex: 0 0 44px;
  height: 44px;
  border-radius: 12px;
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

.shortcut-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.shortcut-title {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
}

.shortcut-tagline {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 1px;
}
</style>
