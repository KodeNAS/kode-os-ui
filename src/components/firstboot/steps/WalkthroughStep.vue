<template>
  <div class="fb-step walkthrough-step">
    <h2 class="step-title">{{ $t('Let\'s set them up') }}</h2>
    <p class="step-intro">
      {{ `${$t('App')} ${idx + 1} ${$t('of')} ${apps.length} — ${currentAppTitle}` }}
    </p>

    <component
      :is="walkthroughComponent"
      :key="currentApp"
      :app-key="currentApp"
      :host="host"
      :is-last="isLastApp"
      @done="advance"
    />

    <div class="step-footer">
      <b-button rounded size="is-small" @click="back">{{ $t('Back') }}</b-button>
      <button type="button" class="restart-link" @click="$emit('restart')">
        {{ $t('Start over from the beginning') }}
      </button>
    </div>
  </div>
</template>

<script>
import ImmichWalkthrough from '../walkthroughs/ImmichWalkthrough.vue'
import JellyfinWalkthrough from '../walkthroughs/JellyfinWalkthrough.vue'
import FileBrowserWalkthrough from '../walkthroughs/FileBrowserWalkthrough.vue'
import PiHoleWalkthrough from '../walkthroughs/PiHoleWalkthrough.vue'
import HomeAssistantWalkthrough from '../walkthroughs/HomeAssistantWalkthrough.vue'
import PlaceholderWalkthrough from '../walkthroughs/PlaceholderWalkthrough.vue'

const APP_TITLES = {
  immich: 'Immich',
  jellyfin: 'Jellyfin',
  filebrowser: 'File Browser',
  pihole: 'Pi-hole',
  homeassistant: 'Home Assistant',
}

const WALKTHROUGH_MAP = {
  immich: ImmichWalkthrough,
  jellyfin: JellyfinWalkthrough,
  filebrowser: FileBrowserWalkthrough,
  pihole: PiHoleWalkthrough,
  homeassistant: HomeAssistantWalkthrough,
}

export default {
  name: 'WalkthroughStep',
  components: {
    ImmichWalkthrough,
    JellyfinWalkthrough,
    FileBrowserWalkthrough,
    PiHoleWalkthrough,
    HomeAssistantWalkthrough,
    PlaceholderWalkthrough,
  },
  props: {
    apps: { type: Array, required: true },
    host: { type: String, required: true },
  },
  data() {
    return { idx: 0 }
  },
  computed: {
    currentApp() { return this.apps[this.idx] || '' },
    currentAppTitle() { return APP_TITLES[this.currentApp] || this.currentApp },
    isLastApp() { return this.idx === this.apps.length - 1 },
    walkthroughComponent() {
      return WALKTHROUGH_MAP[this.currentApp] || PlaceholderWalkthrough
    },
  },
  methods: {
    advance() {
      if (this.isLastApp) {
        this.$emit('next')
      } else {
        this.idx += 1
      }
    },
    back() {
      if (this.idx > 0) {
        // walk back through the apps we've already covered
        this.idx -= 1
      } else {
        // first app — Back exits the walkthrough phase entirely
        this.$emit('back')
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.step-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
  margin-bottom: 0.25rem;
}

.step-intro {
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.step-footer {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.restart-link {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8125rem;
  text-decoration: underline;
  cursor: pointer;
  padding: 0.25rem 0.5rem;

  &:hover { color: #fff; }
}
</style>
