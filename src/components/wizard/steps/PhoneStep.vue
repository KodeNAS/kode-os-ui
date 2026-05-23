<template>
  <div class="phone-step">
    <p class="step-intro">
      {{ $t('Install Immich on your phone to back up photos and videos automatically. We\'ll set the server address with a QR — no typing.') }}
    </p>

    <div class="phone-stores">
      <a
        class="store-button"
        href="https://apps.apple.com/app/immich/id1613945652"
        target="_blank"
        rel="noopener noreferrer"
      >
        <b-icon icon="ios" pack="casa" size="is-medium" />
        <span>{{ $t('App Store') }}</span>
      </a>
      <a
        class="store-button"
        href="https://play.google.com/store/apps/details?id=app.alextran.immich"
        target="_blank"
        rel="noopener noreferrer"
      >
        <b-icon icon="android" pack="casa" size="is-medium" />
        <span>{{ $t('Google Play') }}</span>
      </a>
    </div>

    <div class="phone-qr-row">
      <div class="phone-qr">
        <QrcodeVue
          :value="immichUrl"
          :size="200"
          level="M"
          background="#ffffff"
          foreground="#000000"
        />
      </div>
      <div class="phone-qr-help">
        <p class="phone-qr-title">{{ $t('Then point Immich at your pebble') }}</p>
        <ol class="phone-qr-steps">
          <li>{{ $t('Open Immich on your phone.') }}</li>
          <li>{{ $t('Choose "Sign in" and scan this code, or type the address below.') }}</li>
          <li>{{ $t('Sign in with your KODE account.') }}</li>
          <li>{{ $t('Open the side menu → Backup → toggle on Foreground + Background backup.') }}</li>
        </ol>
        <div class="phone-server-row">
          <code class="phone-server">{{ immichUrl }}</code>
          <b-button
            size="is-small"
            type="is-dark"
            rounded
            icon-pack="casa"
            icon-left="copy-outline"
            @click="copy(immichUrl)"
          >
            {{ copied ? $t('Copied') : $t('Copy') }}
          </b-button>
        </div>
      </div>
    </div>

    <!-- iOS-specific gotcha: by default iOS pauses background uploads
         when the app isn't open. The user has to enable Background App
         Refresh in iOS Settings for it to keep syncing while they sleep. -->
    <div class="phone-callout">
      <b-icon icon="information-outline" pack="casa" size="is-small" />
      <span>
        <strong>{{ $t('On iPhone:') }}</strong>
        {{ $t('also turn on Background App Refresh for Immich in iOS Settings, otherwise uploads pause when the app is closed.') }}
      </span>
    </div>

    <!-- "While you're here" — point to companion apps the user might
         also want, without making this step about each of them. -->
    <details class="phone-more">
      <summary>{{ $t('Got Jellyfin or Home Assistant too? Other phone apps') }}</summary>
      <ul class="phone-more-list">
        <li>
          <strong>Jellyfin Mobile</strong>
          <span>{{ $t('— for streaming your media library from your pebble') }}</span>
        </li>
        <li>
          <strong>{{ $t('Home Assistant Companion') }}</strong>
          <span>{{ $t('— if you set up smart-home control') }}</span>
        </li>
      </ul>
      <p class="phone-more-hint">{{ $t('Each has its own walkthrough in Settings → Re-run setup.') }}</p>
    </details>
  </div>
</template>

<script>
import QrcodeVue from 'qrcode.vue'
import copy from 'clipboard-copy'
import { resolveAppUrl } from '@/service/kodeApps'

const IMMICH_FALLBACK_PORT = 2283

export default {
  name: 'PhoneStep',
  components: { QrcodeVue },
  props: {
    host: { type: String, required: true },
  },
  data() {
    return {
      copied: false,
      immichUrl: `http://${this.host}:${IMMICH_FALLBACK_PORT}`,
    }
  },
  async created() {
    const live = await resolveAppUrl('immich', this.host)
    if (live) this.immichUrl = live
  },
  methods: {
    async copy(text) {
      try {
        await copy(text)
        this.copied = true
        setTimeout(() => (this.copied = false), 1500)
      } catch (e) {
        this.copied = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.step-intro {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 1rem;
}

.phone-stores {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.store-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  background: rgba(31, 41, 55, 0.92);
  color: #fff;
  border-radius: 10px;
  font-size: 0.875rem;
  text-decoration: none;

  &:hover {
    background: rgba(31, 41, 55, 1);
    color: #fff;
  }
}

.phone-qr-row {
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

.phone-qr {
  padding: 14px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.phone-qr-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.phone-qr-steps {
  margin: 0 0 0.75rem 1.1rem;
  padding: 0;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.55;
}

.phone-server-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.phone-server {
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

.phone-callout {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(45, 95, 78, 0.08);
  border-radius: 10px;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.78);
  margin-top: 1rem;
}

.phone-more {
  margin-top: 0.85rem;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.65);

  summary {
    cursor: pointer;
    user-select: none;
    padding: 0.4rem 0;
  }
}

.phone-more-list {
  list-style: none;
  margin: 0.4rem 0 0.5rem 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  li {
    padding: 0.35rem 0.6rem;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 8px;

    strong { color: #1f2937; }
  }
}

.phone-more-hint {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
}
</style>
