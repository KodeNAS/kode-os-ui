<template>
  <div class="kode-tile photo-of-the-day" :class="{ 'is-empty': !objectUrl && !isLoading && !error }">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <button
      v-if="editMode"
      type="button"
      class="widget-gear"
      :aria-label="$t('Photo settings')"
      :title="$t('Photo settings')"
      @click.stop="openSettings"
    >
      <b-icon icon="control-outline" pack="casa" size="is-small" />
    </button>

    <!-- Background image is loaded as a blob so we can attach the Immich
         API key in an x-api-key header. Plain <img src=…> can't do that. -->
    <div v-if="objectUrl" class="potd-image" :style="{ backgroundImage: `url(${objectUrl})` }"></div>
    <div class="potd-scrim"></div>

    <div class="potd-overlay">
      <div class="potd-eyebrow">
        <b-icon icon="image" pack="casa" size="is-small" />
        <span>{{ $t('Photo of the day') }}</span>
      </div>
      <div v-if="caption" class="potd-caption">{{ caption }}</div>
      <div v-if="subcaption" class="potd-sub">{{ subcaption }}</div>
    </div>

    <div v-if="isLoading && !objectUrl" class="potd-status">{{ $t('Loading…') }}</div>
    <div v-else-if="error" class="potd-status is-error">
      {{ errorMessage }}
      <button v-if="editMode" type="button" class="potd-setup-cta" @click.stop="openSettings">
        {{ $t('Open settings') }}
      </button>
    </div>
    <div v-else-if="!objectUrl && !isLoading" class="potd-status">
      {{ $t('Add your Immich URL + API key in settings to see a daily photo.') }}
      <button v-if="editMode" type="button" class="potd-setup-cta" @click.stop="openSettings">
        {{ $t('Set up') }}
      </button>
    </div>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'
import PhotoOfTheDaySettingsModal from '@/components/beginner/PhotoOfTheDaySettingsModal.vue'

const SETTINGS_KEY = 'kode_potd_settings'
const CACHE_KEY = 'kode_potd_cache_v1'
const DEFAULT_SETTINGS = {
  immichUrl: '',
  apiKey: '',
  source: 'memory',    // 'memory' | 'random' | 'album'
  albumId: '',
  refreshHours: 24,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function defaultImmichUrl() {
  // Default to the pebble's hostname on Immich's default port — saves
  // the user from having to type it in on the common case.
  try {
    const host = window.location.hostname
    if (host) return `http://${host}:2283`
  } catch (e) { /* ignore */ }
  return ''
}

export default {
  name: 'PhotoOfTheDayWidget',
  mixins: [hintMode],
  props: {
    editMode: { type: Boolean, default: false },
  },
  data() {
    const settings = loadSettings()
    if (!settings.immichUrl) settings.immichUrl = defaultImmichUrl()
    return {
      settings,
      objectUrl: '',
      caption: '',
      subcaption: '',
      isLoading: false,
      error: false,
      errorMessage: '',
      pollId: null,
    }
  },
  computed: {
    hintLabel() {
      return this.$t('One nostalgic photo per day from your Immich library. Gear in edit mode for the URL + API key.')
    },
  },
  watch: {
    settings: {
      handler() { this.persist(); this.fetchPhoto(true) },
      deep: true,
    },
  },
  mounted() {
    this.fetchPhoto()
    // Re-evaluate every hour — if the day rolled over OR the configured
    // refresh window elapsed, fetchPhoto picks a new one.
    this.pollId = setInterval(() => this.fetchPhoto(), 60 * 60 * 1000)
  },
  beforeDestroy() {
    if (this.pollId) clearInterval(this.pollId)
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl)
  },
  methods: {
    persist() {
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)) } catch (e) { /* ignore */ }
    },
    openSettings() {
      this.$buefy.modal.open({
        parent: this,
        component: PhotoOfTheDaySettingsModal,
        hasModalCard: true,
        trapFocus: true,
        scroll: 'keep',
        animation: 'zoom-in',
        props: { value: { ...this.settings } },
        events: {
          save: (next) => {
            this.settings = { ...this.settings, ...next }
            // settings watcher will persist and refetch.
          },
        },
      })
    },
    cacheRead() {
      try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return null
        return JSON.parse(raw)
      } catch (e) { return null }
    },
    cacheWrite(payload) {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)) } catch (e) { /* ignore */ }
    },
    cleanUrl(u) {
      return String(u || '').replace(/\/+$/, '')
    },
    async fetchPhoto(force = false) {
      const { immichUrl, apiKey, source, albumId, refreshHours } = this.settings
      if (!immichUrl || !apiKey) {
        this.error = false
        this.objectUrl = ''
        return
      }
      // Cache check: same source + album, fetched within refreshHours,
      // and matching today's date when source is memory (since memory
      // lane changes every day). Reuse cached asset id if valid.
      const cache = this.cacheRead()
      const now = Date.now()
      const cacheAgeMs = cache ? now - (cache.fetchedAt || 0) : Infinity
      const maxAgeMs = Math.max(1, refreshHours) * 60 * 60 * 1000
      const cacheValid = cache
        && cache.source === source
        && cache.albumId === (albumId || '')
        && cacheAgeMs < maxAgeMs
        && (source !== 'memory' || cache.dayKey === todayKey())
      if (!force && cacheValid && cache.assetId) {
        try {
          await this.loadAssetImage(cache.assetId)
          this.caption = cache.caption || ''
          this.subcaption = cache.subcaption || ''
          return
        } catch (e) { /* fall through and re-pick */ }
      }

      this.isLoading = true
      this.error = false
      try {
        const picked = await this.pickAsset()
        if (!picked) {
          this.error = true
          this.errorMessage = this.$t('No photos found. Try a different source or album.')
          return
        }
        await this.loadAssetImage(picked.assetId)
        this.caption = picked.caption
        this.subcaption = picked.subcaption
        this.cacheWrite({
          assetId: picked.assetId,
          caption: picked.caption,
          subcaption: picked.subcaption,
          source,
          albumId: albumId || '',
          dayKey: todayKey(),
          fetchedAt: now,
        })
      } catch (e) {
        this.error = true
        this.errorMessage = e && e.message
          ? `${this.$t('Couldn\'t reach Immich:')} ${e.message}`
          : this.$t('Couldn\'t reach Immich.')
      } finally {
        this.isLoading = false
      }
    },
    async pickAsset() {
      const base = this.cleanUrl(this.settings.immichUrl)
      const headers = { 'x-api-key': this.settings.apiKey, Accept: 'application/json' }
      const source = this.settings.source

      // Memory Lane — "this day in previous years". Most nostalgic.
      // Falls back to random if there are no memories for today.
      if (source === 'memory') {
        const d = new Date()
        const url = `${base}/api/memory-lane?day=${d.getDate()}&month=${d.getMonth() + 1}`
        const res = await fetch(url, { headers })
        if (!res.ok) throw new Error(`Memory lane HTTP ${res.status}`)
        const groups = await res.json()
        const flat = []
        for (const g of Array.isArray(groups) ? groups : []) {
          for (const a of (Array.isArray(g.assets) ? g.assets : [])) {
            flat.push({ asset: a, group: g })
          }
        }
        if (flat.length > 0) {
          const pick = flat[Math.floor(Math.random() * flat.length)]
          const yrs = pick.group.yearsAgo
          const caption = yrs === 1
            ? this.$t('1 year ago')
            : (yrs > 1 ? `${yrs} ${this.$t('years ago')}` : (pick.group.title || this.$t('Memories')))
          return {
            assetId: pick.asset.id,
            caption,
            subcaption: this.assetDateLabel(pick.asset),
          }
        }
        // No memories today — fall through to random.
      }

      // Specific album — random asset from that album.
      if (source === 'album' && this.settings.albumId) {
        const url = `${base}/api/albums/${encodeURIComponent(this.settings.albumId)}`
        const res = await fetch(url, { headers })
        if (!res.ok) throw new Error(`Album HTTP ${res.status}`)
        const album = await res.json()
        const assets = Array.isArray(album.assets) ? album.assets : []
        if (assets.length === 0) return null
        const pick = assets[Math.floor(Math.random() * assets.length)]
        return {
          assetId: pick.id,
          caption: album.albumName || this.$t('From your album'),
          subcaption: this.assetDateLabel(pick),
        }
      }

      // Random fallback. Immich's `/api/assets/random?count=1` returns
      // an array of one asset.
      const url = `${base}/api/assets/random?count=1`
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error(`Random HTTP ${res.status}`)
      const arr = await res.json()
      const a = Array.isArray(arr) ? arr[0] : null
      if (!a) return null
      return {
        assetId: a.id,
        caption: this.$t('From your library'),
        subcaption: this.assetDateLabel(a),
      }
    },
    assetDateLabel(asset) {
      const iso = asset && (asset.exifInfo && asset.exifInfo.dateTimeOriginal)
        || (asset && asset.fileCreatedAt)
        || (asset && asset.localDateTime)
      if (!iso) return ''
      try {
        const d = new Date(iso)
        return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
      } catch (e) { return '' }
    },
    async loadAssetImage(assetId) {
      const base = this.cleanUrl(this.settings.immichUrl)
      const url = `${base}/api/assets/${encodeURIComponent(assetId)}/thumbnail?size=preview`
      const res = await fetch(url, { headers: { 'x-api-key': this.settings.apiKey } })
      if (!res.ok) throw new Error(`Thumbnail HTTP ${res.status}`)
      const blob = await res.blob()
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = URL.createObjectURL(blob)
    },
  },
}
</script>

<style lang="scss" scoped>
.kode-tile {
  position: relative;
  background: rgba(245, 247, 250, 0.82);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
  min-height: 220px;
  color: #fff;
}
.kode-tile.is-empty {
  background: linear-gradient(135deg, rgba(45, 95, 78, 0.65), rgba(26, 31, 46, 0.85));
  color: #fff;
}

.kode-hint {
  position: absolute;
  top: -10px; left: 50%;
  transform: translate(-50%, -100%);
  background: rgba(15, 25, 30, 0.92);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  line-height: 1.4;
  max-width: 280px;
  white-space: normal;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 50;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}
.kode-tile:hover .kode-hint { opacity: 1; }

.widget-gear {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  border: none;
  color: rgba(255, 255, 255, 0.85);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  transition: background 0.15s, color 0.15s;

  &:hover { background: rgba(45, 95, 78, 0.85); color: #fff; }
}

.potd-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 8s ease-out;
}
.kode-tile:hover .potd-image { transform: scale(1.05); }

.potd-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg,
    rgba(15, 25, 30, 0.15) 0%,
    rgba(15, 25, 30, 0.0) 35%,
    rgba(15, 25, 30, 0.55) 100%);
  pointer-events: none;
}

.potd-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1rem 1.25rem 1.1rem;
  z-index: 2;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
}

.potd-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.32);
  padding: 3px 9px;
  border-radius: 999px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.potd-caption {
  font-size: 1.05rem;
  font-weight: 500;
  margin-top: 0.45rem;
  color: #fff;
  letter-spacing: -0.01em;
}

.potd-sub {
  font-size: 0.75rem;
  margin-top: 0.15rem;
  color: rgba(255, 255, 255, 0.78);
  font-feature-settings: 'tnum' 1;
}

.potd-status {
  position: relative;
  z-index: 2;
  padding: 1.5rem 1.25rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);

  &.is-error { color: #ffd2d2; }
}

.potd-setup-cta {
  display: inline-block;
  margin-top: 0.55rem;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  color: #1f2937;
  font-size: 0.8125rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: #fff; }
}
</style>
