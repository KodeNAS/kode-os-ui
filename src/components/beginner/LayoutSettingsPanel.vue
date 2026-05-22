<template>
  <div class="layout-settings-bar">
    <!-- Columns dropdown -->
    <b-dropdown aria-role="list" position="is-bottom-right" animation="fade1">
      <template #trigger>
        <button type="button" class="settings-chip">
          <b-icon icon="control-outline" pack="casa" size="is-small" />
          <span>{{ columnCount }} {{ $t('columns') }}</span>
          <b-icon icon="down-outline" pack="casa" size="is-small" class="chip-caret" />
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
    <b-dropdown aria-role="list" position="is-bottom-right" animation="fade1" class="templates-dropdown" :close-on-click="false">
      <template #trigger>
        <button type="button" class="settings-chip">
          <b-icon icon="wallpaper-outline" pack="casa" size="is-small" />
          <span>{{ $t('Layouts') }}</span>
          <b-icon icon="down-outline" pack="casa" size="is-small" class="chip-caret" />
        </button>
      </template>

      <b-dropdown-item :focusable="true" custom class="template-item">
        <button type="button" class="template-save-row" @click="$emit('save-current')">
          <b-icon icon="plus-outline" pack="casa" size="is-small" class="save-plus" />
          <span class="template-text">
            <span class="template-name">{{ $t('Save current layout…') }}</span>
            <span class="template-desc">{{ $t('Save your current columns + widgets as a reusable layout.') }}</span>
          </span>
        </button>
      </b-dropdown-item>

      <b-dropdown-item :focusable="true" custom class="template-item">
        <button type="button" class="template-reset-row" @click="$emit('reset-layout')">
          <b-icon icon="restart-outline" pack="casa" size="is-small" class="reset-icon" />
          <span class="template-text">
            <span class="template-name">{{ $t('Reset layout to defaults') }}</span>
            <span class="template-desc">{{ $t('Wipe column + weight state. Saved layouts in "Your layouts" are kept.') }}</span>
          </span>
        </button>
      </b-dropdown-item>

      <div v-if="userTemplates.length > 0" class="template-section-label">{{ $t('Your layouts') }}</div>
      <b-dropdown-item
        v-for="t in userTemplates"
        :key="`user-${t.key}`"
        :focusable="true"
        custom
        class="template-item"
      >
        <div class="template-row-wrap">
          <button type="button" class="template-row" @click="$emit('apply-template', t.key)">
            <span class="template-preview" :style="previewStyle(t)">
              <span v-for="(col, ci) in t.cols" :key="ci" class="preview-col">
                <span v-for="w in col" :key="w" class="preview-widget"></span>
              </span>
            </span>
            <span class="template-text">
              <span class="template-name">{{ t.name }}</span>
              <span class="template-desc">{{ t.description || $t('Your saved layout.') }}</span>
            </span>
          </button>
          <button
            type="button"
            class="template-overwrite"
            :aria-label="$t('Save current as this layout')"
            :title="$t('Overwrite this saved layout with your current setup')"
            @click.stop="$emit('overwrite-template', t.key)"
          >
            <b-icon icon="restart-outline" pack="casa" size="is-small" />
          </button>
          <button
            type="button"
            class="template-delete"
            :aria-label="$t('Delete layout')"
            :title="$t('Delete this saved layout')"
            @click.stop="$emit('delete-template', t.key)"
          >
            <b-icon icon="close-outline" pack="casa" size="is-small" />
          </button>
        </div>
      </b-dropdown-item>

      <div class="template-section-label">{{ $t('Pre-made') }}</div>
      <b-dropdown-item
        v-for="t in builtInTemplates"
        :key="`builtin-${t.key}`"
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
    userTemplates: { type: Array, default: () => [] },
  },
  computed: {
    builtInTemplates() {
      return this.templates
    },
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
  background: rgba(245, 247, 250, 0.82);
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

.template-section-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(0, 0, 0, 0.5);
  padding: 0.6rem 0.85rem 0.25rem;
  font-weight: 600;
}

.template-row-wrap {
  display: flex;
  align-items: center;
  width: 100%;
  border-radius: 8px;

  &:hover {
    background: rgba(45, 95, 78, 0.10);
  }

  .template-row {
    flex: 1;

    &:hover { background: none; }
  }
}

.template-overwrite,
.template-delete {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: none;
  border: none;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.template-overwrite {
  margin-right: 0.15rem;
  &:hover { background: rgba(45, 95, 78, 0.12); color: #2d5f4e; }
}

.template-delete {
  margin-right: 0.35rem;
  &:hover { background: rgba(176, 74, 74, 0.12); color: #b04a4a; }
}

.template-save-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.6rem 0.85rem;
  background: rgba(45, 95, 78, 0.06);
  border: 1px dashed rgba(45, 95, 78, 0.3);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
  margin-bottom: 0.25rem;

  &:hover {
    background: rgba(45, 95, 78, 0.12);
    border-color: rgba(45, 95, 78, 0.5);
  }
}

.save-plus {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #2d5f4e;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.template-reset-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.55rem 0.85rem;
  background: rgba(176, 74, 74, 0.05);
  border: 1px dashed rgba(176, 74, 74, 0.3);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
  margin-bottom: 0.25rem;

  &:hover {
    background: rgba(176, 74, 74, 0.10);
    border-color: rgba(176, 74, 74, 0.5);
  }
}

.reset-icon {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #b04a4a;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
