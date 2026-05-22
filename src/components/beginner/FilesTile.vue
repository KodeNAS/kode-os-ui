<template>
  <button
    type="button"
    class="kode-tile files-tile"
    :aria-label="$t('Open Files')"
    @click="open"
  >
    <b-tooltip
      :label="$t('Open')"
      :triggers="['hover']"
      animation="fade1"
      type="is-white"
      class="files-tooltip"
    >
      <div class="files-inner">
        <span class="files-icon">
          <b-icon icon="folder" pack="casa" size="is-medium" />
        </span>
        <span class="files-text">
          <span class="files-title">{{ $t('Files') }}</span>
          <span class="files-desc">{{ $t('Browse everything on your pebble') }}</span>
        </span>
      </div>
    </b-tooltip>
  </button>
</template>

<script>
export default {
  name: 'FilesTile',
  inject: {
    homeShowFiles: { default: null },
  },
  methods: {
    open() {
      if (typeof this.homeShowFiles === 'function') {
        this.homeShowFiles('/DATA')
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.kode-tile {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s, box-shadow 0.18s;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      0 14px 36px rgba(0, 0, 0, 0.22);
  }
}

/* The tooltip wrapper should fill the tile so the entire surface is the
   click target (otherwise only the natural-sized inner is hot). */
.files-tooltip ::v-deep .b-tooltip,
.files-tile .files-tooltip {
  width: 100%;
}

.files-inner {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
}

.files-icon {
  flex: 0 0 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2d5f4e, #3f7a66);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.files-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.files-title {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
}

.files-desc {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 1px;
}
</style>
