<template>
  <div class="modal-card add-user-modal">
    <header class="modal-card-head">
      <h3 class="title is-header">{{ $t('Add a family member') }}</h3>
      <b-icon class="close-button" icon="close-outline" pack="casa" @click.native="$emit('close')" />
    </header>

    <section class="modal-card-body">
      <p class="intro">
        {{ $t('Create a separate account for someone else who uses this pebble. They\'ll get viewer access by default — they can see files and use apps, but only you (the root admin) can change settings.') }}
      </p>

      <ValidationObserver ref="observer" v-slot="{ handleSubmit }">
        <ValidationProvider v-slot="{ errors, valid }" name="User" rules="required">
          <b-field
            :label="$t('Username')"
            :message="$t(errors[0] || '')"
            :type="{ 'is-danger': errors[0], 'is-success': valid }"
          >
            <b-input v-model="username" type="text" autocomplete="off" />
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

        <div class="modal-actions">
          <b-button rounded @click="$emit('close')">{{ $t('Cancel') }}</b-button>
          <div class="is-flex-grow-1"></div>
          <b-button
            rounded
            type="is-primary"
            :loading="isSubmitting"
            @click="handleSubmit(submit)"
          >
            {{ $t('Add user') }}
          </b-button>
        </div>
      </ValidationObserver>
    </section>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider } from 'vee-validate'
import '@/plugins/vee-validate'

const ROLES_KEY = 'kode_user_roles'

export default {
  name: 'AddUserModal',
  components: { ValidationObserver, ValidationProvider },
  data() {
    return {
      username: '',
      password: '',
      confirmation: '',
      isSubmitting: false,
    }
  },
  methods: {
    async submit() {
      this.isSubmitting = true
      try {
        // CasaOS register normally wants an init key; we try without one
        // and let the API decide. If multi-user isn't supported on this
        // build, the error message surfaces back to the user verbatim.
        const res = await this.$api.users.register(this.username, this.password, '')
        if (res.data.success !== 200) {
          throw new Error(res.data.message || 'register failed')
        }

        // Record the new user's role in our kode-side custom storage so
        // FamilyTile can label them as "viewer" (cosmetic — backend doesn't
        // enforce this yet).
        await this.recordRole(this.username, 'viewer').catch(() => {})

        this.$buefy.toast.open({
          message: `${this.username} ${this.$t('added.')}`,
          type: 'is-success',
          position: 'is-top',
        })
        this.$emit('added', this.username)
        this.$emit('close')
      } catch (err) {
        const msg = (err && err.response && err.response.data && err.response.data.message) || err.message || this.$t('Could not add user.')
        this.$buefy.toast.open({
          message: `${this.$t('Add user failed:')} ${msg}`,
          type: 'is-danger',
          position: 'is-top',
          duration: 5000,
        })
      } finally {
        this.isSubmitting = false
      }
    },

    async recordRole(username, role) {
      // Fetch existing map, merge, write back. Best-effort.
      let map = {}
      try {
        const res = await this.$api.users.getCustomStorage(ROLES_KEY)
        if (res && res.data && res.data.data) {
          map = res.data.data || {}
        }
      } catch (e) { /* fresh map */ }
      map[username] = role
      await this.$api.users.setCustomStorage(ROLES_KEY, map)
    },
  },
}
</script>

<style lang="scss" scoped>
.add-user-modal { width: 480px; max-width: 100%; }

.intro {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
