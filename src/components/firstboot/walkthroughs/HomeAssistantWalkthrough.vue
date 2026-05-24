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

    <!-- Sub 0: open Home Assistant at its IP. -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('Home Assistant turns your pebble into a smart-home hub — lights, thermostats, sensors, cameras, you name it. It runs entirely on your network with no cloud account required.') }}</p>
      <div class="callout">
        <b-icon icon="alert" pack="casa" size="is-small" />
        <span>{{ $t('Heads up: Home Assistant takes 3–5 minutes to fully boot the first time. If the page shows "preparing Home Assistant…", that\'s normal — give it a coffee.') }}</span>
      </div>
      <div class="setup-cta">
        <a class="setup-cta-btn" :href="url" target="_blank" rel="noopener noreferrer">
          <b-icon icon="internet-outline" pack="casa" size="is-medium" />
          <span>{{ $t('Open Home Assistant') }}</span>
        </a>
        <p class="setup-cta-hint">{{ $t('Opens in a new tab.') }} <code>{{ url }}</code></p>
      </div>
      <p class="next-prompt">{{ $t('Once you\'re on the Home Assistant page, tap Next for the steps.') }}</p>
    </section>

    <!-- Sub 1: in-app steps (create owner). -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('On the Home Assistant page:') }}</p>
      <ol class="steps">
        <li>{{ $t('Create the owner account. Use the same email + password as your KODE account so they stay in sync.') }}</li>
        <li>{{ $t('Pick your location, timezone, and units when prompted.') }}</li>
        <li>{{ $t('Sign in. You\'ll land on a near-empty Overview — we\'ll add a device next.') }}</li>
      </ol>
      <p class="next-prompt">{{ $t('Owner account created? Tap Next to install the phone app.') }}</p>
    </section>

    <!-- Sub 2: install + connect the mobile app. -->
    <section v-else-if="sub === 2" class="wt-body">
      <p>{{ $t('Install the Home Assistant Companion app on your phone. It\'s how you\'ll use HA day-to-day — for notifications, location automations ("turn off lights when I leave"), and as a remote.') }}</p>
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
      <p>{{ $t('Open the app, tap Continue, then scan the QR or paste:') }}</p>
      <div class="qr-row">
        <div class="qr">
          <QrcodeVue :value="url" :size="180" level="M" background="#ffffff" foreground="#000000" />
        </div>
        <div class="qr-side">
          <div class="server-row">
            <code class="server">{{ url }}</code>
            <b-button size="is-small" type="is-dark" rounded icon-pack="casa" icon-left="copy-outline" @click="copy(url)">
              {{ copied ? $t('Copied') : $t('Copy') }}
            </b-button>
          </div>
          <p class="hint">{{ $t('Sign in with the owner account you just created.') }}</p>
        </div>
      </div>
    </section>

    <!-- Sub 3: extra settings (add devices + dashboard). -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('A few things worth flipping on once HA is up:') }}</p>
      <ol class="steps">
        <li>
          <strong>{{ $t('Add your first device.') }}</strong>
          {{ $t('Settings → Devices & services → Discovered (top of the page). HA auto-finds Philips Hue, Nest, Sonos, IKEA TRÅDFRI, Aqara, Govee, Tuya, Shelly and more. For anything not auto-discovered: + Add Integration, search the brand.') }}
        </li>
        <li>
          <strong>{{ $t('Customise your dashboard.') }}</strong>
          {{ $t('Three dots top right → Edit dashboard → + Add Card. Drag to rearrange. Three dots → Add Section for tabs like "Living room" or "Outside".') }}
        </li>
        <li>
          <strong>{{ $t('Try an automation.') }}</strong>
          {{ $t('Settings → Automations & scenes. Start with "when motion detected after sunset, turn on hallway light".') }}
        </li>
        <li>
          <strong>{{ $t('Voice + add-ons.') }}</strong>
          {{ $t('Settings → Voice assistants for local voice. Settings → Add-ons → Add-on Store for ESPHome, MQTT, AdGuard, Node-RED.') }}
        </li>
      </ol>
    </section>

    <!-- Sub 4: all done. -->
    <section v-else-if="sub === 4" class="wt-body">
      <p>{{ $t('You\'re running a fully local smart-home hub. From here:') }}</p>
      <ul class="tips">
        <li>{{ $t('Your phone dashboard syncs automatically with the web — change a card on the laptop and it shows up on the phone.') }}</li>
        <li>
          {{ $t('Docs and recipes:') }}
          <a href="https://www.home-assistant.io/getting-started/" target="_blank" rel="noopener noreferrer" class="link">home-assistant.io</a>
        </li>
        <li>{{ $t('Heads up: HA has a learning curve. The first hour is fun. The next ten can become a rabbit hole — pace yourself.') }}</li>
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
import QrcodeVue from 'qrcode.vue'
import copy from 'clipboard-copy'
import { resolveAppUrl } from '@/service/kodeApps'

const FALLBACK_PORT = 8123
const SUB_TITLES = [
  'Open Home Assistant',
  'Create your owner account',
  'Install the companion app',
  'Extra settings',
  'You\'re running a smart home',
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
