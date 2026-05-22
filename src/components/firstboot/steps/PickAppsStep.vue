<template>
  <div class="fb-step pick-apps-step">
    <h2 class="step-title">{{ $t('Pick the apps you want') }}</h2>
    <p class="step-intro">
      {{ $t('We\'ll set up each one and show you how to use it. You can always add more later.') }}
    </p>

    <div class="apps-grid">
      <button
        v-for="app in catalog"
        :key="app.key"
        type="button"
        class="app-option"
        :class="{ 'is-selected': isSelected(app.key) }"
        @click="toggle(app.key)"
      >
        <span class="app-option-icon" :class="`is-${app.key}`">
          <b-icon :icon="app.icon" pack="casa" size="is-medium" />
        </span>
        <span class="app-option-text">
          <span class="app-option-title">{{ app.title }}</span>
          <span class="app-option-desc">{{ app.desc }}</span>
        </span>
        <span class="app-option-check">
          <b-icon
            v-if="isSelected(app.key)"
            icon="check"
            pack="casa"
            size="is-small"
          />
        </span>
      </button>
    </div>

    <div class="step-actions">
      <b-button
        rounded
        type="is-primary"
        :disabled="picked.length === 0"
        @click="$emit('next', { apps: picked })"
      >
        {{ picked.length === 0 ? $t('Pick at least one') : $t('Continue with {n} apps', { n: picked.length }) }}
      </b-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PickAppsStep',
  data() {
    return {
      picked: ['immich', 'jellyfin', 'filebrowser'],
      catalog: [
        {
          key: 'immich',
          icon: 'image',
          title: this.$t('Immich'),
          desc: this.$t('Photo & video backup from your phone.'),
        },
        {
          key: 'jellyfin',
          icon: 'video',
          title: this.$t('Jellyfin'),
          desc: this.$t('Stream movies and music to your TV.'),
        },
        {
          key: 'filebrowser',
          icon: 'folder',
          title: this.$t('File Browser'),
          desc: this.$t('Access your pebble\'s files from any browser.'),
        },
        {
          key: 'pihole',
          icon: 'shield-outline',
          title: this.$t('Pi-hole'),
          desc: this.$t('Block ads and trackers across your whole network.'),
        },
        {
          key: 'homeassistant',
          icon: 'home-outline',
          title: this.$t('Home Assistant'),
          desc: this.$t('Smart-home hub for lights, thermostats, and sensors. (Advanced)'),
        },
      ],
    }
  },
  methods: {
    isSelected(key) {
      return this.picked.includes(key)
    },
    toggle(key) {
      const i = this.picked.indexOf(key)
      if (i >= 0) this.picked.splice(i, 1)
      else this.picked.push(key)
    },
  },
}
</script>

<style lang="scss" scoped>
.step-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
  margin-bottom: 0.5rem;
}

.step-intro {
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);
  margin-bottom: 1.25rem;
}

.apps-grid {
  display: grid;
  gap: 0.6rem;
  grid-template-columns: 1fr;
  margin-bottom: 1.5rem;
}

.app-option {
  display: grid;
  grid-template-columns: 44px 1fr 20px;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  text-align: left;
  background: rgba(255, 255, 255, 0.7);
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover { border-color: rgba(45, 95, 78, 0.4); }
  &.is-selected {
    border-color: #2d5f4e;
    background: rgba(45, 95, 78, 0.10);
  }
}

.app-option-icon {
  width: 44px; height: 44px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;

  &.is-immich        { background: linear-gradient(135deg, #b45f6d, #d97e8c); }
  &.is-jellyfin      { background: linear-gradient(135deg, #5e6ad2, #7c8af0); }
  &.is-filebrowser   { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }
  &.is-pihole        { background: linear-gradient(135deg, #a83239, #d04a51); }
  &.is-homeassistant { background: linear-gradient(135deg, #1e4a72, #2d6aa6); }
}

.app-option-text { display: flex; flex-direction: column; min-width: 0; }
.app-option-title { font-size: 0.9375rem; font-weight: 500; color: #1f2937; }
.app-option-desc { font-size: 0.8125rem; color: rgba(0, 0, 0, 0.6); }

.app-option-check {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: #2d5f4e;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;

  .is-selected & { opacity: 1; }
}

.step-actions { display: flex; justify-content: flex-end; }
</style>
