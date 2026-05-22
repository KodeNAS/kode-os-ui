<template>
  <div class="phone-step">
    <p class="step-intro">
      {{ $t('Install Immich on your phone to back up photos and videos automatically.') }}
    </p>

    <div class="phone-stores">
      <a
        class="store-button"
        href="https://apps.apple.com/app/immich/id1613945652"
        target="_blank"
        rel="noopener noreferrer"
      >
        <b-icon icon="apple-outline" pack="casa" size="is-medium" />
        <span>{{ $t('App Store') }}</span>
      </a>
      <a
        class="store-button"
        href="https://play.google.com/store/apps/details?id=app.alextran.immich"
        target="_blank"
        rel="noopener noreferrer"
      >
        <b-icon icon="android-outline" pack="casa" size="is-medium" />
        <span>{{ $t('Google Play') }}</span>
      </a>
    </div>

    <div class="phone-qr-row">
      <div class="phone-qr">
        <QrcodeVue
          :value="immichUrl"
          :size="180"
          level="M"
          background="#ffffff"
          foreground="#2d5f4e"
        />
      </div>
      <div class="phone-qr-help">
        <p class="phone-qr-title">{{ $t('Then point Immich at your pebble') }}</p>
        <ol class="phone-qr-steps">
          <li>{{ $t('Open Immich on your phone.') }}</li>
          <li>{{ $t('Choose "Sign in" and scan this code, or type the address below.') }}</li>
          <li>{{ $t('Sign in with your KODE account.') }}</li>
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
  </div>
</template>

<script>
import QrcodeVue from 'qrcode.vue'
import copy from 'clipboard-copy'

const IMMICH_PORT = 2283

export default {
  name: 'PhoneStep',
  components: { QrcodeVue },
  props: {
    host: { type: String, required: true },
  },
  data() {
    return {
      copied: false,
    }
  },
  computed: {
    immichUrl() {
      return `http://${this.host}:${IMMICH_PORT}`
    },
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
  grid-template-columns: 180px 1fr;
  gap: 1.25rem;
  align-items: start;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
}

.phone-qr {
  padding: 10px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  display: inline-flex;
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
  padding: 0.45rem 0.7rem;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
