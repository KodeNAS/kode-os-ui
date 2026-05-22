<template>
  <div class="kode-tile search-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <form class="search-form" @submit.prevent="onSubmit">
      <b-icon icon="search-outline" pack="casa" size="is-small" class="search-icon" />
      <input
        v-model="query"
        type="text"
        :placeholder="$t('Search the web…')"
        class="search-input"
        autocomplete="off"
        spellcheck="false"
      />
      <button type="submit" class="search-submit" :disabled="!query.trim()">
        <b-icon icon="arrow-right" pack="casa" size="is-small" />
      </button>
    </form>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

export default {
  name: 'SearchWidget',
  mixins: [hintMode],
  data() {
    return { query: '' }
  },
  computed: {
    hintLabel() {
      return this.$t('Web search via your chosen engine in Settings (defaults to DuckDuckGo). Opens in a new tab.')
    },
  },
  methods: {
    onSubmit() {
      const q = (this.query || '').trim()
      if (!q) return
      const engineUrl = this.$store.state.searchEngine || 'https://duckduckgo.com/?q='
      window.open(engineUrl + encodeURIComponent(q), '_blank', 'noopener')
      this.query = ''
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
  padding: 0.7rem 0.85rem;
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

.search-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-icon {
  color: rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 0.55rem 0.85rem;
  font-size: 0.9375rem;
  color: #1f2937;
  outline: none;
  transition: background 0.15s, border-color 0.15s;
  min-width: 0;

  &:focus {
    background: #fff;
    border-color: rgba(45, 95, 78, 0.4);
  }

  &::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }
}

.search-submit {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #2d5f4e;
  color: #fff;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, opacity 0.15s;

  &:hover:not(:disabled) {
    background: #3f7a66;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
