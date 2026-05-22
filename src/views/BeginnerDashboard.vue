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
          <aside class="beginner-side">
            <RecentActivityTile />
            <FamilyTile />
            <AddDeviceTile />
          </aside>
          <main class="beginner-main">
            <AppSection ref="apps" :allowed-keys="pickedApps" />
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppSection from '@/components/Apps/AppSection.vue'
import RecentActivityTile from '@/components/beginner/RecentActivityTile.vue'
import FamilyTile from '@/components/beginner/FamilyTile.vue'
import AddDeviceTile from '@/components/beginner/AddDeviceTile.vue'

export default {
  name: 'BeginnerDashboard',
  components: {
    AppSection,
    RecentActivityTile,
    FamilyTile,
    AddDeviceTile,
  },
  data() {
    return {
      pickedApps: [],
    }
  },
  created() {
    this.loadPickedApps()
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
