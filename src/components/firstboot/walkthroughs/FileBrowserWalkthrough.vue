<template>
  <div class="walkthrough">
    <div class="wt-header">
      <span class="wt-icon is-filebrowser">
        <b-icon icon="folder-outline" pack="casa" size="is-medium" />
      </span>
      <div>
        <h3 class="wt-title">{{ $t('File Browser') }}</h3>
        <p class="wt-subtitle">{{ subTitle }}</p>
      </div>
      <div class="wt-substep">{{ sub + 1 }} / {{ total }}</div>
    </div>

    <!-- Sub 0: open File Browser at its IP. -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('File Browser lets you manage your pebble\'s files from any web browser — upload, download, share, rename, organize.') }}</p>
      <div class="setup-cta">
        <a class="setup-cta-btn" :href="fbUrl" target="_blank" rel="noopener noreferrer">
          <b-icon icon="internet-outline" pack="casa" size="is-medium" />
          <span>{{ $t('Open File Browser') }}</span>
        </a>
        <p class="setup-cta-hint">{{ $t('Opens in a new tab.') }} <code>{{ fbUrl }}</code></p>
      </div>
      <p class="next-prompt">{{ $t('Once you\'re on the File Browser page, tap Next for the steps.') }}</p>
    </section>

    <!-- Sub 1: in-app steps — what's in /DATA, how to upload. -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('Sign in with your KODE account. You\'re now looking at') }} <code>/DATA</code> {{ $t(' — already organised into folders for you:') }}</p>
      <ul class="folder-list">
        <li v-for="folder in folders" :key="folder.name">
          <b-icon icon="folder-outline" pack="casa" size="is-small" />
          <strong>{{ folder.name }}</strong> — {{ folder.purpose }}
        </li>
      </ul>
      <p>{{ $t('Drag any file from your computer onto the File Browser page to upload it. Right-click any item for Rename, Share, Download, or Delete.') }}</p>
    </section>

    <!-- Sub 2: connect your computer + phone (Samba etc.) -->
    <section v-else-if="sub === 2" class="wt-body">
      <p>{{ $t('Drag-and-drop in the browser works, but for whole folders it\'s nicer to connect your pebble like an external drive.') }}</p>

      <div class="device-block">
        <div class="device-block-head">
          <b-icon icon="computer-outline" pack="casa" size="is-small" />
          <strong>{{ $t('Computer (Mac, Windows, Linux)') }}</strong>
        </div>
        <ol class="steps">
          <li>{{ $t('Mac: Finder → ⌘K → enter') }} <code>smb://{{ host }}</code> {{ $t('→ Connect.') }}</li>
          <li>{{ $t('Windows: File Explorer → address bar → enter') }} <code>\\{{ host }}</code> {{ $t('→ Enter.') }}</li>
          <li>{{ $t('Linux: Files app → Other Locations → enter') }} <code>smb://{{ host }}</code></li>
          <li>{{ $t('Sign in with your KODE username + password. The pebble\'s folders open like any other drive.') }}</li>
        </ol>
      </div>

      <div class="device-block">
        <div class="device-block-head">
          <b-icon icon="phone-outline" pack="casa" size="is-small" />
          <strong>{{ $t('Phone or tablet') }}</strong>
        </div>
        <ol class="steps">
          <li>{{ $t('For photos & videos: the Immich app handles backup automatically (covered in the Immich guide).') }}</li>
          <li>{{ $t('For other files: open File Browser in mobile Safari or Chrome — the layout adapts.') }}</li>
          <li>{{ $t('iOS: tap Share → Add to Home Screen for an app-like icon. Android: Chrome menu → Install app.') }}</li>
        </ol>
      </div>

      <p>
        <button type="button" class="wizard-link" @click="openAddDeviceWizard">
          {{ $t('Or run the step-by-step Add a device wizard') }}
        </button>
      </p>
    </section>

    <!-- Sub 3: extra settings (sharing links + bookmarks). -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('A few settings worth knowing about:') }}</p>
      <ol class="steps">
        <li>
          <strong>{{ $t('Share a link.') }}</strong>
          {{ $t('Right-click any file or folder → Share → copy the link. Send it however you like (text, email, etc).') }}
        </li>
        <li>
          <strong>{{ $t('Set a share expiry.') }}</strong>
          {{ $t('In the Share dialog you can set a password and an expiration time so the link self-destructs.') }}
        </li>
        <li>
          <strong>{{ $t('Bookmark on phone.') }}</strong>
          {{ $t('Bookmark') }} <code>{{ fbUrl }}</code> {{ $t('on your phone so you can get back fast.') }}
        </li>
      </ol>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Shared links live on your pebble — they don\'t go through anyone else\'s cloud. The link only works while your pebble is on and reachable.') }}</span>
      </div>
    </section>

    <!-- Sub 4: all done. -->
    <section v-else-if="sub === 4" class="wt-body">
      <p>{{ $t('That\'s File Browser. Everything you put under') }} <code>/DATA</code> {{ $t(' is yours, and only yours.') }}</p>
      <ul class="tips">
        <li>{{ $t('Movies + shows go in /DATA/Movies and /DATA/Shows so Jellyfin picks them up automatically.') }}</li>
        <li>{{ $t('Use /DATA/Backups for Time Machine or scheduled snapshots from your computer.') }}</li>
        <li>{{ $t('/DATA/Downloads is a junk drawer — fine to leave random stuff here.') }}</li>
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
import { resolveAppUrl } from '@/service/kodeApps'
import AddDeviceWizard from '@/components/wizard/AddDeviceWizard.vue'

const FALLBACK_PORT = 80
const SUB_TITLES = [
  'Open File Browser',
  'What\'s in /DATA',
  'Connect a computer or phone',
  'Extra settings',
  'You\'re ready to drop files',
]

export default {
  name: 'FileBrowserWalkthrough',
  props: {
    host: { type: String, required: true },
    isLast: { type: Boolean, default: false },
  },
  data() {
    return {
      sub: 0,
      total: SUB_TITLES.length,
      fbUrl: `http://${this.host}:${FALLBACK_PORT}`,
      folders: [
        { name: 'Photos',    purpose: this.$t('phone photo backups (Immich uses this)') },
        { name: 'Movies',    purpose: this.$t('movies (Jellyfin reads this)') },
        { name: 'Shows',     purpose: this.$t('TV shows (Jellyfin reads this)') },
        { name: 'Music',     purpose: this.$t('audio library (Jellyfin reads this)') },
        { name: 'Documents', purpose: this.$t('PDFs, scans, paperwork') },
        { name: 'Backups',   purpose: this.$t('Time Machine / system snapshots') },
        { name: 'Downloads', purpose: this.$t('a junk drawer for everything else') },
      ],
    }
  },
  async created() {
    const live = await resolveAppUrl('filebrowser', this.host)
    if (live) this.fbUrl = live
  },
  computed: {
    subTitle() { return this.$t(SUB_TITLES[this.sub]) },
    isFinal() { return this.sub === this.total - 1 },
  },
  methods: {
    advance() {
      if (this.sub < this.total - 1) this.sub += 1
      else this.$emit('done')
    },
    openAddDeviceWizard() {
      this.$buefy.modal.open({
        parent: this,
        component: AddDeviceWizard,
        hasModalCard: true,
        trapFocus: true,
        animation: 'zoom-in',
      })
    },
  },
}
</script>

<style lang="scss" scoped>
@import './_walkthrough.scss';
.wt-icon.is-filebrowser { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }

.folder-list {
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.device-block {
  background: rgba(45, 95, 78, 0.06);
  border: 1px solid rgba(45, 95, 78, 0.12);
  border-radius: 12px;
  padding: 0.75rem 0.85rem;
  margin-bottom: 0.85rem;
}

.device-block-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
  color: #1f2937;
  font-size: 0.9375rem;
}

.wizard-link {
  background: none;
  border: none;
  padding: 0;
  color: #2d5f4e;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
  font-family: inherit;

  &:hover { color: #1f4438; }
}
</style>
