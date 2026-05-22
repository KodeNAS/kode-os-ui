<template>
  <div class="walkthrough immich-walkthrough">
    <div class="wt-header">
      <span class="wt-icon is-immich">
        <b-icon icon="image" pack="casa" size="is-medium" />
      </span>
      <div>
        <h3 class="wt-title">Immich</h3>
        <p class="wt-subtitle">{{ subTitle }}</p>
      </div>
      <div class="wt-substep">{{ sub + 1 }} / {{ total }}</div>
    </div>

    <!-- Sub-step 1: install the app -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('Immich runs in two places: on your pebble (already done) and on your phone, which sends photos to the pebble in the background.') }}</p>
      <div class="store-row">
        <a class="store-button" href="https://apps.apple.com/app/immich/id1613945652" target="_blank" rel="noopener noreferrer">
          <b-icon icon="apple-outline" pack="casa" size="is-medium" />
          <span>{{ $t('App Store') }}</span>
        </a>
        <a class="store-button" href="https://play.google.com/store/apps/details?id=app.alextran.immich" target="_blank" rel="noopener noreferrer">
          <b-icon icon="android-outline" pack="casa" size="is-medium" />
          <span>{{ $t('Google Play') }}</span>
        </a>
      </div>
      <p class="hint">{{ $t('Tap one of the buttons on your phone, or search "Immich" in your phone\'s app store.') }}</p>
    </section>

    <!-- Sub-step 2: connect to pebble (QR + URL) -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('Open Immich on your phone. When it asks for a server, scan this code or paste the address below.') }}</p>
      <div class="qr-row">
        <div class="qr">
          <QrcodeVue :value="immichUrl" :size="180" level="M" background="#ffffff" foreground="#2d5f4e" />
        </div>
        <div class="qr-side">
          <div class="server-row">
            <code class="server">{{ immichUrl }}</code>
            <b-button size="is-small" type="is-dark" rounded icon-pack="casa" icon-left="copy-outline" @click="copy(immichUrl)">
              {{ copied ? $t('Copied') : $t('Copy') }}
            </b-button>
          </div>
          <p class="hint">{{ $t('Sign in with your KODE account once connected.') }}</p>
        </div>
      </div>
    </section>

    <!-- Sub-step 3: enable backup -->
    <section v-else-if="sub === 2" class="wt-body">
      <p>{{ $t('Now turn on automatic backup so new photos copy themselves over Wi-Fi.') }}</p>
      <ol class="steps">
        <li>{{ $t('In the Immich app, open the menu and tap Backup.') }}</li>
        <li>{{ $t('Toggle on Foreground backup and Background backup.') }}</li>
        <li>{{ $t('Pick which albums to back up (Camera Roll is the usual choice).') }}</li>
      </ol>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('On iPhone, also turn on "Background App Refresh" for Immich in iOS Settings so uploads keep going when the app is closed.') }}</span>
      </div>
    </section>

    <!-- Sub-step 4: verify -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('Once backup is on, check that the first photos arrive at your pebble.') }}</p>
      <ol class="steps">
        <li>
          {{ $t('Open Immich on the web:') }}
          <a :href="immichUrl" target="_blank" rel="noopener noreferrer" class="link">{{ immichUrl }}</a>
        </li>
        <li>{{ $t('Sign in with the same KODE account.') }}</li>
        <li>{{ $t('You should see your most recent photos within a few minutes.') }}</li>
      </ol>
      <p class="hint">
        {{ $t('Tip: the OLED on your pebble will show photos backed up today once we wire that up in a later update.') }}
      </p>
    </section>

    <div class="wt-actions">
      <b-button v-if="sub > 0" rounded @click="sub -= 1">{{ $t('Back') }}</b-button>
      <div class="is-flex-grow-1"></div>
      <b-button
        rounded
        type="is-primary"
        @click="advance"
      >
        {{ isFinal ? (isLast ? $t('All set') : $t('Next app')) : $t('Next') }}
      </b-button>
    </div>
  </div>
</template>

<script>
import QrcodeVue from 'qrcode.vue'
import copy from 'clipboard-copy'
import { resolveAppUrl } from '@/service/kodeApps'

const IMMICH_FALLBACK_PORT = 2283
const SUB_TITLES = ['Install the app', 'Connect to your pebble', 'Turn on auto backup', 'See your photos arrive']

export default {
  name: 'ImmichWalkthrough',
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
      immichUrl: `http://${this.host}:${IMMICH_FALLBACK_PORT}`,
    }
  },
  async created() {
    const live = await resolveAppUrl('immich', this.host)
    if (live) this.immichUrl = live
  },
  computed: {
    subTitle() { return this.$t(SUB_TITLES[this.sub]) },
    isFinal() { return this.sub === this.total - 1 },
  },
  methods: {
    async copy(text) {
      try {
        await copy(text)
        this.copied = true
        setTimeout(() => (this.copied = false), 1500)
      } catch (e) { this.copied = false }
    },
    advance() {
      if (this.sub < this.total - 1) {
        this.sub += 1
      } else {
        this.$emit('done')
      }
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
  margin-bottom: 1rem;
}

.wt-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  &.is-immich { background: linear-gradient(135deg, #b45f6d, #d97e8c); }
}

.wt-title { font-size: 1.125rem; font-weight: 500; color: #1f2937; margin: 0; }
.wt-subtitle { font-size: 0.8125rem; color: rgba(0, 0, 0, 0.6); margin: 0; }

.wt-substep {
  margin-left: auto;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
  background: rgba(0, 0, 0, 0.06);
  border-radius: 999px;
  padding: 2px 10px;
}

.wt-body {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.78);
  line-height: 1.55;
  margin-bottom: 1.1rem;

  p { margin-bottom: 0.75rem; }
  p:last-child { margin-bottom: 0; }
}

.store-row { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }

.store-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: rgba(31, 41, 55, 0.92);
  color: #fff;
  border-radius: 10px;
  font-size: 0.875rem;
  text-decoration: none;
  &:hover { background: #1f2937; color: #fff; }
}

.hint {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
}

.qr-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 1rem;
  align-items: start;
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
}

.qr {
  padding: 10px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  display: inline-flex;
}

.server-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.server {
  flex: 1;
  padding: 0.45rem 0.7rem;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.steps {
  margin: 0 0 0.75rem 1.1rem;
  padding: 0;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.78);
  line-height: 1.6;
}

.callout {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(45, 95, 78, 0.08);
  border-radius: 10px;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.78);
}

.link {
  color: #2d5f4e;
  text-decoration: underline;
}

.wt-actions { display: flex; align-items: center; gap: 0.5rem; }
</style>
