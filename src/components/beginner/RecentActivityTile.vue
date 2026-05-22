<template>
  <div class="kode-tile recent-activity-tile">
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
        <b-icon
          :icon="item.is_dir ? 'folder' : 'file'"
          pack="casa"
          size="is-medium"
          class="tile-row-icon"
        />
        <div class="tile-row-text">
          <div class="tile-row-name">{{ item.name }}</div>
          <div class="tile-row-time">{{ item.date | dateFmt }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { mixin } from '@/mixins/mixin'

const HOME_PATH = '/DATA'
const MAX_ITEMS = 6

export default {
  name: 'RecentActivityTile',
  mixins: [mixin],
  inject: {
    homeShowFiles: { default: null },
  },
  data() {
    return {
      isLoading: true,
      items: [],
    }
  },
  created() {
    this.load()
  },
  methods: {
    async load() {
      try {
        const res = await this.$api.folder.getList(HOME_PATH)
        const content = (res && res.data && res.data.data && res.data.data.content) || []
        const sorted = [...content]
          .filter(i => i.name && !i.name.startsWith('.'))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, MAX_ITEMS)
        this.items = sorted
      } catch (e) {
        this.items = []
      } finally {
        this.isLoading = false
      }
    },
    open(item) {
      if (typeof this.homeShowFiles === 'function') {
        this.homeShowFiles(item.is_dir ? item.path : HOME_PATH)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.kode-tile {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.tile-header {
  margin-bottom: 0.75rem;
}

.tile-title {
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #1f2937;
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
}

.tile-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(45, 95, 78, 0.08);
  }

  + .tile-row {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }
}

.tile-row-icon {
  color: #2d5f4e;
}

.tile-row-text {
  flex: 1;
  min-width: 0;
}

.tile-row-name {
  font-size: 0.9375rem;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile-row-time {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
}
</style>
