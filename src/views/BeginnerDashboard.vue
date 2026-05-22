<template>
  <div class="beginner-dashboard">
    <div class="beginner-overlay">
      <div class="container">
        <header class="beginner-hero">
          <button
            type="button"
            class="edit-layout-toggle"
            :class="{ 'is-on': editMode }"
            @click="toggleEditMode"
          >
            <b-icon
              :icon="editMode ? 'check' : 'control-outline'"
              pack="casa"
              size="is-small"
            />
            <span>{{ editMode ? $t('Done') : $t('Edit layout') }}</span>
          </button>

          <h1 class="title is-2 has-text-white">
            {{ $t('Welcome to your pebble') }}
          </h1>
          <p class="subtitle is-5 has-text-white">
            {{ editMode
              ? $t('Drag any widget to any column.')
              : $t('Your own private cloud, ready when you are.') }}
          </p>
        </header>

        <div ref="grid" class="beginner-grid" :class="{ 'is-edit-mode': editMode }" :style="gridStyle">
          <!-- 3 columns separated by 2 dividers (col1 | div | col2 | div |
               col3). Vuedraggable group "kode-widgets" connects all three
               so widgets (including the apps grid) drag freely between
               any column when edit mode is on. Dividers are click-and-drag
               only in edit mode; otherwise inert. -->
          <template v-for="(column, ci) in columns">
            <draggable
              :key="`col-${ci}`"
              v-model="columns[ci]"
              tag="section"
              class="beginner-column"
              :class="{ 'is-empty': column.length === 0 }"
              :group="{ name: 'kode-widgets', pull: true, put: true }"
              :animation="200"
              :disabled="!editMode"
              :delay="40"
              :delay-on-touch-only="true"
              :touch-start-threshold="3"
              ghost-class="widget-ghost"
              @end="saveLayout"
            >
              <div
                v-for="key in column"
                :key="key"
                class="widget-slot"
                :class="`is-${key}`"
                :data-tour="tourKeyFor(key)"
              >
                <FilesTile          v-if="key === 'files'" />
                <RecentActivityTile v-else-if="key === 'recent'" />
                <FamilyTile         v-else-if="key === 'family'" />
                <AddDeviceTile      v-else-if="key === 'addDevice'" />
                <AppSection         v-else-if="key === 'apps'" ref="apps" :allowed-keys="pickedApps" />
              </div>
              <div v-if="editMode && column.length === 0" class="column-empty-hint">
                {{ $t('Drag a widget here') }}
              </div>
            </draggable>

            <div
              v-if="ci < columns.length - 1"
              :key="`div-${ci}`"
              class="col-divider"
              :class="{ 'is-dragging': activeDivider === ci }"
              role="separator"
              :aria-label="$t('Drag to resize columns')"
              @mousedown="startDividerResize(ci, $event)"
              @touchstart.passive="startDividerResize(ci, $event)"
            >
              <span class="col-divider-grip"></span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import AppSection from '@/components/Apps/AppSection.vue'
import RecentActivityTile from '@/components/beginner/RecentActivityTile.vue'
import FamilyTile from '@/components/beginner/FamilyTile.vue'
import AddDeviceTile from '@/components/beginner/AddDeviceTile.vue'
import FilesTile from '@/components/beginner/FilesTile.vue'
import { maybeStartEasyTourOnce } from '@/service/tour'

const LAYOUT_KEY = 'kode_columns_layout_v2'
const WEIGHTS_KEY = 'kode_columns_weights_v1'
const ALL_WIDGETS = ['files', 'recent', 'apps', 'family', 'addDevice']

// Default 3-column layout: small tiles on the sides, the apps grid in
// the middle column where it has room to breathe.
const DEFAULT_LAYOUT = [
  ['files', 'recent'],
  ['apps'],
  ['family', 'addDevice'],
]

const DEFAULT_WEIGHTS = [1, 1.2, 1]  // middle column gets a touch more by default
const MIN_WEIGHT = 0.35
const MAX_WEIGHT = 2.5
const DIVIDER_PX = 6

export default {
  name: 'BeginnerDashboard',
  components: {
    draggable,
    AppSection,
    RecentActivityTile,
    FamilyTile,
    AddDeviceTile,
    FilesTile,
  },
  data() {
    return {
      pickedApps: [],
      columns: this.loadLayout(),
      colWeights: this.loadWeights(),
      activeDivider: -1,
      editMode: false,
    }
  },
  computed: {
    gridStyle() {
      const [a, b, c] = this.colWeights
      return {
        gridTemplateColumns: `${a}fr ${DIVIDER_PX}px ${b}fr ${DIVIDER_PX}px ${c}fr`,
      }
    },
  },
  created() {
    this.loadPickedApps()
  },
  mounted() {
    // First visit only — fires the driver.js tour if kode_tour_seen
    // isn't set. Tour itself marks the flag on close/finish.
    maybeStartEasyTourOnce()
  },
  methods: {
    async loadPickedApps() {
      try {
        const res = await this.$api.users.getCustomStorage('kode_first_boot')
        const data = res && res.data && res.data.data
        if (data && Array.isArray(data.apps) && data.apps.length > 0) {
          this.pickedApps = data.apps
        }
      } catch (e) {
        this.pickedApps = []
      }
    },

    loadLayout() {
      try {
        const raw = localStorage.getItem(LAYOUT_KEY)
        if (!raw) return DEFAULT_LAYOUT.map(c => [...c])
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed) || parsed.length !== 3) {
          return DEFAULT_LAYOUT.map(c => [...c])
        }
        // Sanitise: drop unknown keys and add any default keys that
        // are missing entirely (so a future widget addition doesn't
        // strand existing layouts).
        const cleaned = parsed.map(col => {
          if (!Array.isArray(col)) return []
          return col.filter(k => ALL_WIDGETS.includes(k))
        })
        const present = new Set()
        cleaned.forEach(col => col.forEach(k => present.add(k)))
        const missing = ALL_WIDGETS.filter(k => !present.has(k))
        // Drop missing widgets into the first column as a safe fallback.
        if (missing.length > 0) cleaned[0].push(...missing)
        return cleaned
      } catch (e) {
        return DEFAULT_LAYOUT.map(c => [...c])
      }
    },
    saveLayout() {
      try {
        localStorage.setItem(LAYOUT_KEY, JSON.stringify(this.columns))
      } catch (e) { /* ignore quota / disabled storage */ }
    },
    loadWeights() {
      try {
        const raw = localStorage.getItem(WEIGHTS_KEY)
        if (!raw) return [...DEFAULT_WEIGHTS]
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed) || parsed.length !== 3) return [...DEFAULT_WEIGHTS]
        return parsed.map(w => {
          const n = Number(w)
          if (!isFinite(n)) return 1
          return Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, n))
        })
      } catch (e) {
        return [...DEFAULT_WEIGHTS]
      }
    },
    saveWeights() {
      try {
        localStorage.setItem(WEIGHTS_KEY, JSON.stringify(this.colWeights))
      } catch (e) { /* ignore */ }
    },
    startDividerResize(dividerIdx, e) {
      if (!this.editMode) return
      this.activeDivider = dividerIdx
      const point = (e.touches && e.touches[0]) || e
      this._dragStartX = point.clientX
      this._dragStartWeights = [...this.colWeights]
      // Container width minus the two divider pixels — that's the area
      // distributed by the fr units, so the fr-per-pixel conversion is
      // correct.
      const gridEl = this.$refs.grid
      this._gridUsableWidth = (gridEl ? gridEl.clientWidth : 0) - (DIVIDER_PX * 2)
      this._totalWeight = this.colWeights.reduce((a, b) => a + b, 0)

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      window.addEventListener('mousemove', this.onDividerMove)
      window.addEventListener('mouseup', this.endDividerResize)
      window.addEventListener('touchmove', this.onDividerMove, { passive: false })
      window.addEventListener('touchend', this.endDividerResize)
    },
    onDividerMove(e) {
      if (this.activeDivider < 0) return
      if (e.cancelable && e.preventDefault) e.preventDefault()
      const point = (e.touches && e.touches[0]) || e
      const deltaPx = point.clientX - this._dragStartX
      if (this._gridUsableWidth <= 0) return
      // Convert pixel delta to fr delta using the total weight share of
      // the usable grid width.
      const deltaFr = (deltaPx / this._gridUsableWidth) * this._totalWeight

      const i = this.activeDivider
      const left = this._dragStartWeights[i] + deltaFr
      const right = this._dragStartWeights[i + 1] - deltaFr

      // Clamp both sides; if either would breach a limit, refuse the
      // change so the total weight stays conserved and the layout
      // doesn't visually jump.
      if (left < MIN_WEIGHT || left > MAX_WEIGHT) return
      if (right < MIN_WEIGHT || right > MAX_WEIGHT) return

      const next = [...this.colWeights]
      next[i] = left
      next[i + 1] = right
      this.colWeights = next
    },
    endDividerResize() {
      if (this.activeDivider < 0) return
      this.activeDivider = -1
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      this.saveWeights()
      window.removeEventListener('mousemove', this.onDividerMove)
      window.removeEventListener('mouseup', this.endDividerResize)
      window.removeEventListener('touchmove', this.onDividerMove)
      window.removeEventListener('touchend', this.endDividerResize)
    },
    toggleEditMode() {
      this.editMode = !this.editMode
    },
    tourKeyFor(key) {
      return ({ files: 'files', recent: 'recent', family: 'family', addDevice: 'adddevice', apps: 'apps' })[key]
    },
  },
}
</script>

<style lang="scss" scoped>
.beginner-dashboard {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100% - 7rem);
  padding-top: 55px;
}

.beginner-overlay {
  min-height: 100%;
  padding: 2.5rem 0 6rem;
}

.beginner-hero {
  position: relative;
  max-width: 1280px;
  margin: 0 auto 2.5rem;
  padding: 0 2rem;

  .title,
  .subtitle {
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
  }

  .subtitle {
    opacity: 0.92;
  }
}

.edit-layout-toggle {
  position: absolute;
  top: 0;
  right: 2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.16);
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
    background: rgba(255, 255, 255, 0.26);
    transform: translateY(-1px);
  }

  &.is-on {
    background: #2d5f4e;
    border-color: #3f7a66;
    color: #fff;
    text-shadow: none;
  }
}

/* Three fr-weighted columns plus two divider tracks. gridStyle (inline)
   sets the actual fr values per session. */
.beginner-grid {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  gap: 1rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
  @media (max-width: 700px) {
    grid-template-columns: 1fr !important;
  }
}

.col-divider {
  align-self: stretch;
  border-radius: 3px;
  background: transparent;
  position: relative;
  cursor: default;
  pointer-events: none;
  opacity: 0;
  transition: background 0.15s, opacity 0.15s;

  .is-edit-mode & {
    cursor: col-resize;
    pointer-events: auto;
    opacity: 1;
  }

  &:hover,
  &.is-dragging {
    background: rgba(45, 95, 78, 0.40);
  }

  @media (max-width: 1024px) {
    display: none;
  }
}

.col-divider-grip {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 48px;
  background: rgba(255, 255, 255, 0.65);
  border-radius: 2px;
  transform: translate(-50%, -50%);
  opacity: 0.6;
  transition: opacity 0.15s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);

  .col-divider:hover &,
  .col-divider.is-dragging & {
    opacity: 1;
  }
}

.beginner-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 120px;
}

.widget-slot {
  /* Inherit any internal positioning from the child tile; this is just
     a draggable wrapper. */
  display: contents;
}

/* When in edit mode, the wrapper becomes a block so we can paint a
   dashed outline + grab cursor around each widget. display:contents
   would prevent that. */
.beginner-grid.is-edit-mode .widget-slot {
  display: block;
  outline: 2px dashed rgba(45, 95, 78, 0.55);
  outline-offset: 4px;
  border-radius: 22px;
  cursor: grab;

  &:active { cursor: grabbing; }
}

.beginner-grid.is-edit-mode .beginner-column.is-empty {
  outline: 2px dashed rgba(255, 255, 255, 0.3);
  outline-offset: -1px;
  border-radius: 18px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.04);
}

.column-empty-hint {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 1rem 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

/* Drag-feedback: the placeholder where the widget will land. */
.widget-ghost {
  opacity: 0.45;
  transform: scale(0.98);
  background: rgba(45, 95, 78, 0.10);
  border-radius: 20px;
  border: 2px dashed rgba(45, 95, 78, 0.45);
}

/* The apps grid adapts to whatever column it lands in via auto-fit
   instead of a fixed 3-col template, so it works whether it's in a
   narrow side column or a wider middle column. */
.widget-slot.is-apps {
  ::v-deep .home-section {
    /* Hide the upstream "Drag icons to sort." title row. */
    > .is-flex:first-child {
      display: none;
    }
  }

  ::v-deep .app-list {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)) !important;
    gap: 1rem;
  }

  ::v-deep .common-card .blur-background,
  ::v-deep .app-card .blur-background {
    background-color: rgba(255, 255, 255, 0.55) !important;
    background-image: none !important;
    backdrop-filter: blur(24px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
    border: 1px solid rgba(255, 255, 255, 0.4) !important;
    border-radius: 18px !important;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.7),
      0 8px 28px rgba(0, 0, 0, 0.18) !important;
  }

  ::v-deep .common-card,
  ::v-deep .common-card .info,
  ::v-deep .common-card a,
  ::v-deep .common-card a p {
    color: #1f2937 !important;
  }

  ::v-deep .common-card,
  ::v-deep .app-card {
    transition: transform 0.18s ease;

    &:hover {
      transform: translateY(-2px);

      .blur-background {
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.85),
          0 14px 36px rgba(0, 0, 0, 0.22) !important;
      }
    }
  }
}
</style>
