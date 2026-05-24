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

    <!-- Sub 0: open Immich at its IP. Same single setup-cta button used
         by every other walkthrough so all five apps look identical. -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('Immich is your private photo + video backup. Step one: open it in your browser and create an admin account.') }}</p>
      <div class="setup-cta">
        <a class="setup-cta-btn" :href="immichUrl" target="_blank" rel="noopener noreferrer">
          <b-icon icon="internet-outline" pack="casa" size="is-medium" />
          <span>{{ $t('Open Immich') }}</span>
        </a>
        <p class="setup-cta-hint">{{ $t('Opens in a new tab.') }} <code>{{ immichUrl }}</code></p>
      </div>
      <p class="next-prompt">{{ $t('Once you\'re looking at the Immich page, tap Next for the steps.') }}</p>
    </section>

    <!-- Sub 1: show the in-app steps the user takes inside Immich. -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('On the Immich page you just opened:') }}</p>
      <ol class="steps">
        <li>{{ $t('Click Get Started, then create the admin account.') }}</li>
        <li>{{ $t('Use the same email + password as your KODE account so they stay in sync.') }}</li>
        <li>{{ $t('Sign in. You\'ll land on an empty timeline — that\'s expected.') }}</li>
      </ol>
      <p class="next-prompt">{{ $t('Admin account ready? Tap Next to install the phone app.') }}</p>
    </section>

    <!-- Sub 2: install + connect the mobile app. -->
    <section v-else-if="sub === 2" class="wt-body">
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
      <p>{{ $t('Open the app. When it asks for a server, scan this code or paste the address below.') }}</p>
      <div class="qr-row">
        <div class="qr">
          <QrcodeVue :value="immichUrl" :size="180" level="M" background="#ffffff" foreground="#000000" />
        </div>
        <div class="qr-side">
          <div class="server-row">
            <code class="server">{{ immichUrl }}</code>
            <b-button size="is-small" type="is-dark" rounded icon-pack="casa" icon-left="copy-outline" @click="copy(immichUrl)">
              {{ copied ? $t('Copied') : $t('Copy') }}
            </b-button>
          </div>
          <p class="hint">{{ $t('Sign in with the email + password you just set.') }}</p>
        </div>
      </div>
    </section>

    <!-- Sub 3: extra settings + how to enable them. -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('A few settings worth flipping on once you\'re signed in:') }}</p>
      <ol class="steps">
        <li>
          <strong>{{ $t('Auto backup.') }}</strong>
          {{ $t('In the Immich app: menu → Backup. Toggle on Foreground and Background backup, then pick Camera Roll as the album.') }}
        </li>
        <li>
          <strong>{{ $t('iOS background refresh.') }}</strong>
          {{ $t('iOS Settings → General → Background App Refresh → Immich on. Without this, uploads pause when the app isn\'t open.') }}
        </li>
        <li>
          <strong>{{ $t('Photo of the day on your dashboard.') }}</strong>
          {{ $t('Want a daily photo on KODE? Sign in once below and we\'ll wire it up automatically.') }}
        </li>
      </ol>

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
          <b-button rounded :disabled="potdConnecting" @click="potdConfigured = true">
            {{ $t('Skip') }}
          </b-button>
        </div>
        <p class="hint">
          {{ $t('Your password is only used once to mint a read-only API key. Nothing leaves this browser.') }}
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

    <!-- Sub 4: all done screen. -->
    <section v-else-if="sub === 4" class="wt-body">
      <p>{{ $t('That\'s Immich set up. New photos from your phone start arriving as soon as auto backup is on — usually within a few minutes.') }}</p>
      <ul class="tips">
        <li>{{ $t('Open Immich anytime at') }} <a :href="immichUrl" target="_blank" rel="noopener noreferrer" class="link">{{ immichUrl }}</a></li>
        <li>{{ $t('Use the Memory Lane row on the home page to flip through "On this day" photos from past years.') }}</li>
        <li>{{ $t('You can share an album link to give family or friends view-only access without making an account.') }}</li>
      </ul>
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
  'Open Immich',
  'Create your account',
  'Connect the mobile app',
  'Extra settings',
  'You\'re all set',
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
    // Day, surface that so the user doesn't redo it.
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

        // 2. Create a named API key. Try the modern shape first then
        //    fall back to legacy — Immich changed this API mid-2.x.
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

        const settings = {
          immichUrl: base,
          apiKey: secret,
          source: 'memory',
          albumId: '',
          refreshHours: 24,
        }
        localStorage.setItem(POTD_SETTINGS_KEY, JSON.stringify(settings))
        this.potdConfigured = true
        this.potdPassword = ''
      } catch (e) {
        this.potdError = e && e.message ? e.message : this.$t('Couldn\'t reach Immich.')
      } finally {
        this.potdConnecting = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
@import './_walkthrough.scss';
.wt-icon.is-immich { background: linear-gradient(135deg, #b45f6d, #d97e8c); }

/* Photo-of-the-Day auto-setup form. */
.potd-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin: 0.5rem 0 0.5rem;
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
  margin: 0.5rem 0;
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
