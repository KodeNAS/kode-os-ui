<template>
  <div class="beginner-dashboard">
    <div class="container">
      <div class="beginner-content">
        <h1 class="title is-1 has-text-white">
          {{ $t('Welcome to your pebble') }}
        </h1>
        <p class="subtitle has-text-white">
          {{ $t('Your apps and files will appear here.') }}
        </p>

        <!--
          Real content (curated app shelf, photo backup status, recent files,
          add-device wizard, family list) lands in subsequent commits — see
          Phase 2 Part B in the project brief.
        -->
      </div>

      <button
        type="button"
        class="mode-switcher has-text-white"
        @click="openModePanel"
      >
        {{ $t('Switch to Advanced mode') }}
      </button>
    </div>
  </div>
</template>

<script>
import InterfaceModePanel from '@/components/settings/InterfaceModePanel.vue'

export default {
  name: 'BeginnerDashboard',
  methods: {
    openModePanel() {
      this.$buefy.modal.open({
        parent: this,
        component: InterfaceModePanel,
        hasModalCard: true,
        trapFocus: true,
        scroll: 'keep',
        animation: 'zoom-in',
      })
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

.beginner-content {
  max-width: 720px;
  margin: 4rem auto 0;
  padding: 0 1.5rem;
  text-align: center;

  .title,
  .subtitle {
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
  }
}

.mode-switcher {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  backdrop-filter: blur(14px);
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.5);
  }
}
</style>
