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

        <section class="beginner-apps">
          <AppSection ref="apps" />
        </section>

        <section class="beginner-tiles columns is-variable is-4 is-multiline">
          <div class="column is-two-thirds-tablet is-full-mobile">
            <RecentActivityTile />
          </div>
          <div class="column is-one-third-tablet is-full-mobile">
            <FamilyTile />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import AppSection from '@/components/Apps/AppSection.vue'
import RecentActivityTile from '@/components/beginner/RecentActivityTile.vue'
import FamilyTile from '@/components/beginner/FamilyTile.vue'

export default {
  name: 'BeginnerDashboard',
  components: {
    AppSection,
    RecentActivityTile,
    FamilyTile,
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

/* Brief §7 — dark scrim so white text reads on the misty wallpaper. */
.beginner-overlay {
  min-height: 100%;
  background: linear-gradient(180deg, rgba(15, 25, 30, 0.30), rgba(15, 25, 30, 0.55));
  padding: 2.5rem 0 6rem;
}

.beginner-hero {
  max-width: 760px;
  margin: 0 auto 2.5rem;
  padding: 0 1.5rem;
  text-align: center;

  .title,
  .subtitle {
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
  }

  .subtitle {
    opacity: 0.92;
  }
}

.beginner-apps {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.beginner-tiles {
  max-width: 1100px;
  margin: 2rem auto 0;
  padding: 0 1.5rem;
}
</style>
