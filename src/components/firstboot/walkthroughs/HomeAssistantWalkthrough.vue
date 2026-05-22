<template>
  <div class="walkthrough">
    <div class="wt-header">
      <span class="wt-icon is-homeassistant">
        <b-icon icon="home-outline" pack="casa" size="is-medium" />
      </span>
      <div>
        <h3 class="wt-title">{{ $t('Home Assistant') }}</h3>
        <p class="wt-subtitle">{{ subTitle }}</p>
      </div>
      <div class="wt-substep">{{ sub + 1 }} / {{ total }}</div>
    </div>

    <!-- Sub 0: heads-up about complexity -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('Home Assistant turns your pebble into a smart-home hub — lights, thermostats, sensors, cameras, you name it.') }}</p>
      <div class="callout">
        <b-icon icon="alert" pack="casa" size="is-small" />
        <span>{{ $t('Heads up: Home Assistant has a learning curve. The first hour is rewarding; the next ten can be a rabbit hole. Pace yourself.') }}</span>
      </div>
      <p>{{ $t('Open it to create your owner account:') }}</p>
      <div class="server-row">
        <code class="server">{{ url }}</code>
        <b-button size="is-small" type="is-dark" rounded icon-pack="casa" icon-left="copy-outline" @click="copy(url)">
          {{ copied ? $t('Copied') : $t('Copy') }}
        </b-button>
      </div>
      <b-button rounded type="is-light" tag="a" :href="url" target="_blank" rel="noopener noreferrer">
        {{ $t('Open Home Assistant') }}
      </b-button>
    </section>

    <!-- Sub 1: add an integration -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('After the account is set up, add your first device:') }}</p>
      <ol class="steps">
        <li>{{ $t('Click Settings (bottom left).') }}</li>
        <li>{{ $t('Click Devices & services.') }}</li>
        <li>{{ $t('Click + Add Integration.') }}</li>
        <li>{{ $t('Search for the brand of your device — Philips Hue, Nest, Sonos, Aqara, IKEA TRÅDFRI, etc.') }}</li>
        <li>{{ $t('Follow the on-screen steps; most integrations auto-discover.') }}</li>
      </ol>
      <p class="hint">{{ $t('Already-on-your-network devices often appear without any setup at all — give Home Assistant a few minutes to find them.') }}</p>
    </section>

    <!-- Sub 2: build a dashboard -->
    <section v-else-if="sub === 2" class="wt-body">
      <p>{{ $t('The Overview page is where you see and control everything. To make it your own:') }}</p>
      <ol class="steps">
        <li>{{ $t('Click the three dots top right → Edit dashboard.') }}</li>
        <li>{{ $t('Click + Add Card to drop in things like switches, sensors, weather, or media controls.') }}</li>
        <li>{{ $t('Drag cards around to arrange them.') }}</li>
        <li>{{ $t('When you\'re happy, click the X to finish editing.') }}</li>
      </ol>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Tip: Add the Home Assistant Companion app to your phone for notifications, location-based automations, and remote control.') }}</span>
      </div>
    </section>

    <!-- Sub 3: where to learn more -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('That\'s the basics. When you\'re ready for more:') }}</p>
      <ul class="tips">
        <li>
          {{ $t('Official docs:') }}
          <a href="https://www.home-assistant.io/getting-started/" target="_blank" rel="noopener noreferrer" class="link">
            home-assistant.io
          </a>
        </li>
        <li>{{ $t('Set up Automations under Settings → Automations & scenes ("when motion detected, turn on hallway light").') }}</li>
        <li>{{ $t('Browse the Community in Settings → for thousands of ready-made integrations and themes.') }}</li>
      </ul>
    </section>

    <div class="wt-actions">
      <b-button v-if="sub > 0" rounded @click="sub -= 1">{{ $t('Back') }}</b-button>
      <div class="is-flex-grow-1"></div>
      <b-button rounded type="is-primary" @click="advance">
        {{ isFinal ? (isLast ? $t('All set') : $t('Next app')) : $t('Next') }}
      </b-button>
    </div>
  </div>
</template>

<script>
import copy from 'clipboard-copy'
import { resolveAppUrl } from '@/service/kodeApps'

const FALLBACK_PORT = 8123
const SUB_TITLES = ['Open Home Assistant', 'Add your first device', 'Make a dashboard', 'Where to go next']

export default {
  name: 'HomeAssistantWalkthrough',
  props: {
    host: { type: String, required: true },
    isLast: { type: Boolean, default: false },
  },
  data() {
    return {
      sub: 0,
      copied: false,
      total: SUB_TITLES.length,
      url: `http://${this.host}:${FALLBACK_PORT}`,
    }
  },
  async created() {
    const live = await resolveAppUrl('homeassistant', this.host)
    if (live) this.url = live
  },
  computed: {
    subTitle() { return this.$t(SUB_TITLES[this.sub]) },
    isFinal() { return this.sub === this.total - 1 },
  },
  methods: {
    async copy(text) {
      try { await copy(text); this.copied = true; setTimeout(() => (this.copied = false), 1500) }
      catch (e) { this.copied = false }
    },
    advance() {
      if (this.sub < this.total - 1) this.sub += 1
      else this.$emit('done')
    },
  },
}
</script>

<style lang="scss" scoped>
@import './_walkthrough.scss';
.wt-icon.is-homeassistant { background: linear-gradient(135deg, #1e4a72, #2d6aa6); }

.link { color: #2d5f4e; text-decoration: underline; }
</style>
