<template>
  <div class="fb-step admin-account-step">
    <h2 class="step-title">{{ $t('Create your account') }}</h2>
    <p class="step-intro">
      {{ $t('This is the owner account for your pebble. The same email + password also signs you in to your apps (Immich, Jellyfin, etc.) automatically — you don\'t have to set them up one by one.') }}
    </p>

    <ValidationObserver ref="observer" v-slot="{ handleSubmit }">
      <ValidationProvider v-slot="{ errors, valid }" name="Name" rules="required">
        <b-field
          :label="$t('Your name')"
          :message="$t(errors[0] || '')"
          :type="{ 'is-danger': errors[0], 'is-success': valid }"
        >
          <b-input v-model="fullName" type="text" autocomplete="name" :placeholder="$t('Jane Doe')" />
        </b-field>
      </ValidationProvider>

      <ValidationProvider v-slot="{ errors, valid }" name="User" rules="required">
        <b-field
          :label="$t('Username')"
          :message="$t(errors[0] || '')"
          :type="{ 'is-danger': errors[0], 'is-success': valid }"
        >
          <b-input v-model="username" type="text" autocomplete="username" />
        </b-field>
      </ValidationProvider>

      <ValidationProvider v-slot="{ errors, valid }" name="Email" rules="required|email">
        <b-field
          :label="$t('Email')"
          :message="$t(errors[0] || '')"
          :type="{ 'is-danger': errors[0], 'is-success': valid }"
        >
          <b-input v-model="email" type="email" autocomplete="email" :placeholder="$t('you@example.com')" />
        </b-field>
      </ValidationProvider>

      <ValidationProvider v-slot="{ errors, valid }" name="Password" rules="required|min:5" vid="password">
        <b-field
          :label="$t('Password')"
          :message="$t(errors[0] || '')"
          :type="{ 'is-danger': errors[0], 'is-success': valid }"
        >
          <b-input v-model="password" type="password" autocomplete="new-password" password-reveal />
        </b-field>
      </ValidationProvider>

      <ValidationProvider v-slot="{ errors, valid }" name="Confirm" rules="required|confirmed:password">
        <b-field
          :label="$t('Confirm password')"
          :message="$t(errors[0] || '')"
          :type="{ 'is-danger': errors[0], 'is-success': valid }"
        >
          <b-input v-model="confirmation" type="password" autocomplete="new-password" />
        </b-field>
      </ValidationProvider>

      <div class="step-actions">
        <b-button rounded @click="$emit('back')">{{ $t('Back') }}</b-button>
        <div class="is-flex-grow-1"></div>
        <b-button
          rounded
          type="is-primary"
          :loading="isSubmitting"
          @click="handleSubmit(submit)"
        >
          {{ $t('Create account') }}
        </b-button>
      </div>
    </ValidationObserver>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider } from 'vee-validate'
// Side-effect import that registers required/min/confirmed/email rules.
// Login.vue imports this on its own load, but on first-boot the router
// goes straight to /welcome and Login.vue never mounts — so the rules
// are unregistered and our form's "invalid" never clears.
import '@/plugins/vee-validate'

export default {
  name: 'AdminAccountStep',
  components: { ValidationObserver, ValidationProvider },
  data() {
    return {
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmation: '',
      isSubmitting: false,
    }
  },
  methods: {
    async submit() {
      this.isSubmitting = true
      try {
        const initKey = this.$store.state.initKey
        const regRes = await this.$api.users.register(this.username, this.password, initKey)
        if (regRes.data.success !== 200) {
          throw new Error(regRes.data.message || 'register failed')
        }
        const userRes = await this.$api.users.login(this.username, this.password)
        if (userRes.data.success !== 200) {
          throw new Error(userRes.data.message || 'login failed')
        }
        const token = userRes.data.data.token
        localStorage.setItem('access_token', token.access_token)
        localStorage.setItem('refresh_token', token.refresh_token)
        localStorage.setItem('expires_at', token.expires_at)
        localStorage.setItem('user', JSON.stringify(userRes.data.data.user))

        this.$store.commit('SET_NEED_INITIALIZATION', false)
        this.$store.commit('SET_INIT_KEY', '')
        this.$store.commit('SET_USER', userRes.data.data.user)
        this.$store.commit('SET_ACCESS_TOKEN', token.access_token)
        this.$store.commit('SET_REFRESH_TOKEN', token.refresh_token)

        // Pass credentials through so InstallAppsStep can use them to
        // auto-bootstrap each installed app (Immich admin signup,
        // Jellyfin setup wizard, Home Assistant onboarding, etc.).
        // Wizard state is in-memory only — the password isn't persisted
        // anywhere except localStorage (access_token / refresh_token).
        this.$emit('next', {
          username: this.username,
          email: this.email,
          fullName: this.fullName,
          password: this.password,
        })
      } catch (err) {
        const msg = (err && err.response && err.response.data && err.response.data.message) || err.message || 'Error'
        this.$buefy.toast.open({ message: msg, type: 'is-danger', position: 'is-top', duration: 4000 })
      } finally {
        this.isSubmitting = false
      }
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

::v-deep .field .label {
  color: rgba(255, 255, 255, 0.9);
}

::v-deep .input {
  background: rgba(255, 255, 255, 0.85);
  border-color: transparent;
}

.step-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
