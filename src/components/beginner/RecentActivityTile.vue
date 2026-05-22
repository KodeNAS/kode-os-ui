<template>
  <div class="kode-tile recent-activity-tile">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <header class="tile-header">
      <h2 class="tile-title">{{ $t('Recent activity') }}</h2>
    </header>

    <div v-if="isLoading" class="tile-empty">
      {{ $t('Loading...') }}
    </div>
    <div v-else-if="items.length === 0" class="tile-empty">
      {{ $t('Files saved to your pebble will appear here.') }}
    </div>
    <ul v-else class="tile-list">
      <li
        v-for="item in items"
        :key="item.path"
        class="tile-row"
        @click="open(item)"
      >
        <div class="tile-row-icon" :class="iconClass(item)">
          <b-icon :icon="iconName(item)" pack="casa" size="is-medium" />
        </div>
        <div class="tile-row-text">
          <div class="tile-row-name">{{ item.name }}</div>
          <div class="tile-row-time">{{ relativeTime(item.date) }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

export default {
  name: 'RecentActivityTile',
  mixins: [hintMode],
  inject: {
    homeShowFiles: { default: null },
  },
  data() {
    return {
      isLoading: true,
      items: [],
      HOME_PATH: '/DATA',
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Your latest files and folders in /DATA. Click any row to open it in the file browser.')
    },
  },
  created() {
    this.load()
  },
  methods: {
    async load() {
      try {
        const res = await this.$api.folder.getList(this.HOME_PATH)
        const content = (res && res.data && res.data.data && res.data.data.content) || []
        this.items = [...content]
          .filter(i => i.name && !i.name.startsWith('.'))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 6)
      } catch (e) {
        this.items = []
      } finally {
        this.isLoading = false
      }
    },
    open(item) {
      if (typeof this.homeShowFiles === 'function') {
        this.homeShowFiles(item.is_dir ? item.path : this.HOME_PATH)
      }
    },
    iconName(item) {
      if (item.is_dir) return 'folder'
      const ext = (item.name.split('.').pop() || '').toLowerCase()
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return 'image'
      if (['mp4', 'mov', 'mkv', 'avi'].includes(ext)) return 'video'
      if (['mp3', 'flac', 'wav', 'm4a'].includes(ext)) return 'music'
      if (['pdf'].includes(ext)) return 'pdf'
      if (['doc', 'docx', 'txt', 'md'].includes(ext)) return 'document'
      return 'file'
    },
    iconClass(item) {
      if (item.is_dir) return 'is-folder'
      const ext = (item.name.split('.').pop() || '').toLowerCase()
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return 'is-image'
      if (['mp4', 'mov', 'mkv', 'avi'].includes(ext)) return 'is-video'
      if (['mp3', 'flac', 'wav', 'm4a'].includes(ext)) return 'is-audio'
      return 'is-file'
    },
    relativeTime(value) {
      if (!value) return ''
      const date = new Date(value)
      if (isNaN(date.getTime())) return ''
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
      if (seconds < 60) return this.$t('Just now')
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes}m ago`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}h ago`
      const days = Math.floor(hours / 24)
      if (days < 7) return `${days}d ago`
      const locale = (window.localStorage.getItem('lang') || navigator.language || 'en').replace('_', '-')
      return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date)
    },
  },
}
</script>

<style lang="scss" scoped>
/* Liquid glass — frosted white panel with saturation boost, subtle highlight
   inset, soft drop shadow. Sits over the dark scrim so dark text reads. */
.kode-tile {
  position: relative;
  background: rgba(245, 247, 250, 0.82);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 20px;
  padding: 1.1rem 1.25rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
}

.kode-hint {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translate(-50%, -100%);
  background: rgba(15, 25, 30, 0.92);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  line-height: 1.4;
  max-width: 260px;
  white-space: normal;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 50;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.kode-tile:hover .kode-hint {
  opacity: 1;
}

.tile-header {
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.tile-title {
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: rgba(31, 41, 55, 0.7);
}

.tile-empty {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.55);
  padding: 1rem 0;
}

.tile-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tile-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(45, 95, 78, 0.10);
  }
}

.tile-row-icon {
  flex: 0 0 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #fff;

  &.is-folder { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }
  &.is-image  { background: linear-gradient(135deg, #b45f6d, #d97e8c); }
  &.is-video  { background: linear-gradient(135deg, #5e6ad2, #7c8af0); }
  &.is-audio  { background: linear-gradient(135deg, #c47f00, #e6a02a); }
  &.is-file   { background: linear-gradient(135deg, #4b5563, #6b7280); }
}

.tile-row-text {
  flex: 1;
  min-width: 0;
}

.tile-row-name {
  font-size: 0.9375rem;
  color: #1f2937;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile-row-time {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 1px;
}
</style>
