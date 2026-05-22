<template>
  <div class="fb-step walkthrough-step">
    <h2 class="step-title">{{ $t('Let\'s set them up') }}</h2>
    <p class="step-intro">
      {{ $t('App {n} of {total}: {name}', { n: idx + 1, total: apps.length, name: currentAppTitle }) }}
    </p>

    <ImmichWalkthrough
      v-if="currentApp === 'immich'"
      :host="host"
      :is-last="isLastApp"
      @done="advance"
    />
    <PlaceholderWalkthrough
      v-else
      :key="currentApp"
      :app-key="currentApp"
      :host="host"
      :is-last="isLastApp"
      @done="advance"
    />

    <div class="step-skip">
      <button type="button" class="skip-link" @click="skipAll">
        {{ $t('Skip the rest — I\'ll figure it out later') }}
      </button>
    </div>
  </div>
</template>

<script>
import ImmichWalkthrough from '../walkthroughs/ImmichWalkthrough.vue'
import PlaceholderWalkthrough from '../walkthroughs/PlaceholderWalkthrough.vue'

const APP_TITLES = {
  immich: 'Immich',
  jellyfin: 'Jellyfin',
  filebrowser: 'File Browser',
  pihole: 'Pi-hole',
  homeassistant: 'Home Assistant',
}

export default {
  name: 'WalkthroughStep',
  components: { ImmichWalkthrough, PlaceholderWalkthrough },
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
  },
  methods: {
    advance() {
      if (this.isLastApp) {
        this.$emit('next')
      } else {
        this.idx += 1
      }
    },
    skipAll() {
      this.$emit('next')
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

.step-skip {
  margin-top: 1rem;
  text-align: center;
}

.skip-link {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8125rem;
  text-decoration: underline;
  cursor: pointer;

  &:hover { color: #fff; }
}
</style>
