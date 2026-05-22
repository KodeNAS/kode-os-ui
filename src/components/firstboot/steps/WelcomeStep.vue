<template>
  <div class="fb-step welcome-step has-text-centered">
    <div class="welcome-mark">
      <b-image
        :src="require('@/assets/img/logo/casa-dark.svg')"
        class="is-128x128"
      />
    </div>

    <h1 class="title is-2 has-text-white">{{ $t('Welcome to your pebble') }}</h1>
    <p class="subtitle is-5 has-text-white-bis">{{ $t('Your own private cloud, ready in 5 minutes.') }}</p>

    <div class="welcome-actions">
      <b-button
        size="is-medium"
        rounded
        type="is-primary"
        @click="$emit('next')"
      >
        {{ $t("Let's get started") }}
      </b-button>
    </div>
  </div>
</template>

<script>
export default { name: 'WelcomeStep' }
</script>

<style lang="scss" scoped>
.welcome-step {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.welcome-mark {
  display: inline-flex;
  margin-bottom: 0.5rem;
}

.title,
.subtitle {
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
}

.welcome-actions {
  margin-top: 1.25rem;
}
</style>
