<template>
  <div class="pick-device-step">
    <p class="pick-device-intro">
      {{ $t('What kind of device do you want to add?') }}
    </p>

    <div class="device-grid">
      <button
        v-for="opt in options"
        :key="opt.key"
        type="button"
        class="device-option"
        :class="{ 'is-selected': value === opt.key }"
        @click="pick(opt.key)"
      >
        <span class="device-option-icon" :class="`is-${opt.key}`">
          <b-icon :icon="opt.icon" pack="casa" size="is-medium" />
        </span>
        <span class="device-option-title">{{ opt.title }}</span>
        <span class="device-option-desc">{{ opt.desc }}</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PickDeviceTypeStep',
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      options: [
        {
          key: 'phone',
          icon: 'mobile-outline',
          title: this.$t('Phone'),
          desc: this.$t('Back up photos automatically with the Immich app.'),
        },
        {
          key: 'computer',
          icon: 'computer-outline',
          title: this.$t('Computer'),
          desc: this.$t('See your pebble\'s folders in Finder or File Explorer.'),
        },
        {
          key: 'tv',
          icon: 'tv-outline',
          title: this.$t('Smart TV'),
          desc: this.$t('Stream movies and music with the Jellyfin app on your TV.'),
        },
      ],
    }
  },
  methods: {
    pick(key) {
      this.$emit('input', key)
      this.$emit('pick', key)
    },
  },
}
</script>

<style lang="scss" scoped>
.pick-device-intro {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 1rem;
}

.device-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

.device-option {
  display: grid;
  grid-template-columns: 48px 1fr;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0.25rem 1rem;
  padding: 1rem 1.25rem;
  text-align: left;
  background: rgba(255, 255, 255, 0.7);
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;

  &:hover {
    border-color: rgba(45, 95, 78, 0.4);
    background: rgba(255, 255, 255, 0.85);
  }

  &.is-selected {
    border-color: #2d5f4e;
    background: rgba(45, 95, 78, 0.08);
  }
}

.device-option-icon {
  grid-row: 1 / span 2;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  &.is-phone    { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }
  &.is-computer { background: linear-gradient(135deg, #5e6ad2, #7c8af0); }
  &.is-tv       { background: linear-gradient(135deg, #c47f00, #e6a02a); }
}

.device-option-title {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
}

.device-option-desc {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.4;
}
</style>
