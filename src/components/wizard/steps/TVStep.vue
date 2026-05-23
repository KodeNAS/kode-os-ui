<template>
  <div class="tv-step">
    <p class="step-intro">
      {{ $t('Stream movies, shows, and music from your pebble to your Smart TV with Jellyfin.') }}
    </p>

    <ol class="instructions">
      <li>
        {{ $t('On your TV, open the app store (LG, Samsung, Roku, Fire TV, Android TV, Apple TV all have one).') }}
      </li>
      <li>
        {{ $t('Search for') }} <strong>Jellyfin</strong> {{ $t('and install it.') }}
      </li>
      <li>
        {{ $t('Open the app. When it asks for a server, enter the address below.') }}
      </li>
    </ol>

    <!-- QR + URL — phones nearby can scan the code and use the URL
         however they need (e.g. type it into a TV with a tiny remote
         keyboard via the phone's keyboard / Voice Match feature). -->
    <div class="tv-server-row">
      <div class="tv-qr">
        <QrcodeVue
          :value="jellyfinUrl"
          :size="160"
          level="M"
          background="#ffffff"
          foreground="#000000"
        />
      </div>
      <div class="tv-server-side">
        <div class="server-row">
          <code class="server">{{ jellyfinUrl }}</code>
          <b-button
            size="is-small"
            type="is-dark"
            rounded
            icon-pack="casa"
            icon-left="copy-outline"
            @click="copyServer"
          >
            {{ copied ? $t('Copied') : $t('Copy') }}
          </b-button>
        </div>
        <p class="qr-hint">
          {{ $t('Scan the QR with a phone if you need to send the URL somewhere (text/email/Notes).') }}
        </p>
      </div>
    </div>

    <ol class="instructions" start="4">
      <li>{{ $t('Sign in with your KODE account.') }}</li>
      <li>{{ $t('Pick a library (Movies / Shows / Music) and hit play.') }}</li>
    </ol>

    <!-- Brand-specific quirks — most TV "doesn't have Jellyfin" cases
         are actually old firmware or a regional store. -->
    <details class="tv-brands">
      <summary>{{ $t('No Jellyfin in your TV\'s store?') }}</summary>
      <ul class="brand-list">
        <li>
          <strong>{{ $t('Samsung (Tizen):') }}</strong>
          {{ $t('Native Jellyfin app exists for 2018+ models. Older sets: use the TV\'s built-in browser and open the URL above.') }}
        </li>
        <li>
          <strong>{{ $t('LG (webOS):') }}</strong>
          {{ $t('Search the LG Content Store. If missing, open the URL above in the LG Browser app.') }}
        </li>
        <li>
          <strong>{{ $t('Roku:') }}</strong>
          {{ $t('"Jellyfin" channel is in the official Roku store.') }}
        </li>
        <li>
          <strong>{{ $t('Fire TV / Android TV:') }}</strong>
          {{ $t('Native Google Play / Amazon Appstore listings. Sideload the APK if your region\'s store hides it.') }}
        </li>
        <li>
          <strong>{{ $t('Apple TV (tvOS):') }}</strong>
          {{ $t('Native Jellyfin app in the App Store.') }}
        </li>
      </ul>
    </details>

    <!-- Last-resort fallback for any TV with a working web browser. -->
    <div class="tv-fallback">
      <b-icon icon="information-outline" pack="casa" size="is-small" />
      <span>
        {{ $t('Last resort — almost every modern TV has a web browser.') }}
        <a :href="jellyfinUrl" target="_blank" rel="noopener noreferrer">{{ jellyfinUrl }}</a>
        {{ $t('works there too, though the app is much nicer.') }}
      </span>
    </div>
  </div>
</template>

<script>
import QrcodeVue from 'qrcode.vue'
import copy from 'clipboard-copy'
import { resolveAppUrl } from '@/service/kodeApps'

const JELLYFIN_FALLBACK_PORT = 8096

export default {
  name: 'TVStep',
  components: { QrcodeVue },
  props: {
    host: { type: String, required: true },
  },
  data() {
    return {
      copied: false,
      jellyfinUrl: `http://${this.host}:${JELLYFIN_FALLBACK_PORT}`,
    }
  },
  async created() {
    const live = await resolveAppUrl('jellyfin', this.host)
    if (live) this.jellyfinUrl = live
  },
  methods: {
    async copyServer() {
      try {
        await copy(this.jellyfinUrl)
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
  margin-bottom: 0.85rem;
}

.instructions {
  margin: 0 0 0.85rem 1.1rem;
  padding: 0;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.78);
  line-height: 1.6;
}

.tv-server-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 1rem;
  align-items: start;
  margin: 0.4rem 0 0.85rem;

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
}

.tv-qr {
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  display: inline-flex;
}

.tv-server-side { min-width: 0; }

.server-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.server {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.qr-hint {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.45;
}

.tv-brands {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.65);
  background: rgba(0, 0, 0, 0.03);
  border-radius: 10px;
  padding: 0.3rem 0.7rem;
  margin: 0.4rem 0 0.85rem;

  summary {
    cursor: pointer;
    user-select: none;
    padding: 0.4rem 0;
    color: rgba(0, 0, 0, 0.78);
  }
}

.brand-list {
  list-style: none;
  margin: 0.3rem 0 0.4rem 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  li {
    line-height: 1.5;
    color: rgba(0, 0, 0, 0.72);

    strong { color: #1f2937; }
  }
}

.tv-fallback {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(45, 95, 78, 0.08);
  border-radius: 10px;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.78);

  a {
    color: #2d5f4e;
    text-decoration: underline;
  }
}
</style>
