<template>
  <div class="walkthrough immich-walkthrough">
    <div class="wt-header">
      <span class="wt-icon is-immich">
        <b-icon icon="gallery-outline" pack="casa" size="is-medium" />
      </span>
      <div>
        <h3 class="wt-title">Immich</h3>
        <p class="wt-subtitle">{{ subTitle }}</p>
      </div>
      <div class="wt-substep">{{ sub + 1 }} / {{ total }}</div>
    </div>

    <!-- Sub-step 1: set up the Immich admin account on the web first.
         The wizard tried to do this automatically using the buyer's
         credentials, but cross-origin CORS often blocks it. So we
         always show the manual button as the source of truth — if
         the auto-setup worked, signing in just works; if it didn't,
         the user creates the account here. -->
    <section v-if="sub === 0" class="wt-body">
      <p>
        {{ $t('Before anything else: open Immich in your browser and create your admin account. Use the same email + password you set for KODE so they stay in sync.') }}
      </p>
      <div class="setup-cta">
        <a class="setup-cta-btn" :href="immichUrl" target="_blank" rel="noopener noreferrer">
          <b-icon icon="internet-outline" pack="casa" size="is-medium" />
          <span>{{ $t('Open Immich') }}</span>
        </a>
        <p class="setup-cta-hint">
          {{ $t('Opens in a new tab. Sign up with the email + password you just set, then come back here.') }}
        </p>
      </div>
      <p class="next-prompt">{{ $t('Done? Tap Next below to continue with the phone app.') }}</p>
    </section>

    <!-- Sub-step 2: install the phone app -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('Immich runs in two places: on your pebble (already done) and on your phone, which sends photos to the pebble in the background.') }}</p>
      <div class="store-row">
        <a class="store-button" href="https://apps.apple.com/app/immich/id1613945652" target="_blank" rel="noopener noreferrer">
          <b-icon icon="ios" pack="casa" size="is-medium" />
          <span>{{ $t('App Store') }}</span>
        </a>
        <a class="store-button" href="https://play.google.com/store/apps/details?id=app.alextran.immich" target="_blank" rel="noopener noreferrer">
          <b-icon icon="android" pack="casa" size="is-medium" />
          <span>{{ $t('Google Play') }}</span>
        </a>
      </div>
      <p class="hint">{{ $t('Tap one of the buttons on your phone, or search "Immich" in your phone\'s app store.') }}</p>
    </section>

    <!-- Sub-step 3: connect to pebble (QR + URL) -->
    <section v-else-if="sub === 2" class="wt-body">
      <p>{{ $t('Open Immich on your phone. When it asks for a server, scan this code or paste the address below.') }}</p>
      <div class="qr-row">
        <div class="qr">
          <QrcodeVue :value="immichUrl" :size="200" level="M" background="#ffffff" foreground="#000000" />
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

    <!-- Sub-step 4: enable backup -->
    <section v-else-if="sub === 3" class="wt-body">
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

    <!-- Sub-step 5: verify -->
    <section v-else-if="sub === 4" class="wt-body">
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

    <!-- Sub-step 5: hook up the Photo-of-the-Day dashboard widget.
         Logs into Immich via the REST API on the user's behalf and
         generates a read-only API key automatically — saved straight
         into the widget's localStorage settings so the user never has
         to find/copy a key themselves. Skippable. -->
    <section v-else-if="sub === 5" class="wt-body">
      <p v-if="!potdConfigured">
        {{ $t('Want a daily photo from your Immich library on your KODE dashboard? Sign in once and we\'ll set it up for you.') }}
      </p>

      <div v-if="!potdConfigured" class="potd-form">
        <div class="potd-field">
          <label class="potd-label">{{ $t('Immich email') }}</label>
          <b-input v-model="potdEmail" type="email" :placeholder="$t('you@example.com')" :disabled="potdConnecting" />
        </div>
        <div class="potd-field">
          <label class="potd-label">{{ $t('Immich password') }}</label>
          <b-input
            v-model="potdPassword"
            type="password"
            password-reveal
            :placeholder="$t('Same password you set in Immich')"
            :disabled="potdConnecting"
            @keyup.enter="connectPhotoOfTheDay"
          />
        </div>
        <p v-if="potdError" class="potd-error">{{ potdError }}</p>
        <div class="potd-actions">
          <b-button
            rounded
            type="is-primary"
            :loading="potdConnecting"
            :disabled="!potdEmail || !potdPassword"
            @click="connectPhotoOfTheDay"
          >
            {{ $t('Set up Photo of the Day') }}
          </b-button>
          <b-button rounded :disabled="potdConnecting" @click="skipPhotoOfTheDay">
            {{ $t('Skip for now') }}
          </b-button>
        </div>
        <p class="hint">
          {{ $t('Your password is only used once to generate a permanent read-only API key. Nothing leaves this browser except the request to your own pebble.') }}
        </p>
      </div>

      <div v-else class="potd-success">
        <span class="potd-check">
          <b-icon icon="check" pack="casa" size="is-medium" />
        </span>
        <div class="potd-success-text">
          <div class="potd-success-title">{{ $t('Photo of the Day is ready') }}</div>
          <div class="potd-success-sub">
            {{ potdSuccessSub }}
          </div>
        </div>
      </div>
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
const SUB_TITLES = [
  'Set up your Immich account',
  'Install the phone app',
  'Connect to your pebble',
  'Turn on auto backup',
  'See your photos arrive',
  'Show on your dashboard',
]
const POTD_SETTINGS_KEY = 'kode_potd_settings'

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
      // Photo-of-the-Day auto-setup state
      potdEmail: '',
      potdPassword: '',
      potdConnecting: false,
      potdConfigured: false,
      potdError: '',
      potdUserName: '',
    }
  },
  async created() {
    const live = await resolveAppUrl('immich', this.host)
    if (live) this.immichUrl = live
    // If a previous run of this wizard already configured Photo of the
    // Day, surface that on the final step so the user doesn't redo it.
    try {
      const raw = localStorage.getItem(POTD_SETTINGS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && parsed.apiKey && parsed.immichUrl) this.potdConfigured = true
      }
    } catch (e) { /* ignore */ }
  },
  computed: {
    subTitle() { return this.$t(SUB_TITLES[this.sub]) },
    isFinal() { return this.sub === this.total - 1 },
    potdSuccessSub() {
      const tail = this.$t('Add the "Photo of the day" widget on your dashboard to see it.')
      return this.potdUserName
        ? `${this.$t('Connected as')} ${this.potdUserName}. ${tail}`
        : tail
    },
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
    async connectPhotoOfTheDay() {
      if (!this.potdEmail || !this.potdPassword) return
      this.potdConnecting = true
      this.potdError = ''
      try {
        const base = String(this.immichUrl || '').replace(/\/+$/, '')

        // 1. Log in to Immich with the credentials the user just set
        //    when creating their account. Returns an access token tied
        //    to that session — we use it only to mint an API key.
        const loginRes = await fetch(`${base}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email: this.potdEmail, password: this.potdPassword }),
        })
        if (!loginRes.ok) {
          if (loginRes.status === 401) {
            this.potdError = this.$t('Email or password didn\'t match Immich. Try again.')
          } else {
            this.potdError = `${this.$t('Login failed:')} HTTP ${loginRes.status}`
          }
          return
        }
        const loginData = await loginRes.json()
        const accessToken = loginData.accessToken
        this.potdUserName = loginData.name || loginData.userEmail || this.potdEmail
        if (!accessToken) {
          this.potdError = this.$t('Immich didn\'t return an access token.')
          return
        }

        // 2. Create a named API key. We try the modern shape (with the
        //    `permissions` array) first, then fall back to the legacy
        //    "no permissions" shape if the server doesn't accept it —
        //    Immich changed this API mid-2.x.
        const keyName = 'KODE OS – Photo of the Day'
        const READ_ONLY_PERMS = ['asset.read', 'album.read', 'memory.read', 'partner.read']
        let keyRes = await fetch(`${base}/api/api-keys`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({ name: keyName, permissions: READ_ONLY_PERMS }),
        })
        if (!keyRes.ok) {
          keyRes = await fetch(`${base}/api/api-keys`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
            body: JSON.stringify({ name: keyName }),
          })
        }
        if (!keyRes.ok) {
          this.potdError = `${this.$t('Couldn\'t create an API key:')} HTTP ${keyRes.status}`
          return
        }
        const keyData = await keyRes.json()
        const secret = keyData.secret || (keyData.apiKey && keyData.apiKey.secret)
        if (!secret) {
          this.potdError = this.$t('Immich didn\'t return a key. Try again or use the gear button on the widget to enter one manually.')
          return
        }

        // 3. Save into the same localStorage shape the widget reads.
        //    Default to Memory Lane + daily rotation — the nostalgic
        //    angle is the whole point of this widget.
        const settings = {
          immichUrl: base,
          apiKey: secret,
          source: 'memory',
          albumId: '',
          refreshHours: 24,
        }
        localStorage.setItem(POTD_SETTINGS_KEY, JSON.stringify(settings))
        this.potdConfigured = true
        // Forget the password the moment we're done with it.
        this.potdPassword = ''
      } catch (e) {
        this.potdError = e && e.message ? e.message : this.$t('Couldn\'t reach Immich.')
      } finally {
        this.potdConnecting = false
      }
    },
    skipPhotoOfTheDay() {
      // Advancing without setting up — leave the widget unconfigured;
      // the user can still set it up later from the gear button.
      this.$emit('done')
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
  grid-template-columns: 220px 1fr;
  gap: 1.25rem;
  align-items: start;
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
}

.qr {
  padding: 14px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.server-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.server {
  flex: 1;
  min-width: 0;
  padding: 0.45rem 0.7rem;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #1f2937;
  word-break: break-all;
  overflow-wrap: anywhere;
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

/* Photo-of-the-Day auto-setup form. */
.potd-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-bottom: 0.75rem;
}

.potd-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.potd-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 600;
}

.potd-error {
  font-size: 0.8125rem;
  color: #b04a4a;
  background: rgba(176, 74, 74, 0.08);
  border-radius: 8px;
  padding: 0.45rem 0.65rem;
}

.potd-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.potd-success {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: rgba(45, 95, 78, 0.10);
  border: 1px solid rgba(45, 95, 78, 0.22);
  border-radius: 12px;
  margin-bottom: 0.5rem;
}

.potd-check {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2d5f4e;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.potd-success-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.potd-success-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
}

.potd-success-sub {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.4;
}
</style>
