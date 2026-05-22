<template>
  <div class="fb-step done-step has-text-centered">
    <div class="done-mark">
      <span class="done-circle">
        <span class="done-tick">✓</span>
      </span>
    </div>

    <h2 class="title is-3 has-text-white">{{ $t('Your pebble is ready') }}</h2>
    <p class="subtitle is-5 has-text-white-bis">
      {{ $t('You\'re all set up. Welcome home.') }}
    </p>

    <div class="done-summary">
      <ul>
        <li v-if="hostname">{{ $t('Pebble name: {name}', { name: hostname }) }}</li>
        <li v-if="apps.length > 0">{{ $t('Apps configured: {n}', { n: apps.length }) }}</li>
      </ul>
    </div>

    <div class="done-actions">
      <b-button size="is-medium" rounded type="is-primary" @click="$emit('finish')">
        {{ $t('Open my dashboard') }}
      </b-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DoneStep',
  props: {
    hostname: { type: String, default: '' },
    apps:     { type: Array,  default: () => [] },
  },
}
</script>

<style lang="scss" scoped>
.done-step {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.done-mark { margin-bottom: 0.75rem; }

.done-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d5f4e, #3f7a66);
  box-shadow: 0 10px 28px rgba(45, 95, 78, 0.4);
}

.done-tick { font-size: 2.5rem; color: #fff; line-height: 1; }

.title,
.subtitle {
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
}

.done-summary {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.55);

  ul { list-style: none; padding: 0; margin: 0; }
}

.done-actions { margin-top: 1.5rem; }
</style>
