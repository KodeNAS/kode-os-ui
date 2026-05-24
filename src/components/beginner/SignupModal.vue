<!--
  SignupModal — invoked from the Login page when a visitor clicks
  "Sign up" and the pebble already has an admin. Creates a viewer-
  role family member locally (and syncs to customStorage if an admin
  token is around). The full-fledged AddUserModal (with role picker)
  lives on the dashboard's FamilyTile; this one's intentionally bare
  so the signup flow is just name + password.
-->
<template>
  <div class="modal-card signup-modal">
    <header class="modal-card-head">
      <div class="head-icon"><b-icon icon="account-multiple" pack="casa" /></div>
      <div class="head-text">
        <h3 class="head-title">{{ $t('Create your account') }}</h3>
        <p class="head-sub">{{ $t('Pick a name and password. The pebble admin can change your role later.') }}</p>
      </div>
      <button type="button" class="head-close" :aria-label="$t('Close')" @click="$emit('close')">
        <b-icon icon="close-outline" pack="casa" size="is-small" />
      </button>
    </header>

    <section class="modal-card-body">
      <b-field
        :label="$t('Name')"
        :type="nameError ? 'is-danger' : ''"
        :message="nameError || ''"
        class="field-block"
      >
        <b-input
          v-model="name"
          autofocus
          maxlength="30"
          icon-pack="casa"
          icon="account-outline"
          :placeholder="$t('Your name')"
          @keyup.enter.native="submit"
        />
      </b-field>

      <b-field
        :label="$t('Password')"
        :type="passwordError ? 'is-danger' : ''"
        :message="passwordError || $t('Used for signing in to this pebble. Stored locally on your browser.')"
        class="field-block"
      >
        <b-input
          v-model="password"
          type="password"
          password-reveal
          icon-pack="casa"
          icon="lock-closed-outline"
          :placeholder="$t('Set a password (min 4 characters)')"
          maxlength="64"
          @keyup.enter.native="submit"
        />
      </b-field>

      <p v-if="saveError" class="save-error">{{ saveError }}</p>

      <div class="footnote">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('New accounts join as viewers. The pebble admin can promote you to editor or admin later from the dashboard.') }}</span>
      </div>
    </section>

    <footer class="modal-card-foot">
      <b-button rounded @click="$emit('close')">{{ $t('Cancel') }}</b-button>
      <b-button
        rounded
        type="is-primary"
        :loading="saving"
        :disabled="!canSave"
        @click="submit"
      >
        {{ $t('Create account') }}
      </b-button>
    </footer>
  </div>
</template>

<script>
const MEMBERS_KEY = 'kode_family_members'

async function hashPassword(plaintext) {
  if (!plaintext) return ''
  if (!window.crypto || !window.crypto.subtle) {
    return `legacy:${btoa(unescape(encodeURIComponent(plaintext)))}`
  }
  const buf = new TextEncoder().encode(plaintext)
  const digest = await window.crypto.subtle.digest('SHA-256', buf)
  return 'sha256:' + Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export default {
  name: 'SignupModal',
  data() {
    return {
      name: '',
      password: '',
      saving: false,
      saveError: '',
      nameError: '',
      passwordError: '',
    }
  },
  computed: {
    canSave() {
      return this.name.trim().length > 0 && this.password.length >= 4 && !this.saving
    },
  },
  methods: {
    async submit() {
      const name = this.name.trim()
      if (!name) {
        this.nameError = this.$t('Pick a name.')
        return
      }
      if (this.password.length < 4) {
        this.passwordError = this.$t('Make the password at least 4 characters.')
        return
      }
      this.nameError = ''
      this.passwordError = ''
      this.saving = true
      this.saveError = ''
      try {
        // Read existing members from localStorage (always works) and
        // from customStorage if we have a token (so other devices see
        // the new account too).
        let members = []
        try {
          const raw = localStorage.getItem(MEMBERS_KEY)
          const parsed = raw ? JSON.parse(raw) : []
          if (Array.isArray(parsed)) members = parsed
        } catch (e) { /* ignore */ }

        // Reject duplicates by case-insensitive name.
        const dupe = members.find(m => (m.name || '').toLowerCase() === name.toLowerCase())
        if (dupe) {
          this.nameError = this.$t('Someone with that name already has an account.')
          return
        }

        const passwordHash = await hashPassword(this.password)
        members.push({
          name,
          role: 'viewer',     // signup always starts as viewer — admin promotes later
          passwordHash,
          added_at: new Date().toISOString(),
        })
        // localStorage write — always works.
        try { localStorage.setItem(MEMBERS_KEY, JSON.stringify(members)) } catch (e) { /* ignore */ }
        // customStorage sync — only works if an admin token is around.
        // Best-effort: if it fails, the member is still saved locally
        // and will sync up next time the admin opens the FamilyTile.
        try {
          if (localStorage.getItem('access_token')) {
            await this.$api.users.setCustomStorage(MEMBERS_KEY, members)
          }
        } catch (e) { /* will sync later */ }

        this.$emit('signed-up', { name, password: this.password })
        this.$emit('close')
      } catch (e) {
        this.saveError = (e && e.message) || this.$t('Couldn\'t save. Try again.')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.signup-modal {
  width: 460px;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.modal-card-head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1.1rem 1.2rem;
  background: linear-gradient(180deg, rgba(45, 95, 78, 0.06), rgba(255, 255, 255, 0));
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.head-icon {
  flex: 0 0 44px;
  height: 44px;
  width: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2d5f4e, #3f7a66);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.head-text { flex: 1; min-width: 0; }

.head-title {
  font-size: 1.0625rem;
  font-weight: 500;
  color: #1f2937;
  margin: 0;
}

.head-sub {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  margin: 0.1rem 0 0 0;
}

.head-close {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.45);
  padding: 0.3rem 0.4rem;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover { color: rgba(0, 0, 0, 0.75); background: rgba(0, 0, 0, 0.06); }
}

.modal-card-body {
  padding: 1.1rem 1.2rem 0.4rem;
}

.field-block { margin-bottom: 1rem; }

::v-deep .field > .label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.62);
  margin-bottom: 0.3rem;
}

::v-deep .input {
  background: rgba(0, 0, 0, 0.035);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: none;

  &:focus { border-color: #2d5f4e; box-shadow: 0 0 0 3px rgba(45, 95, 78, 0.12); }
}

.save-error {
  font-size: 0.8125rem;
  color: #b04a4a;
  background: rgba(176, 74, 74, 0.08);
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  margin: 0.5rem 0 0;
}

.footnote {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  margin: 0.85rem 0 0;
  padding: 0.6rem 0.8rem;
  background: rgba(45, 95, 78, 0.07);
  border-radius: 10px;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.45;
}

.modal-card-foot {
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.9rem 1.2rem 1.1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
