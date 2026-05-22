<template>
  <div class="modal-card add-user-modal">
    <header class="modal-card-head">
      <h3 class="title is-header">{{ $t('Add a family member') }}</h3>
      <b-icon class="close-button" icon="close-outline" pack="casa" @click.native="$emit('close')" />
    </header>

    <section class="modal-card-body">
      <div class="not-yet">
        <div class="not-yet-icon">
          <b-icon icon="alert" pack="casa" size="is-medium" />
        </div>
        <h4 class="not-yet-title">{{ $t('Not available yet') }}</h4>
        <p class="not-yet-body">
          {{ $t('Your pebble runs on a single shared account by default. Adding separate family-member accounts (with viewer permissions, per-user photo libraries, separate dashboards) needs a fork of the CasaOS user-service so the backend can store multiple users with roles.') }}
        </p>
        <p class="not-yet-body">
          {{ $t('We have this planned as a dedicated track — it touches the Go backend and isn\'t something we can land in a UI session. For now, share the existing account.') }}
        </p>
      </div>

      <div class="not-yet-actions">
        <b-button rounded type="is-primary" @click="$emit('close')">{{ $t('Got it') }}</b-button>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'AddUserModal',
}
</script>

<style lang="scss" scoped>
.add-user-modal { width: 480px; max-width: 100%; }

.not-yet {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.5rem 0 1rem;
}

.not-yet-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c47f00, #e6a02a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.not-yet-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.not-yet-body {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.55;
  max-width: 380px;
  margin: 0 auto 0.75rem;
}

.not-yet-actions {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}
</style>
