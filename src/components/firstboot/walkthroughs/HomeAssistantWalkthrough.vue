<template>
  <div class="walkthrough">
    <div class="wt-header">
      <span class="wt-icon is-homeassistant">
        <b-icon icon="view-dashboard-outline" pack="casa" size="is-medium" />
      </span>
      <div>
        <h3 class="wt-title">{{ $t('Home Assistant') }}</h3>
        <p class="wt-subtitle">{{ subTitle }}</p>
      </div>
      <div class="wt-substep">{{ sub + 1 }} / {{ total }}</div>
    </div>

    <!-- Sub 0: open HA, set up owner account. Same setup-first
         pattern as the rest. HA takes a while to cold-boot, so the
         heads-up callout matters. -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('Home Assistant turns your pebble into a smart-home hub — lights, thermostats, sensors, cameras, you name it. It runs entirely on your network with no cloud account required.') }}</p>
      <div class="callout">
        <b-icon icon="alert" pack="casa" size="is-small" />
        <span>{{ $t('Heads up: Home Assistant takes 3–5 minutes to fully boot the first time. If the page shows "preparing Home Assistant…", that\'s normal — give it a coffee.') }}</span>
      </div>
      <p>
        {{ $t('Before anything else: open Home Assistant and create your owner account. Use the same email + password as your KODE account.') }}
      </p>
      <div class="setup-cta">
        <a class="setup-cta-btn" :href="url" target="_blank" rel="noopener noreferrer">
          <b-icon icon="show-search-outline" pack="casa" size="is-medium" />
          <span>{{ $t('Open Home Assistant') }}</span>
        </a>
        <p class="setup-cta-hint">{{ $t('Opens in a new tab.') }} <code>{{ url }}</code></p>
      </div>
      <div class="qr-row">
        <div class="qr">
          <QrcodeVue :value="url" :size="160" level="M" background="#ffffff" foreground="#000000" />
        </div>
        <div class="qr-side">
          <p class="hint">{{ $t('Or scan the QR with your phone — handy if you want to keep HA on a tablet.') }}</p>
        </div>
      </div>
      <p class="next-prompt">{{ $t('Owner account created? Tap Next to install the companion app.') }}</p>
    </section>

    <!-- Sub 1: NEW — install the companion app -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('Install the Home Assistant Companion app on your phone before the next step. It\'s how you\'ll actually use HA day-to-day — for notifications, location-based automations ("turn off lights when I leave"), and as a remote.') }}</p>
      <div class="store-row">
        <a class="store-button" href="https://apps.apple.com/app/home-assistant/id1099568401" target="_blank" rel="noopener noreferrer">
          <b-icon icon="ios" pack="casa" size="is-medium" />
          <span>{{ $t('App Store') }}</span>
        </a>
        <a class="store-button" href="https://play.google.com/store/apps/details?id=io.homeassistant.companion.android" target="_blank" rel="noopener noreferrer">
          <b-icon icon="android" pack="casa" size="is-medium" />
          <span>{{ $t('Google Play') }}</span>
        </a>
      </div>
      <p>{{ $t('When the app opens, tap "Continue", then either scan the QR from the previous step, or paste:') }}</p>
      <div class="server-row">
        <code class="server">{{ url }}</code>
        <b-button size="is-small" type="is-dark" rounded icon-pack="casa" icon-left="copy-outline" @click="copy(url)">
          {{ copied ? $t('Copied') : $t('Copy') }}
        </b-button>
      </div>
      <p class="hint">{{ $t('Sign in with the owner account you just created in the browser.') }}</p>
    </section>

    <!-- Sub 2: add an integration -->
    <section v-else-if="sub === 2" class="wt-body">
      <p>{{ $t('Now hook up your first device. Home Assistant auto-discovers most network gear, so this is usually a few clicks:') }}</p>
      <ol class="steps">
        <li>{{ $t('Click Settings (bottom left of the web UI).') }}</li>
        <li>{{ $t('Click Devices & services.') }}</li>
        <li>{{ $t('Check the Discovered section at the top — anything HA found on your network shows up here.') }}</li>
        <li>{{ $t('Or click + Add Integration and search for the brand: Philips Hue, Nest, Sonos, IKEA TRÅDFRI, Aqara, Govee, Tuya, Shelly, etc.') }}</li>
        <li>{{ $t('Follow the on-screen pairing steps; most integrations take 30 seconds.') }}</li>
      </ol>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Don\'t know what brand you have? Click + Add Integration and use the Match brand by photo option (some integrations support it) or browse the categories.') }}</span>
      </div>
    </section>

    <!-- Sub 3: build a dashboard -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('The Overview page is where you see and control everything. To make it your own:') }}</p>
      <ol class="steps">
        <li>{{ $t('Click the three dots top right → Edit dashboard.') }}</li>
        <li>{{ $t('Click + Add Card to drop in switches, sensors, weather, media controls, and more. There are dozens of card types.') }}</li>
        <li>{{ $t('Drag cards to rearrange them; HA snaps them to a grid.') }}</li>
        <li>{{ $t('Three dots → Add Section to make multiple tabs (e.g. "Living room", "Outside", "Energy").') }}</li>
        <li>{{ $t('Click the X (top right) to finish editing.') }}</li>
      </ol>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Want it on your phone? Open the companion app — your dashboard syncs automatically.') }}</span>
      </div>
    </section>

    <!-- Sub 4: where to go next -->
    <section v-else-if="sub === 4" class="wt-body">
      <p>{{ $t('That\'s the basics. A few directions to grow into:') }}</p>
      <ul class="tips">
        <li>
          <strong>{{ $t('Automations.') }}</strong>
          {{ $t('Settings → Automations & scenes. Try "when motion detected after sunset, turn on hallway light".') }}
        </li>
        <li>
          <strong>{{ $t('Voice control.') }}</strong>
          {{ $t('Settings → Voice assistants. HA can run a local voice pipeline (no cloud), or hook into Alexa / Google Home.') }}
        </li>
        <li>
          <strong>{{ $t('Add-ons.') }}</strong>
          {{ $t('Settings → Add-ons → Add-on Store. ESPHome, Mosquitto MQTT, AdGuard, Node-RED, and many more.') }}
        </li>
        <li>
          <strong>{{ $t('Docs:') }}</strong>
          <a href="https://www.home-assistant.io/getting-started/" target="_blank" rel="noopener noreferrer" class="link">
            home-assistant.io
          </a>
        </li>
      </ul>
      <p class="hint">{{ $t('Heads up: HA has a learning curve. The first hour is fun. The next ten can become a rabbit hole — pace yourself.') }}</p>
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
import QrcodeVue from 'qrcode.vue'
import copy from 'clipboard-copy'
import { resolveAppUrl } from '@/service/kodeApps'

const FALLBACK_PORT = 8123
const SUB_TITLES = [
  'Set up your Home Assistant owner',
  'Install the companion app',
  'Add your first device',
  'Make a dashboard',
  'Where to go next',
]

export default {
  name: 'HomeAssistantWalkthrough',
  components: { QrcodeVue },
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
</style>
