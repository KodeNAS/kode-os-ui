<template>
  <div class="fb-step layout-chooser has-text-white">
    <div class="kicker">{{ $t('Almost done') }}</div>
    <h1 class="title is-3 has-text-white">{{ $t('Pick your starting layout') }}</h1>
    <p class="subtitle is-6 has-text-white-bis">
      {{ $t('You can rearrange, add, and remove tiles anytime once you\'re on the dashboard.') }}
    </p>

    <ul class="layout-grid">
      <li
        v-for="opt in OPTIONS"
        :key="opt.key"
        class="layout-card"
        :class="{ 'is-selected': selected === opt.key, 'is-recommended': opt.recommended }"
        @click="select(opt.key)"
      >
        <div class="layout-preview" :class="`is-${opt.previewClass || 'cols'}`">
          <template v-if="opt.preview">
            <span v-for="(col, ci) in opt.preview" :key="ci" class="preview-col">
              <span v-for="(w, wi) in col" :key="wi" class="preview-widget" :style="{ flex: w }"></span>
            </span>
          </template>
          <template v-else>
            <span class="preview-blank">+</span>
          </template>
        </div>
        <div class="layout-text">
          <div class="layout-name-row">
            <span class="layout-name">{{ $t(opt.name) }}</span>
            <span v-if="opt.recommended" class="layout-tag">{{ $t('Recommended') }}</span>
          </div>
          <div class="layout-desc">{{ $t(opt.description) }}</div>
        </div>
        <span class="layout-check" v-if="selected === opt.key">
          <b-icon icon="check-outline" pack="casa" size="is-small" />
        </span>
      </li>
    </ul>

    <div class="layout-actions">
      <b-button rounded @click="$emit('back')">{{ $t('Back') }}</b-button>
      <div class="is-flex-grow-1"></div>
      <b-button
        rounded
        type="is-primary"
        :disabled="!selected"
        @click="confirm"
      >
        {{ $t('Use this layout') }}
      </b-button>
    </div>
  </div>
</template>

<script>
/*
 * First-boot wizard step. Shows a curated set of starting-layout
 * tiles with mini-previews; user picks one (or "Blank") and the
 * wizard's finish() writes it into the dashboard's localStorage so
 * the user lands on that layout instead of the generic default.
 *
 * Previews are not the real template column data — they're
 * simplified shape descriptors so the cards stay visually clean
 * regardless of the actual widget count.
 */

const OPTIONS = [
  {
    key: 'builtin-default',
    name: 'Default',
    description: 'Clock + weather, apps in the middle, family on the side. Balanced 3-column.',
    recommended: true,
    // Each entry is a column; each number is a widget block's flex weight.
    preview: [
      [1, 1],
      [2, 1, 1],
      [1, 1, 1],
    ],
  },
  {
    key: 'builtin-minimalist-1',
    name: 'Minimalist 1',
    description: 'Two columns, just the essentials. Less is more.',
    preview: [
      [1, 1, 1, 1],
      [2, 1, 1],
    ],
  },
  {
    key: 'builtin-simple-1',
    name: 'Simple 1',
    description: 'Search + apps on the left, time + weather on the right.',
    preview: [
      [1, 3],
      [1, 1],
    ],
  },
  {
    key: 'builtin-full-1',
    name: 'Full 1',
    description: 'Three columns including a dedicated app shortcuts strip.',
    preview: [
      [1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ],
  },
  {
    key: 'blank',
    name: 'Blank canvas',
    description: 'Empty dashboard — build it yourself from the Add widget panel.',
    previewClass: 'blank',
  },
]

export default {
  name: 'LayoutChooserStep',
  data() {
    return {
      OPTIONS,
      selected: 'builtin-default',
    }
  },
  methods: {
    select(key) {
      this.selected = key
    },
    confirm() {
      if (!this.selected) return
      this.$emit('next', { templateKey: this.selected })
    },
  },
}
</script>

<style lang="scss" scoped>
.fb-step { animation: layout-chooser-fade 0.4s ease both; }
@keyframes layout-chooser-fade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.kicker {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.35rem;
}

.title { margin-bottom: 0.25rem !important; }
.subtitle { margin-bottom: 1.25rem !important; opacity: 0.85; }

/* 2-up grid of cards (single column on narrow screens). */
.layout-grid {
  list-style: none;
  margin: 0 0 1.25rem 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
}

.layout-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem 0.85rem;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.18s;

  &:hover {
    background: rgba(255, 255, 255, 0.16);
    transform: translateY(-1px);
  }

  &.is-selected {
    background: rgba(45, 95, 78, 0.32);
    border-color: rgba(45, 95, 78, 0.85);
    box-shadow: 0 0 0 2px rgba(45, 95, 78, 0.55);
  }
}

/* Mini-preview: tiny stack of column boxes filled with widget blocks. */
.layout-preview {
  flex: 0 0 72px;
  height: 52px;
  display: grid;
  gap: 3px;
  padding: 4px;
  background: rgba(15, 25, 30, 0.55);
  border-radius: 8px;
  grid-template-columns: var(--cols-template);
  /* fallback when no var set */
  grid-auto-flow: column;
  grid-auto-columns: 1fr;

  &.is-blank {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 25, 30, 0.55);
    border: 2px dashed rgba(255, 255, 255, 0.35);
  }
}

.preview-blank {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1;
}

.preview-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
}

.preview-widget {
  background: rgba(245, 247, 250, 0.85);
  border-radius: 2px;
  min-height: 4px;
}

.layout-text { flex: 1; min-width: 0; }

.layout-name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.15rem;
}

.layout-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #fff;
}

.layout-tag {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  padding: 1px 7px;
  background: rgba(45, 95, 78, 0.85);
  color: #fff;
  border-radius: 999px;
}

.layout-desc {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.4;
}

.layout-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2d5f4e;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.layout-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
