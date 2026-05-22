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
        {{ $t('Open the app. When it asks for a server, enter:') }}
      </li>
    </ol>

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

    <ol class="instructions" start="4">
      <li>{{ $t('Sign in with your KODE account.') }}</li>
    </ol>

    <div class="tv-fallback">
      <b-icon icon="information-outline" pack="casa" size="is-small" />
      <span>
        {{ $t('No Jellyfin in your TV\'s store? You can also open') }}
        <a :href="jellyfinUrl" target="_blank" rel="noopener noreferrer">{{ jellyfinUrl }}</a>
        {{ $t('in your TV\'s web browser.') }}
      </span>
    </div>
  </div>
</template>

<script>
import copy from 'clipboard-copy'
import { resolveAppUrl } from '@/service/kodeApps'

const JELLYFIN_FALLBACK_PORT = 8096

export default {
  name: 'TVStep',
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

.server-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0 1rem;
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
