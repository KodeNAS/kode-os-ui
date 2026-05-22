<template>
  <div class="done-step">
    <div class="done-checkmark">
      <span class="done-circle">
        <span class="done-tick">✓</span>
      </span>
    </div>

    <h2 class="done-title">{{ $t('You\'re all set!') }}</h2>
    <p class="done-message">{{ message }}</p>

    <div class="done-actions">
      <b-button
        rounded
        @click="$emit('add-another')"
      >
        {{ $t('Add another device') }}
      </b-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DoneStep',
  props: {
    type: { type: String, default: '' },
  },
  computed: {
    message() {
      switch (this.type) {
        case 'phone':
          return this.$t('Once you sign in on your phone, photos will start backing up in the background.')
        case 'computer':
          return this.$t('Your pebble\'s folders should now appear in your file manager. Drag files in to share them.')
        case 'tv':
          return this.$t('Your TV is ready to stream from your pebble. Hit play and enjoy.')
        default:
          return this.$t('Your device is ready to use with your pebble.')
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.done-step {
  text-align: center;
  padding: 1.5rem 1rem;
}

.done-checkmark {
  margin-bottom: 1.25rem;
}

.done-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d5f4e, #3f7a66);
  box-shadow: 0 8px 24px rgba(45, 95, 78, 0.35);
}

.done-tick {
  font-size: 2rem;
  color: #fff;
  line-height: 1;
}

.done-title {
  font-size: 1.375rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.done-message {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.65);
  max-width: 400px;
  margin: 0 auto 1.5rem;
  line-height: 1.5;
}

.done-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}
</style>
