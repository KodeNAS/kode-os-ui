<template>
  <div class="walkthrough">
    <div class="wt-header">
      <span class="wt-icon is-filebrowser">
        <b-icon icon="folder" pack="casa" size="is-medium" />
      </span>
      <div>
        <h3 class="wt-title">{{ $t('File Browser') }}</h3>
        <p class="wt-subtitle">{{ subTitle }}</p>
      </div>
      <div class="wt-substep">{{ sub + 1 }} / {{ total }}</div>
    </div>

    <!-- Sub 0: what it is -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('File Browser lets you manage your pebble\'s files from any web browser — upload, download, share, rename, organize.') }}</p>
      <p>{{ $t('Everything lives under') }} <code>/DATA</code> {{ $t(', already split into folders for you:') }}</p>
      <ul class="folder-list">
        <li v-for="folder in folders" :key="folder.name">
          <b-icon icon="folder-outline" pack="casa" size="is-small" />
          <strong>{{ folder.name }}</strong> — {{ folder.purpose }}
        </li>
      </ul>
    </section>

    <!-- Sub 1: upload -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('You can add files in three ways:') }}</p>
      <ol class="steps">
        <li><strong>{{ $t('In your browser') }}</strong> — {{ $t('drag files onto File Browser to upload.') }}</li>
        <li><strong>{{ $t('From your computer') }}</strong> — {{ $t('connect via Samba (covered in the Add-a-device wizard) and drag files into your pebble\'s folder.') }}</li>
        <li><strong>{{ $t('From your phone') }}</strong> — {{ $t('the Immich app handles photos & videos automatically. Other files: open File Browser in mobile Safari/Chrome and upload from there.') }}</li>
      </ol>
    </section>

    <!-- Sub 2: share a link -->
    <section v-else-if="sub === 2" class="wt-body">
      <p>{{ $t('Share a file or folder with someone outside your home:') }}</p>
      <ol class="steps">
        <li>{{ $t('Right-click the item in File Browser.') }}</li>
        <li>{{ $t('Choose Share.') }}</li>
        <li>{{ $t('Copy the link and send it however you like (text, email, etc).') }}</li>
      </ol>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Shared links live on your pebble — they don\'t go through anyone else\'s cloud. The link only works while your pebble is on and reachable.') }}</span>
      </div>
    </section>

    <!-- Sub 3: on phone -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('File Browser also works on your phone\'s web browser — the layout adapts automatically.') }}</p>
      <ul class="tips">
        <li>{{ $t('On iPhone: open this in Safari, tap Share, then Add to Home Screen for an app-like icon.') }}</li>
        <li>{{ $t('On Android: in Chrome\'s menu, tap "Install app" for the same effect.') }}</li>
        <li>{{ $t('Bookmark the address so you can get back fast:') }} <code>{{ pebbleUrl }}</code></li>
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
const SUB_TITLES = ['What\'s in /DATA', 'Upload files', 'Share a link', 'Use it on your phone']

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
      folders: [
        { name: 'Photos',    purpose: this.$t('phone photo backups (Immich uses this)') },
        { name: 'Videos',    purpose: this.$t('movies & shows (Jellyfin reads this)') },
        { name: 'Documents', purpose: this.$t('PDFs, scans, paperwork') },
        { name: 'Music',     purpose: this.$t('audio library (Jellyfin reads this)') },
        { name: 'Backups',   purpose: this.$t('Time Machine / system snapshots') },
        { name: 'Downloads', purpose: this.$t('a junk drawer for everything else') },
      ],
    }
  },
  computed: {
    subTitle() { return this.$t(SUB_TITLES[this.sub]) },
    isFinal() { return this.sub === this.total - 1 },
    pebbleUrl() { return `http://${this.host}` },
  },
  methods: {
    advance() {
      if (this.sub < this.total - 1) this.sub += 1
      else this.$emit('done')
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
</style>
