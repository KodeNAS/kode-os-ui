<template>
  <div class="beginner-dashboard">
    <div class="beginner-overlay">
      <div class="container">
        <header class="beginner-hero">
          <h1 class="title is-2 has-text-white">
            {{ $t('Welcome to your pebble') }}
          </h1>
          <p class="subtitle is-5 has-text-white">
            {{ $t('Your own private cloud, ready when you are.') }}
          </p>
        </header>

        <div class="beginner-grid">
          <!-- Vuedraggable distinguishes a click from a drag by movement
               threshold (default 0px → any movement starts a drag, but a
               clean click still fires the underlying handler). No explicit
               handle so the whole tile is grabbable. -->
          <draggable
            v-model="tileOrder"
            tag="aside"
            class="beginner-side"
            :animation="200"
            :delay="80"
            :delay-on-touch-only="true"
            :touch-start-threshold="3"
            ghost-class="tile-ghost"
            @end="saveTileOrder"
          >
            <component
              v-for="key in tileOrder"
              :key="key"
              :is="tileMap[key]"
              :data-tour="tourKeyFor(key)"
            />
          </draggable>
          <main class="beginner-main" data-tour="apps">
            <AppSection ref="apps" :allowed-keys="pickedApps">
              <template #prepend>
                <div
                  class="files-app-card"
                  :title="hintModeOn ? hintFilesLabel : null"
                  @click="openFiles"
                >
                  <span v-if="hintModeOn" class="kode-hint">{{ hintFilesLabel }}</span>
                  <span class="files-app-icon">
                    <b-icon icon="folder" pack="casa" size="is-large" />
                  </span>
                  <span class="files-app-name">{{ $t('Files') }}</span>
                </div>
              </template>
            </AppSection>
          </main>
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
import { maybeStartEasyTourOnce } from '@/service/tour'
import { hintMode } from '@/mixins/hintMode'

const ORDER_KEY = 'kode_tile_order'
// Files is rendered as an app-grid card now, not a left-rail tile.
const DEFAULT_ORDER = ['recent', 'family', 'addDevice']

export default {
  name: 'BeginnerDashboard',
  mixins: [hintMode],
  inject: {
    homeShowFiles: { default: null },
  },
  components: {
    draggable,
    AppSection,
    RecentActivityTile,
    FamilyTile,
    AddDeviceTile,
  },
  data() {
    return {
      pickedApps: [],
      tileOrder: this.loadTileOrder(),
      tileMap: {
        recent: 'RecentActivityTile',
        family: 'FamilyTile',
        addDevice: 'AddDeviceTile',
      },
    }
  },
  computed: {
    hintFilesLabel() {
      return this.$t('Browse everything on your pebble — opens the built-in file browser.')
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
      // kode_first_boot was written by the wizard's finish handler. If it
      // doesn't exist, leave pickedApps empty so the dock falls back to
      // showing every installed app (Advanced-style behaviour).
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
    loadTileOrder() {
      try {
        const raw = localStorage.getItem(ORDER_KEY)
        if (!raw) return [...DEFAULT_ORDER]
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return [...DEFAULT_ORDER]
        // Drop unknown keys + append any new defaults the saved order is
        // missing (so adding tiles in a future release doesn't strand the
        // user with their old layout).
        const filtered = parsed.filter(k => DEFAULT_ORDER.includes(k))
        const missing = DEFAULT_ORDER.filter(k => !filtered.includes(k))
        return [...filtered, ...missing]
      } catch (e) {
        return [...DEFAULT_ORDER]
      }
    },
    saveTileOrder() {
      try {
        localStorage.setItem(ORDER_KEY, JSON.stringify(this.tileOrder))
      } catch (e) { /* quota / disabled storage — accept loss */ }
    },
    tourKeyFor(key) {
      return ({ recent: 'recent', family: 'family', addDevice: 'adddevice' })[key]
    },
    openFiles() {
      if (typeof this.homeShowFiles === 'function') {
        this.homeShowFiles('/DATA')
      }
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

/* The global wallpaper scrim in App.vue already darkens the background
   uniformly; this overlay is now a transparent wrapper that just holds
   layout padding. Kept as a hook in case we want a per-mode tint later. */
.beginner-overlay {
  min-height: 100%;
  padding: 2.5rem 0 6rem;
}

.beginner-hero {
  max-width: 1180px;
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

/* Two-column layout: narrow side rail on the left, app grid on the right. */
.beginner-grid {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(260px, 320px) 1fr;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.beginner-side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: sticky;
  top: 1rem;

  @media (max-width: 900px) {
    position: static;
  }
}

/* Drag-feedback: the placeholder where the tile will land. */
.tile-ghost {
  opacity: 0.45;
  transform: scale(0.98);
  background: rgba(45, 95, 78, 0.10);
  border-radius: 20px;
  border: 2px dashed rgba(45, 95, 78, 0.45);
}

/* Files card — sits as the first item inside AppSection's grid via the
   #prepend slot so it appears alongside Immich/Jellyfin/etc, sized and
   styled to match an upstream AppCard (1:1 aspect, liquid-glass). */
.files-app-card {
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 18px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      0 14px 36px rgba(0, 0, 0, 0.22);
  }
}

.files-app-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2d5f4e, #3f7a66);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(45, 95, 78, 0.32);
}

.files-app-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  text-align: center;
}

/* CSS-only hint bubble — shown on hover only when the host element is in
   hint-mode (gated by the v-if on the consumer). Sits above the tile, no
   browser-tooltip delay. */
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

.files-app-card:hover .kode-hint,
.kode-tile:hover .kode-hint {
  opacity: 1;
}

/* Override the upstream AppSection grid: force 3 columns in Easy mode and
   give each app card the same liquid-glass treatment as the side tiles. */
.beginner-main {
  ::v-deep .home-section {
    /* Hide the upstream "Drag icons to sort." title row — Beginner doesn't
       need the editorial chrome. The + dropdown stays but the title bar
       collapses. */
    > .is-flex:first-child {
      display: none;
    }
  }

  ::v-deep .app-list {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 1rem;

    @media (max-width: 600px) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }

  /* The visible card background comes from an inner .blur-background div
     defined in assets/scss/common/_others.scss, NOT from .common-card.
     Override that inner element so the glass actually lands on the card. */
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

  /* common-card paints white text — flip to dark for legibility on the glass. */
  ::v-deep .common-card,
  ::v-deep .common-card .info,
  ::v-deep .common-card a,
  ::v-deep .common-card a p {
    color: #1f2937 !important;
  }

  /* Lift-on-hover on the wrapper. */
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
