<template>
  <div class="walkthrough">
    <div class="wt-header">
      <span class="wt-icon is-jellyfin">
        <b-icon icon="media-outline" pack="casa" size="is-medium" />
      </span>
      <div>
        <h3 class="wt-title">Jellyfin</h3>
        <p class="wt-subtitle">{{ subTitle }}</p>
      </div>
      <div class="wt-substep">{{ sub + 1 }} / {{ total }}</div>
    </div>

    <!-- Sub 0: open Jellyfin & finish account setup -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('Jellyfin streams the movies, shows, and music stored on your pebble to any TV, phone, or browser — no subscription, no ads.') }}</p>
      <p>{{ $t('Open it in your browser and finish the built-in setup wizard (admin account, language, etc.):') }}</p>
      <div class="server-row">
        <code class="server">{{ url }}</code>
        <b-button size="is-small" type="is-dark" rounded icon-pack="casa" icon-left="copy-outline" @click="copy(url)">
          {{ copied ? $t('Copied') : $t('Copy') }}
        </b-button>
      </div>
      <b-button rounded type="is-light" tag="a" :href="url" target="_blank" rel="noopener noreferrer">
        {{ $t('Open Jellyfin') }}
      </b-button>
      <p class="hint">{{ $t('Use the same email + password as your KODE account so you don\'t have to remember a second one.') }}</p>
    </section>

    <!-- Sub 1: add libraries -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('In Jellyfin\'s setup wizard, add libraries pointing at your pebble\'s media folders:') }}</p>
      <ul class="folder-list">
        <li>
          <strong>{{ $t('Movies:') }}</strong> <code>/DATA/Videos/Movies</code>
          <span class="folder-note">{{ $t('Type: Movies') }}</span>
        </li>
        <li>
          <strong>{{ $t('TV shows:') }}</strong> <code>/DATA/Videos/TV</code>
          <span class="folder-note">{{ $t('Type: Shows') }}</span>
        </li>
        <li>
          <strong>{{ $t('Music:') }}</strong> <code>/DATA/Music</code>
          <span class="folder-note">{{ $t('Type: Music') }}</span>
        </li>
      </ul>
      <p>{{ $t('Drop files into those folders — via File Browser, Samba on your computer, or directly through Jellyfin — and they\'ll show up in the app.') }}</p>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Naming matters for metadata. Use "Movie Title (Year).mp4" for movies and "Show/Season 01/Show - S01E01.mp4" for TV. Jellyfin auto-fetches posters and descriptions from TheMovieDB.') }}</span>
      </div>
    </section>

    <!-- Sub 2: install on phone + TV -->
    <section v-else-if="sub === 2" class="wt-body">
      <p>{{ $t('Watch on every screen. Install the Jellyfin app on each device, then point it at your pebble.') }}</p>

      <div class="store-row">
        <a class="store-button" href="https://apps.apple.com/app/jellyfin-mobile/id1480192618" target="_blank" rel="noopener noreferrer">
          <b-icon icon="ios" pack="casa" size="is-medium" />
          <span>{{ $t('App Store') }}</span>
        </a>
        <a class="store-button" href="https://play.google.com/store/apps/details?id=org.jellyfin.mobile" target="_blank" rel="noopener noreferrer">
          <b-icon icon="android" pack="casa" size="is-medium" />
          <span>{{ $t('Google Play') }}</span>
        </a>
      </div>
      <p class="hint">{{ $t('TVs: search "Jellyfin" in your TV\'s app store — Roku, Fire TV, Android TV, LG, Samsung, and Apple TV all have a native app.') }}</p>

      <p class="server-label">{{ $t('When the app asks for a server, scan or paste:') }}</p>
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
          <p class="hint">{{ $t('Sign in with the Jellyfin admin account you created in step 1.') }}</p>
        </div>
      </div>
    </section>

    <!-- Sub 3: power-user tips (NEW) -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('A few settings worth flipping on once Jellyfin is up:') }}</p>
      <ol class="steps">
        <li>
          <strong>{{ $t('Hardware transcoding.') }}</strong>
          {{ $t('Dashboard → Playback → Hardware acceleration → set to "Video Acceleration API (VAAPI)". Your Pi 5 can transcode without breaking a sweat — this is what lets multiple people stream at once.') }}
        </li>
        <li>
          <strong>{{ $t('Subtitle providers.') }}</strong>
          {{ $t('Dashboard → Plugins → Catalog → install OpenSubtitles. Then Profile → Settings → Subtitles to set your preferred language.') }}
        </li>
        <li>
          <strong>{{ $t('Family accounts.') }}</strong>
          {{ $t('Dashboard → Users → +. Each person can have their own watched-list and continue-watching row.') }}
        </li>
      </ol>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Pro tip: enable "Resume from where I left off" in each user\'s profile so picking up on the TV after pausing on the phone just works.') }}</span>
      </div>
    </section>

    <!-- Sub 4: you're ready (existing tips trimmed) -->
    <section v-else-if="sub === 4" class="wt-body">
      <p>{{ $t('That\'s it — hit play and enjoy.') }}</p>
      <ul class="tips">
        <li>{{ $t('Jellyfin scans for new files every few minutes; you don\'t have to restart anything.') }}</li>
        <li>{{ $t('Cast from your phone to a Chromecast or Apple TV right from the player.') }}</li>
        <li>{{ $t('Once everything is wired up, your pebble\'s OLED will show "Now playing" whenever someone is streaming.') }}</li>
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

const FALLBACK_PORT = 8096
const SUB_TITLES = [
  'Open Jellyfin',
  'Add your media',
  'Install on your devices',
  'Power-user settings',
  'You\'re ready to stream',
]

export default {
  name: 'JellyfinWalkthrough',
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
    const live = await resolveAppUrl('jellyfin', this.host)
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
.wt-icon.is-jellyfin { background: linear-gradient(135deg, #5e6ad2, #7c8af0); }

.server-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
  margin: 0.75rem 0 0.4rem;
}

.folder-note {
  margin-left: 0.4rem;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.5);
  font-style: italic;
}
</style>
