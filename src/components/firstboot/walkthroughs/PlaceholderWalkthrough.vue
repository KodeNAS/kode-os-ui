<template>
  <div class="walkthrough placeholder-walkthrough">
    <div class="wt-header">
      <span class="wt-icon" :class="`is-${appKey}`">
        <b-icon :icon="meta.icon" pack="casa" size="is-medium" />
      </span>
      <div>
        <h3 class="wt-title">{{ meta.title }}</h3>
        <p class="wt-subtitle">{{ meta.tagline }}</p>
      </div>
    </div>

    <p class="wt-body">{{ meta.intro }}</p>

    <div class="wt-actions">
      <b-button
        v-if="appUrl"
        rounded
        type="is-light"
        tag="a"
        :href="appUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ $t('Open {name}', { name: meta.title }) }}
      </b-button>
      <b-button rounded type="is-primary" @click="$emit('done')">
        {{ isLast ? $t('All set') : $t('Next app') }}
      </b-button>
    </div>
  </div>
</template>

<script>
import { resolveAppUrl } from '@/service/kodeApps'

const FALLBACK_PORTS = {
  jellyfin: 8096,
  filebrowser: null,    // file browser is the upstream UI; no separate URL needed
  pihole: null,         // /admin/ on the pi-hole port; resolved at runtime
  homeassistant: 8123,
}

const META = {
  jellyfin: {
    icon: 'video',
    title: 'Jellyfin',
    tagline: 'Stream movies, shows, and music',
    intro: 'Open Jellyfin in your browser to set up libraries (point each at /DATA/Videos, /DATA/Music, etc). On step 3 you\'ll see how to install the Jellyfin app on your TV.',
  },
  filebrowser: {
    icon: 'folder',
    title: 'File Browser',
    tagline: 'Manage your pebble\'s files from any browser',
    intro: 'File Browser lets you upload, download, share, and organize files in /DATA from any web browser. After setup you\'ll find it in your app dock.',
  },
  pihole: {
    icon: 'shield-outline',
    title: 'Pi-hole',
    tagline: 'Block ads on every device in your home',
    intro: 'Open the Pi-hole admin to set your router\'s DNS to your pebble\'s IP. Once that\'s done, every device on your network gets ads blocked automatically.',
  },
  homeassistant: {
    icon: 'home-outline',
    title: 'Home Assistant',
    tagline: 'Control lights, sensors, and smart-home devices',
    intro: 'Open Home Assistant to create your owner account and start adding integrations. This one is advanced — set aside some time to explore.',
  },
}

export default {
  name: 'PlaceholderWalkthrough',
  props: {
    appKey: { type: String, required: true },
    host: { type: String, required: true },
    isLast: { type: Boolean, default: false },
  },
  data() {
    return {
      appUrl: this.fallbackUrl(),
    }
  },
  async created() {
    const live = await resolveAppUrl(this.appKey, this.host)
    if (live) {
      this.appUrl = this.appKey === 'pihole' && !live.endsWith('/admin/')
        ? live.replace(/\/+$/, '') + '/admin/'
        : live
    }
  },
  computed: {
    meta() {
      return META[this.appKey] || { icon: 'file', title: this.appKey, tagline: '', intro: '' }
    },
  },
  methods: {
    fallbackUrl() {
      const port = FALLBACK_PORTS[this.appKey]
      if (port) return `http://${this.host}:${port}`
      if (this.appKey === 'pihole') return `http://${this.host}/admin/`
      return null
    },
  },
}
</script>

<style lang="scss" scoped>
.walkthrough {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 18px;
  padding: 1.25rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
}

.wt-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.85rem;
}

.wt-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;

  &.is-jellyfin      { background: linear-gradient(135deg, #5e6ad2, #7c8af0); }
  &.is-filebrowser   { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }
  &.is-pihole        { background: linear-gradient(135deg, #a83239, #d04a51); }
  &.is-homeassistant { background: linear-gradient(135deg, #1e4a72, #2d6aa6); }
}

.wt-title { font-size: 1.125rem; font-weight: 500; color: #1f2937; margin: 0; }
.wt-subtitle { font-size: 0.8125rem; color: rgba(0, 0, 0, 0.6); margin: 0; }

.wt-body {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.78);
  line-height: 1.55;
  margin-bottom: 1.1rem;
}

.wt-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
</style>
