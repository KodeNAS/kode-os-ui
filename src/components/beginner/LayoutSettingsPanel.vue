<template>
  <div class="layout-settings">
    <div class="setting-block">
      <h4 class="setting-label">{{ $t('Columns') }}</h4>
      <div class="setting-options">
        <button
          v-for="n in [2, 3, 4]"
          :key="n"
          type="button"
          class="option-chip"
          :class="{ 'is-active': columnCount === n }"
          @click="$emit('column-count', n)"
        >
          {{ n }} {{ $t('cols') }}
        </button>
      </div>
    </div>

    <div class="setting-block">
      <h4 class="setting-label">{{ $t('Pre-made layouts') }}</h4>
      <div class="template-list">
        <button
          v-for="t in templates"
          :key="t.key"
          type="button"
          class="template-card"
          @click="$emit('apply-template', t.key)"
        >
          <div class="template-preview" :style="previewStyle(t)">
            <span v-for="(col, ci) in t.cols" :key="ci" class="preview-col">
              <span v-for="w in col" :key="w" class="preview-widget"></span>
            </span>
          </div>
          <div class="template-title">{{ t.name }}</div>
          <div class="template-desc">{{ t.description }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LayoutSettingsPanel',
  props: {
    columnCount: { type: Number, required: true },
    templates: { type: Array, required: true },
  },
  methods: {
    previewStyle(t) {
      return {
        gridTemplateColumns: `repeat(${t.cols.length}, 1fr)`,
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.layout-settings {
  max-width: 1280px;
  margin: 0 auto 1.25rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 6px 22px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 2rem;
}

.setting-block {
  flex: 1;
  min-width: 240px;
}

.setting-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 0.55rem;
}

.setting-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.option-chip {
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1f2937;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover { background: rgba(45, 95, 78, 0.08); }

  &.is-active {
    background: #2d5f4e;
    color: #fff;
    border-color: #2d5f4e;
  }
}

.template-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.6rem;
}

.template-card {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 0.7rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;

  &:hover {
    border-color: rgba(45, 95, 78, 0.55);
    transform: translateY(-1px);
  }
}

.template-preview {
  display: grid;
  gap: 3px;
  height: 56px;
  margin-bottom: 0.4rem;
  padding: 4px;
  background: rgba(15, 25, 30, 0.6);
  border-radius: 6px;
}

.preview-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview-widget {
  flex: 1;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  min-height: 4px;
}

.template-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1f2937;
}

.template-desc {
  font-size: 0.6875rem;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 1px;
  line-height: 1.4;
}
</style>
