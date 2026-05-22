<template>
  <div class="walkthrough">
    <div class="wt-header">
      <span class="wt-icon is-jellyfin">
        <b-icon icon="video" pack="casa" size="is-medium" />
      </span>
      <div>
        <h3 class="wt-title">Jellyfin</h3>
        <p class="wt-subtitle">{{ subTitle }}</p>
      </div>
      <div class="wt-substep">{{ sub + 1 }} / {{ total }}</div>
    </div>

    <!-- Sub 0: what it is + open admin -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('Jellyfin streams the movies, shows, and music stored on your pebble to any TV, phone, or browser — no subscription.') }}</p>
      <p>{{ $t('First, finish account setup in the Jellyfin web app:') }}</p>
      <div class="server-row">
        <code class="server">{{ url }}</code>
        <b-button size="is-small" type="is-dark" rounded icon-pack="casa" icon-left="copy-outline" @click="copy(url)">
          {{ copied ? $t('Copied') : $t('Copy') }}
        </b-button>
      </div>
      <b-button rounded type="is-light" tag="a" :href="url" target="_blank" rel="noopener noreferrer">
        {{ $t('Open Jellyfin') }}
      </b-button>
    </section>

    <!-- Sub 1: point libraries at /DATA -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('In the Jellyfin setup wizard, add libraries pointing at your pebble\'s media folders:') }}</p>
      <ul class="folder-list">
        <li><strong>{{ $t('Movies & shows:') }}</strong> <code>/DATA/Videos</code></li>
        <li><strong>{{ $t('Music:') }}</strong> <code>/DATA/Music</code></li>
      </ul>
      <p>{{ $t('Drop files into those folders (via File Browser, Samba on your computer, or directly through Jellyfin) and they\'ll show up in the app.') }}</p>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Jellyfin scans for new files every few minutes — you don\'t have to restart anything.') }}</span>
      </div>
    </section>

    <!-- Sub 2: install on TV -->
    <section v-else-if="sub === 2" class="wt-body">
      <p>{{ $t('Stream to your TV by installing the Jellyfin app from your TV\'s app store (Roku, Fire TV, LG, Samsung, Android TV, Apple TV all have it).') }}</p>
      <p>{{ $t('When the app asks for a server, enter:') }}</p>
      <div class="server-row">
        <code class="server">{{ url }}</code>
        <b-button size="is-small" type="is-dark" rounded icon-pack="casa" icon-left="copy-outline" @click="copy(url)">
          {{ copied ? $t('Copied') : $t('Copy') }}
        </b-button>
      </div>
      <p class="hint">{{ $t('No Jellyfin in your TV\'s store? Open the URL above in your TV\'s web browser instead.') }}</p>
    </section>

    <!-- Sub 3: now playing tip -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('That\'s it — hit play and enjoy.') }}</p>
      <ul class="tips">
        <li>{{ $t('You can sign in with the same KODE account on every device.') }}</li>
        <li>{{ $t('Use Family in the Easy dashboard to add accounts for kids and partners.') }}</li>
        <li>{{ $t('Once it\'s up, your pebble\'s OLED will show "Now playing" when anyone is streaming.') }}</li>
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

const PORT = 8096
const SUB_TITLES = ['Open Jellyfin', 'Add your media', 'Install on your TV', 'You\'re ready to stream']

export default {
  name: 'JellyfinWalkthrough',
  props: {
    host: { type: String, required: true },
    isLast: { type: Boolean, default: false },
  },
  data() { return { sub: 0, copied: false, total: SUB_TITLES.length } },
  computed: {
    subTitle() { return this.$t(SUB_TITLES[this.sub]) },
    isFinal() { return this.sub === this.total - 1 },
    url() { return `http://${this.host}:${PORT}` },
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
.wt-icon.is-jellyfin { background: linear-gradient(135deg, #5e6ad2, #7c8af0); }
</style>
