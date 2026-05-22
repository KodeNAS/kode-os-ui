<template>
  <div class="layout-settings-bar">
    <!-- Columns dropdown -->
    <b-dropdown aria-role="list" position="is-bottom-right" animation="fade1">
      <template #trigger>
        <button type="button" class="settings-chip">
          <b-icon icon="control-outline" pack="casa" size="is-small" />
          <span>{{ columnCount }} {{ $t('columns') }}</span>
          <b-icon icon="arrow-down" pack="casa" size="is-small" class="chip-caret" />
        </button>
      </template>
      <b-dropdown-item
        v-for="n in [2, 3, 4]"
        :key="n"
        :focusable="true"
        @click="$emit('column-count', n)"
      >
        <span class="dd-row">
          <span>{{ n }} {{ $t('columns') }}</span>
          <b-icon
            v-if="columnCount === n"
            icon="check"
            pack="casa"
            size="is-small"
            class="dd-check"
          />
        </span>
      </b-dropdown-item>
    </b-dropdown>

    <!-- Templates dropdown -->
    <b-dropdown aria-role="list" position="is-bottom-right" animation="fade1" class="templates-dropdown">
      <template #trigger>
        <button type="button" class="settings-chip">
          <b-icon icon="wallpaper-outline" pack="casa" size="is-small" />
          <span>{{ $t('Layouts') }}</span>
          <b-icon icon="arrow-down" pack="casa" size="is-small" class="chip-caret" />
        </button>
      </template>
      <b-dropdown-item
        v-for="t in templates"
        :key="t.key"
        :focusable="true"
        custom
        class="template-item"
        @click="$emit('apply-template', t.key)"
      >
        <button type="button" class="template-row" @click="$emit('apply-template', t.key)">
          <span class="template-preview" :style="previewStyle(t)">
            <span v-for="(col, ci) in t.cols" :key="ci" class="preview-col">
              <span v-for="w in col" :key="w" class="preview-widget"></span>
            </span>
          </span>
          <span class="template-text">
            <span class="template-name">{{ t.name }}</span>
            <span class="template-desc">{{ t.description }}</span>
          </span>
        </button>
      </b-dropdown-item>
    </b-dropdown>
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
.layout-settings-bar {
  max-width: 1280px;
  margin: 0 auto 1rem;
  padding: 0 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.settings-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 7px 12px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 999px;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
  transition: background 0.15s, border-color 0.15s, transform 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.28);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.chip-caret {
  opacity: 0.85;
}

.dd-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 140px;
}

.dd-check {
  margin-left: auto;
  color: #2d5f4e;
}

.templates-dropdown ::v-deep .dropdown-content {
  max-height: 380px;
  overflow-y: auto;
  padding: 0.35rem;
}

.templates-dropdown ::v-deep .template-item {
  padding: 0 !important;
}

.template-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.5rem 0.65rem;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  text-align: left;
  transition: background 0.15s;

  &:hover {
    background: rgba(45, 95, 78, 0.10);
  }
}

.template-preview {
  flex: 0 0 56px;
  height: 40px;
  display: grid;
  gap: 2px;
  padding: 3px;
  background: rgba(15, 25, 30, 0.6);
  border-radius: 5px;
}

.preview-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview-widget {
  flex: 1;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 2px;
  min-height: 4px;
}

.template-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.template-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

.template-desc {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 1px;
  line-height: 1.4;
}
</style>
