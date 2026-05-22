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
            <template v-if="editMode">
              {{ $t('Drag any widget to any column.') }}
              <span class="subtitle-hint">{{ $t('Hold Shift while resizing to snap.') }}</span>
            </template>
            <template v-else>
              {{ $t('Your own private cloud, ready when you are.') }}
            </template>
          </p>
        </header>

        <LayoutSettingsPanel
          v-if="editMode"
          :column-count="columnCount"
          :templates="templates"
          :user-templates="userTemplates"
          @column-count="setColumnCount"
          @apply-template="applyTemplate"
          @save-current="saveCurrentAsTemplate"
          @delete-template="deleteUserTemplate"
        />

        <div ref="grid" class="beginner-grid" :class="{ 'is-edit-mode': editMode }" :style="gridStyle">
          <!-- 3 columns separated by 2 dividers (col1 | div | col2 | div |
               col3). Vuedraggable group "kode-widgets" connects all three
               so widgets (including the apps grid) drag freely between
               any column when edit mode is on. Dividers are click-and-drag
               only in edit mode; otherwise inert. -->
          <template v-for="(column, ci) in columns">
            <section
              :key="`col-${ci}`"
              class="beginner-column-wrap"
              :class="{ 'has-subcols': isSubdivided(column) }"
            >
              <!-- Subdivision header (edit mode only) — shows count + flatten -->
              <div v-if="editMode && isSubdivided(column)" class="subdivide-header">
                <span>{{ column.subCols.length }} {{ $t('inner columns') }}</span>
                <button
                  v-if="canFlattenColumn(ci)"
                  type="button"
                  class="subdivide-flatten"
                  :title="$t('Remove inner columns')"
                  @click="flattenColumn(ci)"
                >
                  <b-icon icon="close-outline" pack="casa" size="is-small" />
                </button>
              </div>

              <!-- Top: flat widgets section. Always rendered. When the
                   column is subdivided, this becomes the "above" zone and
                   the sub-columns render below. -->
              <draggable
                v-model="column.widgets"
                tag="div"
                class="beginner-column"
                :class="{ 'is-empty': column.widgets.length === 0, 'has-subcols-below': isSubdivided(column) }"
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
                  v-for="key in column.widgets"
                  :key="key"
                  class="widget-slot"
                  :class="slotClass(key)"
                  :data-tour="tourKeyFor(widgetType(key))"
                >
                  <FilesTile          v-if="widgetType(key) === 'files'" />
                  <RecentActivityTile v-else-if="widgetType(key) === 'recent'" />
                  <FamilyTile         v-else-if="widgetType(key) === 'family'" />
                  <AddDeviceTile      v-else-if="widgetType(key) === 'addDevice'" />
                  <ClockWidget        v-else-if="widgetType(key) === 'clock'" />
                  <WeatherWidget      v-else-if="widgetType(key) === 'weather'" />
                  <SearchWidget       v-else-if="widgetType(key) === 'search'" />
                  <SystemInfoWidget   v-else-if="widgetType(key) === 'sysInfo'" />
                  <NetworkStatusWidget v-else-if="widgetType(key) === 'network'" />
                  <AppsRunningWidget  v-else-if="widgetType(key) === 'appsRunning'" />
                  <TipsTricksWidget   v-else-if="widgetType(key) === 'tips'" />
                  <StorageWidget      v-else-if="widgetType(key) === 'storage'" />
                  <AppSection         v-else-if="widgetType(key) === 'apps'" ref="apps" :allowed-keys="pickedApps" />
                  <AppShortcutWidget  v-else-if="isAppShortcut(key)" :app-key="appKeyFor(key)" />

                  <button
                    v-if="editMode"
                    type="button"
                    class="widget-remove"
                    :aria-label="$t('Remove widget')"
                    @click.stop="removeWidget(key)"
                  >
                    <b-icon icon="close-outline" pack="casa" size="is-small" />
                  </button>
                </div>

                <!-- Empty top zone in edit mode: subdivide picker + drop hint. -->
                <div
                  v-if="editMode && column.widgets.length === 0 && !isSubdivided(column)"
                  class="column-empty-hint"
                >
                  <div class="empty-text">{{ $t('Drag a widget here') }}</div>
                  <div class="empty-or">{{ $t('or split into inner columns') }}</div>
                  <div class="empty-subdivide-options">
                    <button
                      v-for="n in [2, 3, 4]"
                      :key="n"
                      type="button"
                      class="empty-subdivide-btn"
                      @click="subdivideColumn(ci, n)"
                    >
                      <b-icon icon="plus-outline" pack="casa" size="is-small" />
                      <span>{{ n }}</span>
                    </button>
                  </div>
                </div>
              </draggable>

              <!-- Sub-column grid renders BELOW the flat widgets when the
                   column is subdivided. Both halves accept widget drops via
                   the shared "kode-widgets" group. -->
              <div
                v-if="isSubdivided(column)"
                class="beginner-subcol-grid"
                :style="subColGridStyle(column)"
              >
                <draggable
                  v-for="(sub, si) in column.subCols"
                  :key="`col-${ci}-sub-${si}`"
                  v-model="column.subCols[si]"
                  tag="div"
                  class="beginner-subcol"
                  :class="{ 'is-empty': sub.length === 0 }"
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
                    v-for="key in sub"
                    :key="key"
                    class="widget-slot"
                    :class="slotClass(key)"
                  >
                    <FilesTile          v-if="widgetType(key) === 'files'" />
                    <RecentActivityTile v-else-if="widgetType(key) === 'recent'" />
                    <FamilyTile         v-else-if="widgetType(key) === 'family'" />
                    <AddDeviceTile      v-else-if="widgetType(key) === 'addDevice'" />
                    <ClockWidget        v-else-if="widgetType(key) === 'clock'" />
                    <WeatherWidget      v-else-if="widgetType(key) === 'weather'" />
                    <SearchWidget       v-else-if="widgetType(key) === 'search'" />
                    <SystemInfoWidget   v-else-if="widgetType(key) === 'sysInfo'" />
                    <NetworkStatusWidget v-else-if="widgetType(key) === 'network'" />
                    <AppsRunningWidget  v-else-if="widgetType(key) === 'appsRunning'" />
                    <TipsTricksWidget   v-else-if="widgetType(key) === 'tips'" />
                    <StorageWidget      v-else-if="widgetType(key) === 'storage'" />
                    <AppSection         v-else-if="widgetType(key) === 'apps'" :allowed-keys="pickedApps" />
                    <AppShortcutWidget  v-else-if="isAppShortcut(key)" :app-key="appKeyFor(key)" />

                    <button
                      v-if="editMode"
                      type="button"
                      class="widget-remove"
                      :aria-label="$t('Remove widget')"
                      @click.stop="removeWidget(key)"
                    >
                      <b-icon icon="close-outline" pack="casa" size="is-small" />
                    </button>
                  </div>

                  <div v-if="editMode && sub.length === 0" class="subcol-empty-hint">
                    {{ $t('Drop here') }}
                  </div>
                </draggable>
              </div>

              <!-- Add inner columns affordance when the column has widgets
                   but isn't subdivided yet. Lets the user mix flat top +
                   nested bottom without first having to empty the column. -->
              <div
                v-if="editMode && !isSubdivided(column) && column.widgets.length > 0"
                class="add-inner-row"
              >
                <span class="add-inner-label">{{ $t('Add inner columns below:') }}</span>
                <button
                  v-for="n in [2, 3, 4]"
                  :key="n"
                  type="button"
                  class="empty-subdivide-btn"
                  @click="subdivideColumn(ci, n)"
                >
                  <b-icon icon="plus-outline" pack="casa" size="is-small" />
                  <span>{{ n }}</span>
                </button>
              </div>
            </section>

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

        <!-- Big "+ Add widget" button, visible only when edit mode is on. -->
        <div v-if="editMode" class="add-widget-row">
          <button type="button" class="add-widget-cta" @click="openAddWidget">
            <b-icon icon="plus-outline" pack="casa" size="is-medium" />
            <span>{{ $t('Add widget') }}</span>
          </button>
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
import ClockWidget from '@/components/beginner/ClockWidget.vue'
import WeatherWidget from '@/components/beginner/WeatherWidget.vue'
import SearchWidget from '@/components/beginner/SearchWidget.vue'
import SystemInfoWidget from '@/components/beginner/SystemInfoWidget.vue'
import AppShortcutWidget from '@/components/beginner/AppShortcutWidget.vue'
import NetworkStatusWidget from '@/components/beginner/NetworkStatusWidget.vue'
import AppsRunningWidget from '@/components/beginner/AppsRunningWidget.vue'
import TipsTricksWidget from '@/components/beginner/TipsTricksWidget.vue'
import StorageWidget from '@/components/beginner/StorageWidget.vue'
import AddWidgetPanel from '@/components/beginner/AddWidgetPanel.vue'
import LayoutSettingsPanel from '@/components/beginner/LayoutSettingsPanel.vue'
import { maybeStartEasyTourOnce } from '@/service/tour'

const LAYOUT_KEY = 'kode_columns_layout_v2'
const WEIGHTS_KEY = 'kode_columns_weights_v1'
const COLCOUNT_KEY = 'kode_column_count_v1'
const USER_TEMPLATES_KEY = 'kode_user_templates_v1'

// Built-in templates. Names match the four the user requested
// (Essential 1, Minimalist 1, Simple 1, Full 1) — designed to span a
// useful range from "barely there" to "everything".
const TEMPLATES = [
  {
    key: 'essential-1',
    name: 'Essential 1',
    description: 'Files, recent activity, apps, and family.',
    cols: [
      ['files', 'recent'],
      ['apps'],
      ['family', 'addDevice'],
    ],
  },
  {
    key: 'minimalist-1',
    name: 'Minimalist 1',
    description: 'Just a clock and your apps.',
    cols: [
      ['clock'],
      ['apps'],
    ],
  },
  {
    key: 'simple-1',
    name: 'Simple 1',
    description: 'Clock + weather alongside apps and files.',
    cols: [
      ['clock', 'weather'],
      ['apps'],
      ['files', 'recent'],
    ],
  },
  {
    key: 'full-1',
    name: 'Full 1',
    description: 'Everything turned on across four columns.',
    cols: [
      ['clock', 'weather', 'sysInfo'],
      ['files', 'recent', 'network'],
      ['apps'],
      ['storage', 'appsRunning', 'family', 'addDevice', 'tips'],
    ],
  },
]
// Generic widget keys. Per-app shortcuts use the `app:<id>` prefix and
// are validated separately. App shortcuts can be duplicated across the
// dashboard by appending a "#N" instance suffix (`app:immich#1`,
// `app:immich#2`, etc.) — generated by addWidget when a duplicate is
// requested.
const ALL_WIDGETS = [
  'files', 'recent', 'apps', 'family', 'addDevice',
  'clock', 'weather', 'search', 'sysInfo',
  // Network now combines what was 'network' + 'ipAddress' into a single
  // tile. Legacy 'ipAddress' / 'network' keys are still accepted by the
  // loader and silently mapped to 'network' so existing saved layouts
  // round-trip.
  'network', 'appsRunning', 'tips', 'storage',
]
const KNOWN_APP_KEYS = ['immich', 'jellyfin', 'filebrowser', 'pihole', 'homeassistant']

function widgetTypeOf(k) {
  if (typeof k !== 'string') return ''
  return k.split('#')[0]
}

function isValidWidgetKey(k) {
  const type = widgetTypeOf(k)
  if (ALL_WIDGETS.includes(type)) return true
  // Legacy keys from prior versions, silently accepted (loader migrates).
  if (type === 'ipAddress') return true
  if (type.startsWith('app:')) {
    return KNOWN_APP_KEYS.includes(type.slice(4))
  }
  return false
}

function normalizeWidgetKey(k) {
  // Map deprecated keys to their current equivalents so saved layouts
  // keep working after consolidation.
  const t = widgetTypeOf(k)
  if (t === 'ipAddress') return 'network'
  return k
}

// Wrap a column shape into the canonical { widgets, subCols } form. Accepts
// either a legacy plain string[] OR the new object shape, normalizing every
// widget key + filtering invalid entries along the way.
function normalizeColumn(col) {
  // Legacy array shape — wrap.
  if (Array.isArray(col)) {
    const widgets = []
    for (const k of col) {
      if (!isValidWidgetKey(k)) continue
      const n = normalizeWidgetKey(k)
      if (!widgets.includes(n)) widgets.push(n)
    }
    return { widgets, subCols: null }
  }
  if (col && typeof col === 'object') {
    const widgets = []
    for (const k of (Array.isArray(col.widgets) ? col.widgets : [])) {
      if (!isValidWidgetKey(k)) continue
      const n = normalizeWidgetKey(k)
      if (!widgets.includes(n)) widgets.push(n)
    }
    let subCols = null
    if (Array.isArray(col.subCols) && col.subCols.length >= 2 && col.subCols.length <= 4) {
      subCols = col.subCols.map(sub => {
        const out = []
        for (const k of (Array.isArray(sub) ? sub : [])) {
          if (!isValidWidgetKey(k)) continue
          const n = normalizeWidgetKey(k)
          if (!out.includes(n)) out.push(n)
        }
        return out
      })
    }
    return { widgets: subCols ? [] : widgets, subCols }
  }
  return { widgets: [], subCols: null }
}

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
const SNAP_STEP = 0.25  // Shift-held: round each affected weight to this fr step

export default {
  name: 'BeginnerDashboard',
  components: {
    draggable,
    AppSection,
    RecentActivityTile,
    FamilyTile,
    AddDeviceTile,
    FilesTile,
    ClockWidget,
    WeatherWidget,
    SearchWidget,
    SystemInfoWidget,
    AppShortcutWidget,
    NetworkStatusWidget,
    AppsRunningWidget,
    TipsTricksWidget,
    StorageWidget,
    LayoutSettingsPanel,
  },
  data() {
    return {
      pickedApps: [],
      columnCount: this.loadColumnCount(),
      columns: this.loadLayout(),
      colWeights: this.loadWeights(),
      activeDivider: -1,
      editMode: false,
      templates: TEMPLATES,
      userTemplates: this.loadUserTemplates(),
    }
  },
  computed: {
    gridStyle() {
      // Build "${w0}fr 6px ${w1}fr 6px ${w2}fr ..." for any column count.
      const parts = []
      this.colWeights.forEach((w, i) => {
        if (i > 0) parts.push(`${DIVIDER_PX}px`)
        parts.push(`${w}fr`)
      })
      return {
        gridTemplateColumns: parts.join(' '),
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

    loadColumnCount() {
      try {
        const raw = parseInt(localStorage.getItem(COLCOUNT_KEY), 10)
        if ([2, 3, 4].includes(raw)) return raw
      } catch (e) { /* ignore */ }
      return 3
    },
    loadLayout() {
      try {
        const raw = localStorage.getItem(LAYOUT_KEY)
        if (!raw) return this.expandLayoutTo(DEFAULT_LAYOUT, this.columnCount || 3)
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed) || parsed.length < 2 || parsed.length > 4) {
          return this.expandLayoutTo(DEFAULT_LAYOUT, this.columnCount || 3)
        }
        // Normalize each column into { widgets, subCols }. Handles both
        // the legacy string[] shape and the new object shape so existing
        // saved layouts round-trip without loss.
        const cleaned = parsed.map(normalizeColumn)
        // Add any default generic widget that's missing (excluding apps:
        // shortcuts which are explicit opt-in). Drop missing into the
        // first non-subdivided column; if column 0 is subdivided, drop
        // into its first sub.
        const present = new Set()
        this.collectPresentKeys(cleaned, present)
        const missing = ALL_WIDGETS.filter(k => !present.has(k))
        if (missing.length > 0) {
          const target = cleaned[0]
          if (target.subCols) target.subCols[0].push(...missing)
          else target.widgets.push(...missing)
        }
        return cleaned
      } catch (e) {
        return this.expandLayoutTo(DEFAULT_LAYOUT, this.columnCount || 3)
      }
    },
    collectPresentKeys(columns, set) {
      for (const col of columns) {
        if (col.subCols) {
          for (const sub of col.subCols) {
            for (const k of sub) set.add(k)
          }
        } else {
          for (const k of col.widgets) set.add(k)
        }
      }
    },
    isSubdivided(column) {
      return !!(column && Array.isArray(column.subCols) && column.subCols.length >= 2)
    },
    subColGridStyle(column) {
      const n = column.subCols ? column.subCols.length : 1
      return { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }
    },
    subdivideColumn(ci, n) {
      const col = this.columns[ci]
      if (!col || col.subCols) return
      // Preserve any flat widgets already in the column — they keep
      // their place at the top, the new sub-columns sit underneath.
      const next = [...this.columns]
      next[ci] = {
        widgets: [...col.widgets],
        subCols: Array.from({ length: n }, () => []),
      }
      this.columns = next
      this.saveLayout()
    },
    canFlattenColumn(ci) {
      const col = this.columns[ci]
      if (!col || !col.subCols) return false
      // Allow flatten if all sub-columns are empty OR show it always +
      // gather widgets when flattening (chosen: always show, gather all).
      return true
    },
    flattenColumn(ci) {
      const col = this.columns[ci]
      if (!col || !col.subCols) return
      const gathered = col.subCols.reduce((acc, sub) => acc.concat(sub), [])
      const next = [...this.columns]
      next[ci] = { widgets: gathered, subCols: null }
      this.columns = next
      this.saveLayout()
    },
    expandLayoutTo(layout, targetCount) {
      // Accepts either the legacy string[][] or the new { widgets, subCols }
      // shape. Returns the new shape adjusted to targetCount outer columns.
      const copy = layout.map(normalizeColumn)
      if (copy.length === targetCount) return copy
      if (copy.length > targetCount) {
        // Merge extras into the last kept column. Tail widgets gathered
        // from both flat columns and sub-columns.
        const kept = copy.slice(0, targetCount)
        const tail = []
        for (const col of copy.slice(targetCount)) {
          if (col.subCols) {
            for (const sub of col.subCols) tail.push(...sub)
          } else {
            tail.push(...col.widgets)
          }
        }
        const lastKept = kept[targetCount - 1]
        if (lastKept.subCols) lastKept.subCols[0].push(...tail)
        else lastKept.widgets.push(...tail)
        return kept
      }
      // Expand: add empty columns at the end.
      while (copy.length < targetCount) copy.push({ widgets: [], subCols: null })
      return copy
    },
    saveLayout() {
      try {
        localStorage.setItem(LAYOUT_KEY, JSON.stringify(this.columns))
      } catch (e) { /* ignore quota / disabled storage */ }
    },
    loadWeights() {
      try {
        const raw = localStorage.getItem(WEIGHTS_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length === this.columnCount) {
            return parsed.map(w => {
              const n = Number(w)
              if (!isFinite(n)) return 1
              return Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, n))
            })
          }
        }
      } catch (e) { /* fall through */ }
      // Default to equal weights for whatever column count we have.
      return Array(this.columnCount || 3).fill(1)
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
      let left = this._dragStartWeights[i] + deltaFr
      let right = this._dragStartWeights[i + 1] - deltaFr

      // Shift held: snap the dragged divider to nearest SNAP_STEP fr
      // multiple. Preserve the affected pair's total weight so the third
      // column stays put.
      if (e.shiftKey) {
        const pairTotal = this._dragStartWeights[i] + this._dragStartWeights[i + 1]
        left = Math.round(left / SNAP_STEP) * SNAP_STEP
        right = pairTotal - left
      }

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
    setColumnCount(n) {
      if (![2, 3, 4].includes(n) || n === this.columnCount) return
      this.columns = this.expandLayoutTo(this.columns, n)
      this.colWeights = Array(n).fill(1)
      this.columnCount = n
      try { localStorage.setItem(COLCOUNT_KEY, String(n)) } catch (e) { /* ignore */ }
      this.saveLayout()
      this.saveWeights()
    },
    applyTemplate(key) {
      const t = TEMPLATES.find(x => x.key === key) || this.userTemplates.find(x => x.key === key)
      if (!t) return
      // Normalize template columns through normalizeColumn so old-style
      // string[][] templates and new-style object templates both work.
      const next = t.cols.map(normalizeColumn)
      this.columns = next
      this.columnCount = next.length
      this.colWeights = Array.isArray(t.weights) && t.weights.length === next.length
        ? t.weights.map(w => Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, Number(w) || 1)))
        : Array(next.length).fill(1)
      try { localStorage.setItem(COLCOUNT_KEY, String(next.length)) } catch (e) { /* ignore */ }
      this.saveLayout()
      this.saveWeights()
    },
    loadUserTemplates() {
      try {
        const raw = localStorage.getItem(USER_TEMPLATES_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter(t => t && t.key && Array.isArray(t.cols))
      } catch (e) {
        return []
      }
    },
    saveUserTemplates() {
      try {
        localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(this.userTemplates))
      } catch (e) { /* ignore */ }
    },
    saveCurrentAsTemplate() {
      this.$buefy.dialog.prompt({
        title: this.$t('Save layout'),
        message: this.$t('Give this layout a name. You\'ll find it under "Your layouts" in the Layouts menu.'),
        inputAttrs: { placeholder: this.$t('My layout'), maxlength: 40 },
        trapFocus: true,
        confirmText: this.$t('Save'),
        cancelText: this.$t('Cancel'),
        onConfirm: (name) => {
          const trimmed = String(name || '').trim()
          if (!trimmed) return
          // Unique key. Slug + short id keeps it stable across reloads.
          const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 24) || 'layout'
          const key = `user-${slug}-${Date.now().toString(36).slice(-4)}`
          this.userTemplates = [
            ...this.userTemplates,
            {
              key,
              name: trimmed,
              description: '',
              cols: this.columns.map(c => [...c]),
              weights: [...this.colWeights],
            },
          ]
          this.saveUserTemplates()
          this.$buefy.toast.open({
            message: `${this.$t('Saved')} "${trimmed}"`,
            type: 'is-success',
            position: 'is-top',
            duration: 2500,
          })
        },
      })
    },
    deleteUserTemplate(key) {
      this.userTemplates = this.userTemplates.filter(t => t.key !== key)
      this.saveUserTemplates()
    },
    placedWidgets() {
      // Flat list of every widget key currently in any column, including
      // those nested inside sub-columns.
      const acc = []
      for (const col of this.columns) {
        if (col.subCols) {
          for (const sub of col.subCols) acc.push(...sub)
        } else {
          acc.push(...col.widgets)
        }
      }
      return acc
    },
    openAddWidget() {
      this.$buefy.modal.open({
        parent: this,
        component: AddWidgetPanel,
        hasModalCard: true,
        trapFocus: true,
        scroll: 'keep',
        animation: 'zoom-in',
        props: { placed: this.placedWidgets() },
        events: { 'add-widget': (key) => this.addWidget(key) },
      })
    },
    addWidget(key) {
      const placed = this.placedWidgets()
      let toInsert = key
      if (this.isAppShortcut(key)) {
        let n = 1
        while (placed.includes(toInsert)) {
          toInsert = `${key}#${n++}`
        }
      } else if (placed.includes(key)) {
        return
      }
      // Pick the smallest target across outer + sub columns. If the
      // smallest target is a subdivided column's sub, drop the widget
      // into that sub-column directly.
      let bestIdx = 0
      let bestSubIdx = -1
      let bestSize = Infinity
      this.columns.forEach((col, ci) => {
        if (col.subCols) {
          col.subCols.forEach((sub, si) => {
            if (sub.length < bestSize) {
              bestSize = sub.length
              bestIdx = ci
              bestSubIdx = si
            }
          })
        } else {
          if (col.widgets.length < bestSize) {
            bestSize = col.widgets.length
            bestIdx = ci
            bestSubIdx = -1
          }
        }
      })
      const next = this.columns.map(c => ({
        widgets: [...c.widgets],
        subCols: c.subCols ? c.subCols.map(s => [...s]) : null,
      }))
      const target = next[bestIdx]
      if (bestSubIdx >= 0 && target.subCols) {
        target.subCols[bestSubIdx] = [...target.subCols[bestSubIdx], toInsert]
      } else {
        target.widgets = [...target.widgets, toInsert]
      }
      this.columns = next
      this.saveLayout()
    },
    removeWidget(key) {
      const next = this.columns.map(col => ({
        widgets: col.widgets.filter(k => k !== key),
        subCols: col.subCols ? col.subCols.map(sub => sub.filter(k => k !== key)) : null,
      }))
      this.columns = next
      this.saveLayout()
    },
    tourKeyFor(key) {
      return ({ files: 'files', recent: 'recent', family: 'family', addDevice: 'adddevice', apps: 'apps' })[key]
    },
    widgetType(key) {
      return widgetTypeOf(key)
    },
    isAppShortcut(key) {
      return this.widgetType(key).startsWith('app:')
    },
    appKeyFor(key) {
      const type = this.widgetType(key)
      return type.startsWith('app:') ? type.slice(4) : ''
    },
    slotClass(key) {
      // Convert "app:immich" / "app:immich#1" into "is-app-immich" so
      // scoped CSS rules target the right icon regardless of instance.
      return this.isAppShortcut(key) ? `is-app-${this.appKeyFor(key)}` : `is-${this.widgetType(key)}`
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
  max-width: 1480px;
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

.subtitle-hint {
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 0.8125rem;
  opacity: 0.72;
  padding: 1px 8px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
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
  max-width: 1480px;
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

.beginner-column-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 120px;
}

.beginner-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 120px;
}

/* Header bar above a subdivided column. Only visible in edit mode. */
.subdivide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.78);
  padding: 0 0.25rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

.subdivide-flatten {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.85);
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: rgba(176, 74, 74, 0.45);
    border-color: rgba(176, 74, 74, 0.6);
  }
}

/* The inner grid that holds 2–4 sub-columns. */
.beginner-subcol-grid {
  display: grid;
  gap: 0.75rem;
  align-items: start;
  margin-top: 0.5rem;
}

/* Mix-mode: top column also has sub-columns below. Shrink the bottom
   gap so the two halves visually connect rather than feeling detached. */
.beginner-column.has-subcols-below {
  gap: 0.5rem;
}

.beginner-column.has-subcols-below.is-empty {
  /* When subdivided but with no top widgets, suppress the empty outline
     since the column isn't actually empty visually — subcols carry the
     content. */
  outline: none !important;
  background: none !important;
  padding: 0 !important;
}

.add-inner-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.4rem;
  padding: 0.4rem 0;
}

.add-inner-label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.65);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  flex: 1;
}

.beginner-subcol {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 80px;
}

.beginner-grid.is-edit-mode .beginner-subcol.is-empty {
  outline: 2px dashed rgba(255, 255, 255, 0.28);
  outline-offset: -1px;
  border-radius: 14px;
  padding: 0.85rem 0.5rem;
  background: rgba(255, 255, 255, 0.03);
}

.subcol-empty-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
  padding: 0.5rem 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

/* Subdivide picker shown inside an empty outer column in edit mode. */
.empty-subdivide-options {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.6rem;
}

.empty-subdivide-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.15s;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);

  &:hover {
    background: rgba(255, 255, 255, 0.26);
    border-color: rgba(255, 255, 255, 0.55);
    transform: translateY(-1px);
  }
}

.empty-text {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

.empty-or {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
  margin-top: 0.5rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

.widget-slot {
  position: relative;
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

/* Small × in the top-right of each widget while editing — one-tap remove. */
.widget-remove {
  display: none;
  position: absolute;
  top: -10px;
  right: -10px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #b04a4a;
  color: #fff;
  border: 2px solid #fff;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 10;
  padding: 0;

  &:hover { background: #d04a51; }
}

.beginner-grid.is-edit-mode .widget-remove {
  display: inline-flex;
}

/* Big + Add widget CTA below the grid, visible only in edit mode. */
.add-widget-row {
  max-width: 1480px;
  margin: 1.5rem auto 0;
  padding: 0 2rem;
  display: flex;
  justify-content: center;
}

.add-widget-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.85rem 1.5rem;
  background: rgba(255, 255, 255, 0.18);
  border: 2px dashed rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
  transition: background 0.15s, border-color 0.15s, transform 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.28);
    border-color: rgba(255, 255, 255, 0.7);
    transform: translateY(-1px);
  }
}

.beginner-grid.is-edit-mode .beginner-column.is-empty {
  outline: 2px dashed rgba(255, 255, 255, 0.3);
  outline-offset: -1px;
  border-radius: 18px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.04);
}

.column-empty-hint {
  padding: 0.5rem 0;
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
