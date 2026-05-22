<template>
  <div class="fb-step pick-apps-step">
    <h2 class="step-title">{{ $t('Pick the apps you want') }}</h2>
    <p class="step-intro">
      {{ $t('Hover any app for the full description. You can always add more later.') }}
    </p>

    <div class="apps-grid">
      <div
        v-for="app in catalog"
        :key="app.key"
        class="app-option-wrap"
      >
        <button
          type="button"
          class="app-option"
          :class="{ 'is-selected': isSelected(app.key) }"
          @click="toggle(app.key)"
        >
          <span class="app-option-icon" :class="`is-${app.key}`">
            <b-icon :icon="app.icon" pack="casa" size="is-medium" />
          </span>
          <span class="app-option-text">
            <span class="app-option-title-row">
              <span class="app-option-title">{{ app.title }}</span>
              <span class="app-option-difficulty" :title="`${app.difficulty}/5 difficulty`">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="star"
                  :class="{ 'is-filled': i <= app.difficulty }"
                >★</span>
              </span>
            </span>
            <span class="app-option-desc">{{ app.tagline }}</span>
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

        <!-- Inline expanding detail panel — pushes following cards down
             with a smooth max-height + slide-in transition. -->
        <div class="app-detail-wrap">
          <div class="app-detail">
            <p class="detail-description">{{ app.description }}</p>

            <div class="detail-block">
              <h4 class="detail-heading">{{ $t('Setup') }}</h4>
              <p class="detail-body">{{ app.setup }}</p>
            </div>

            <div class="detail-block">
              <h4 class="detail-heading">{{ $t('Use it for') }}</h4>
              <ul class="detail-list">
                <li v-for="use in app.usedFor" :key="use">{{ use }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="step-actions">
      <b-button rounded @click="$emit('back')">{{ $t('Back') }}</b-button>
      <div class="is-flex-grow-1"></div>
      <b-button
        rounded
        type="is-primary"
        :disabled="picked.length === 0"
        @click="$emit('next', { apps: picked })"
      >
        {{ picked.length === 0 ? $t('Pick at least one') : `${$t('Continue with')} ${picked.length} ${$t('apps')}` }}
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
          tagline: this.$t('Photo & video backup from your phone.'),
          difficulty: 2,
          description: this.$t('Self-hosted photo & video backup that mirrors what iCloud and Google Photos do — face recognition, shared albums, search by location and date — but everything stays on your pebble.'),
          setup: this.$t('Install the Immich mobile app, scan a QR code from the next step, sign in with your KODE account. Backup runs in the background.'),
          usedFor: [
            this.$t('Automatic phone-photo backup over Wi-Fi'),
            this.$t('Shared family albums across devices'),
            this.$t('Search photos by face, place, or date'),
            this.$t('Replaces Google Photos / iCloud'),
          ],
        },
        {
          key: 'jellyfin',
          icon: 'video',
          title: this.$t('Jellyfin'),
          tagline: this.$t('Stream movies and music to your TV.'),
          difficulty: 2,
          description: this.$t('Free media server. Streams movies, TV shows, and music from your pebble to TVs, phones, tablets, and browsers — no monthly fee.'),
          setup: this.$t('Add your media folders (/DATA/Videos, /DATA/Music) and install the Jellyfin app on your TV. The walkthrough covers both.'),
          usedFor: [
            this.$t('Watch your movie collection from any room'),
            this.$t('Family libraries with parental controls'),
            this.$t('Music streaming with album art'),
            this.$t('Replaces Plex (with no subscription)'),
          ],
        },
        {
          key: 'filebrowser',
          icon: 'folder',
          title: this.$t('File Browser'),
          tagline: this.$t('Access your pebble\'s files from any browser.'),
          difficulty: 1,
          description: this.$t('Web-based file manager. Upload, download, share, rename, and organize everything under /DATA from any browser on your network.'),
          setup: this.$t('Already running. Opens from the app dock once setup is done.'),
          usedFor: [
            this.$t('Quick access to your files from anywhere'),
            this.$t('One-click sharable links'),
            this.$t('Drag-and-drop uploads from your computer'),
            this.$t('Mobile-friendly — bookmark on your phone'),
          ],
        },
        {
          key: 'pihole',
          icon: 'shield-outline',
          title: this.$t('Pi-hole'),
          tagline: this.$t('Block ads and trackers across your whole network.'),
          difficulty: 3,
          description: this.$t('Network-wide ad and tracker blocker. Stops ads on every device on your network — phones, TVs, smart speakers — without installing anything on them.'),
          setup: this.$t('Point your home router\'s DNS at your pebble. Takes about two minutes in your router\'s admin page; the walkthrough has step-by-step instructions.'),
          usedFor: [
            this.$t('Ad-free browsing across all devices'),
            this.$t('Block tracking and analytics domains'),
            this.$t('Live stats: how many ads got blocked today'),
            this.$t('Pebble OLED can show the daily count'),
          ],
        },
        {
          key: 'homeassistant',
          icon: 'home-outline',
          title: this.$t('Home Assistant'),
          tagline: this.$t('Smart-home hub for lights, thermostats, and sensors.'),
          difficulty: 5,
          description: this.$t('Open-source smart-home platform. Controls lights, thermostats, locks, cameras, sensors, and thousands of other devices from one app — locally, without the cloud.'),
          setup: this.$t('Create an admin account, then add integrations one by one (each device brand has its own setup). Plan to spend at least an hour to get the basics going.'),
          usedFor: [
            this.$t('Automate lights, locks, and thermostats'),
            this.$t('Local control with no cloud dependency'),
            this.$t('Build custom dashboards'),
            this.$t('Trigger routines from sensors and presence'),
          ],
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

.app-option-wrap {
  position: relative;
}

/* Open the detail panel on hover OR keyboard-visible focus. Using
   :has(:focus-visible) instead of :focus-within means a mouse click
   on the card doesn't pin the panel open after the mouse leaves —
   only Tab-driven focus opens it. */
.app-option-wrap:hover .app-detail-wrap,
.app-option-wrap:has(:focus-visible) .app-detail-wrap {
  grid-template-rows: 1fr;
  margin-top: 0.4rem;
}

.app-option-wrap:hover .app-detail,
.app-option-wrap:has(:focus-visible) .app-detail {
  opacity: 1;
  transform: translateY(0);
  padding: 1rem 1.1rem;
}

.app-option {
  width: 100%;
  display: grid;
  grid-template-columns: 44px 1fr 20px;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  text-align: left;
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 4px 16px rgba(0, 0, 0, 0.15);
  transition: border-color 0.15s, background 0.15s, transform 0.15s;

  &:hover {
    border-color: rgba(45, 95, 78, 0.55);
    transform: translateY(-1px);
  }
  &.is-selected {
    border-color: #2d5f4e;
    background: rgba(225, 240, 234, 0.95);
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

.app-option-title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1px;
}

.app-option-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1f2937;
}

.app-option-difficulty {
  display: inline-flex;
  gap: 1px;
  font-size: 0.75rem;
  line-height: 1;

  .star {
    color: rgba(0, 0, 0, 0.18);
    transition: color 0.15s;
  }
  .star.is-filled {
    color: #c47f00;
  }
}

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

/* Inline expanding detail — collapsed via a CSS grid row-template
   transition so the natural height of the content drives the animation.
   The transform on .app-detail layers a slide-down on top of that. */
.app-detail-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              margin-top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 0;
}

.app-detail {
  overflow: hidden;
  min-height: 0;
  padding: 0 1.1rem;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-radius: 14px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 8px 24px rgba(0, 0, 0, 0.18);
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity 0.22s ease 0.05s,
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.05s,
              padding 0.3s ease;
}


.detail-description {
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.78);
  margin-bottom: 0.85rem;
}

.detail-block {
  margin-bottom: 0.75rem;

  &:last-child { margin-bottom: 0; }
}

.detail-heading {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #2d5f4e;
  margin-bottom: 0.25rem;
}

.detail-body {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.5;
}

.detail-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.55;

  li {
    padding: 0.05rem 0 0.05rem 0.85rem;
    position: relative;

    &::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #2d5f4e;
      font-weight: 700;
    }
  }
}

.step-actions { display: flex; align-items: center; gap: 0.5rem; }
</style>
