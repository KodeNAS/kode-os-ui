<template>
  <div class="modal-card potd-settings-modal">
    <header class="modal-card-head">
      <h3 class="title is-header">{{ $t('Photo of the day settings') }}</h3>
      <b-icon class="close-button" icon="close-outline" pack="casa" @click.native="$emit('close')" />
    </header>

    <section class="modal-card-body">
      <p class="setting-help">
        {{ $t('Pulls photos from your Immich library. Generate an API key in Immich at Account Settings → API Keys.') }}
      </p>

      <div class="setting-row stacked">
        <label class="setting-label">{{ $t('Immich URL') }}</label>
        <b-input
          v-model="settings.immichUrl"
          :placeholder="$t('http://kode.local:2283')"
          maxlength="200"
          @input="resetAlbumState"
        />
      </div>

      <div class="setting-row stacked">
        <label class="setting-label">{{ $t('API key') }}</label>
        <b-input
          v-model="settings.apiKey"
          type="password"
          password-reveal
          :placeholder="$t('Paste your Immich API key')"
          @input="resetAlbumState"
        />
        <div class="setting-hint">
          {{ $t('Stored locally in this browser. Never sent anywhere except your Immich URL above.') }}
        </div>
      </div>

      <div class="setting-row stacked">
        <label class="setting-label">{{ $t('Source') }}</label>
        <div class="setting-options">
          <button
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.source === 'memory' }"
            @click="settings.source = 'memory'"
          >
            {{ $t('Memories') }}
          </button>
          <button
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.source === 'random' }"
            @click="settings.source = 'random'"
          >
            {{ $t('Random') }}
          </button>
          <button
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.source === 'album' }"
            @click="settings.source = 'album'"
          >
            {{ $t('From an album') }}
          </button>
        </div>
        <div class="setting-hint">
          <span v-if="settings.source === 'memory'">
            {{ $t('Pick from "this day in previous years". Falls back to random when there are no memories today.') }}
          </span>
          <span v-else-if="settings.source === 'random'">
            {{ $t('A random photo from your whole library.') }}
          </span>
          <span v-else>
            {{ $t('A random photo from a chosen album.') }}
          </span>
        </div>
      </div>

      <div v-if="settings.source === 'album'" class="setting-row stacked">
        <label class="setting-label">{{ $t('Album') }}</label>
        <div class="album-row">
          <b-select v-model="settings.albumId" expanded :disabled="albumsLoading || !canFetchAlbums">
            <option value="">{{ albumsLoaded ? $t('Pick an album') : $t('Click refresh to load albums') }}</option>
            <option v-for="a in albums" :key="a.id" :value="a.id">{{ a.albumName }}</option>
          </b-select>
          <b-button
            rounded
            size="is-small"
            icon-pack="casa"
            icon-left="restart-outline"
            :loading="albumsLoading"
            :disabled="!canFetchAlbums"
            @click="loadAlbums"
          >
            {{ $t('Refresh') }}
          </b-button>
        </div>
        <div v-if="albumsError" class="setting-hint is-error">{{ albumsError }}</div>
      </div>

      <div class="setting-row">
        <label class="setting-label">{{ $t('Refresh every') }}</label>
        <div class="setting-options">
          <button
            v-for="opt in refreshOptions"
            :key="opt.hours"
            type="button"
            class="option-chip"
            :class="{ 'is-active': settings.refreshHours === opt.hours }"
            @click="settings.refreshHours = opt.hours"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <div class="setting-row">
        <b-button
          rounded
          size="is-small"
          icon-pack="casa"
          icon-left="show-search-outline"
          :loading="testing"
          :disabled="!canFetchAlbums"
          @click="testConnection"
        >
          {{ $t('Test connection') }}
        </b-button>
        <span v-if="testNote" class="locate-note" :class="{ 'is-error': testFailed }">{{ testNote }}</span>
      </div>
    </section>

    <footer class="modal-card-foot">
      <div class="is-flex-grow-1"></div>
      <b-button rounded @click="$emit('close')">{{ $t('Cancel') }}</b-button>
      <b-button rounded type="is-primary" @click="onSave">{{ $t('Save') }}</b-button>
    </footer>
  </div>
</template>

<script>
function cleanUrl(u) { return String(u || '').replace(/\/+$/, '') }

export default {
  name: 'PhotoOfTheDaySettingsModal',
  props: {
    value: { type: Object, required: true },
  },
  data() {
    return {
      settings: { ...this.value },
      albums: [],
      albumsLoaded: false,
      albumsLoading: false,
      albumsError: '',
      testing: false,
      testNote: '',
      testFailed: false,
      refreshOptions: [
        { hours: 12, label: this.$t('12h') },
        { hours: 24, label: this.$t('Daily') },
        { hours: 48, label: this.$t('48h') },
        { hours: 168, label: this.$t('Weekly') },
      ],
    }
  },
  computed: {
    canFetchAlbums() {
      return !!(this.settings.immichUrl && this.settings.apiKey)
    },
  },
  mounted() {
    // If the user already has albums-mode selected and credentials,
    // populate the dropdown immediately so they can confirm their pick.
    if (this.settings.source === 'album' && this.canFetchAlbums) this.loadAlbums()
  },
  methods: {
    resetAlbumState() {
      // URL or key changed — the album list is no longer valid.
      this.albums = []
      this.albumsLoaded = false
      this.albumsError = ''
      this.testNote = ''
    },
    async loadAlbums() {
      if (!this.canFetchAlbums) return
      this.albumsLoading = true
      this.albumsError = ''
      try {
        const url = `${cleanUrl(this.settings.immichUrl)}/api/albums`
        const res = await fetch(url, { headers: { 'x-api-key': this.settings.apiKey, Accept: 'application/json' } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        this.albums = Array.isArray(data) ? data : []
        this.albumsLoaded = true
      } catch (e) {
        this.albumsError = e && e.message
          ? `${this.$t('Couldn\'t fetch albums:')} ${e.message}`
          : this.$t('Couldn\'t fetch albums.')
      } finally {
        this.albumsLoading = false
      }
    },
    async testConnection() {
      if (!this.canFetchAlbums) return
      this.testing = true
      this.testNote = ''
      this.testFailed = false
      try {
        // /api/server/ping is unauthenticated but proves the URL resolves.
        // Then /api/users/me proves the API key is valid.
        const base = cleanUrl(this.settings.immichUrl)
        const ping = await fetch(`${base}/api/server/ping`)
        if (!ping.ok) throw new Error(`Ping HTTP ${ping.status}`)
        const me = await fetch(`${base}/api/users/me`, { headers: { 'x-api-key': this.settings.apiKey } })
        if (!me.ok) throw new Error(`Auth HTTP ${me.status}`)
        const data = await me.json()
        const who = data.name || data.email || this.$t('your account')
        this.testNote = `${this.$t('Connected as')} ${who}`
      } catch (e) {
        this.testFailed = true
        this.testNote = e && e.message ? e.message : this.$t('Connection failed.')
      } finally {
        this.testing = false
      }
    },
    onSave() {
      this.$emit('save', { ...this.settings })
      this.$emit('close')
    },
  },
}
</script>

<style lang="scss" scoped>
.potd-settings-modal { width: 520px; max-width: 95vw; }

.setting-help {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.65);
  padding-bottom: 0.5rem;
  line-height: 1.45;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child { border-bottom: none; }

  &.stacked {
    flex-direction: column;
    align-items: stretch;
  }
}

.setting-label {
  font-size: 0.9375rem;
  color: #1f2937;
  font-weight: 500;
}

.setting-hint {
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.45;

  &.is-error { color: #b04a4a; }
}

.locate-note {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  margin-left: 0.5rem;

  &.is-error { color: #b04a4a; }
}

.setting-options {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.album-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  ::v-deep .select { flex: 1; }
  ::v-deep .select select { width: 100%; }
}

.option-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1f2937;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover { background: rgba(45, 95, 78, 0.10); }

  &.is-active {
    background: #2d5f4e;
    color: #fff;
    border-color: #2d5f4e;
  }
}

.modal-card-foot { gap: 0.5rem; }
</style>
