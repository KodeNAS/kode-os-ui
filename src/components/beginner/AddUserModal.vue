<template>
  <div class="modal-card add-user-modal">
    <header class="modal-card-head">
      <h3 class="title is-header">{{ $t('Add a family member') }}</h3>
      <b-icon class="close-button" icon="close-outline" pack="casa" @click.native="$emit('close')" />
    </header>

    <section class="modal-card-body">
      <p class="intro">
        {{ $t('Give someone in your home a place on this pebble. They\'ll share the same KODE login for now — their name and role show up on the dashboard so everyone knows who\'s on it.') }}
      </p>

      <b-field
        :label="$t('Name')"
        :type="nameError ? 'is-danger' : ''"
        :message="nameError || ''"
      >
        <b-input
          v-model="name"
          autofocus
          maxlength="30"
          :placeholder="$t('e.g. Alex')"
          @keyup.enter="submit"
        />
      </b-field>

      <b-field :label="$t('Role on the pebble')">
        <b-select v-model="role" expanded>
          <option value="viewer">{{ $t('Viewer — sees files and apps, doesn\'t change settings') }}</option>
          <option value="editor">{{ $t('Editor — can add and remove files') }}</option>
          <option value="admin">{{ $t('Admin — full control (shared with you)') }}</option>
        </b-select>
      </b-field>

      <p v-if="saveError" class="save-error">{{ saveError }}</p>

      <div class="footnote">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Separate Linux accounts for each family member are on the roadmap. For now this is a label so the dashboard reflects who uses the pebble.') }}</span>
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
        {{ $t('Add to dashboard') }}
      </b-button>
    </footer>
  </div>
</template>

<script>
const MEMBERS_KEY = 'kode_family_members'

export default {
  name: 'AddUserModal',
  data() {
    return {
      name: '',
      role: 'viewer',
      saving: false,
      saveError: '',
      nameError: '',
    }
  },
  computed: {
    canSave() {
      return this.name.trim().length > 0 && !this.saving
    },
  },
  methods: {
    async submit() {
      const name = this.name.trim()
      if (!name) {
        this.nameError = this.$t('Add a name first.')
        return
      }
      this.nameError = ''
      this.saving = true
      this.saveError = ''
      try {
        // Load existing members from per-user custom storage so it
        // round-trips across reloads (and across browsers on the same
        // KODE account). Empty/404 → start with []. The FamilyTile reads
        // from this same key and merges with the real Linux user list.
        let members = []
        try {
          const res = await this.$api.users.getCustomStorage(MEMBERS_KEY)
          const raw = res && res.data && res.data.data
          if (Array.isArray(raw)) members = raw
        } catch (e) { /* first run — no entry yet */ }

        // Reject duplicates by case-insensitive name match — the
        // dashboard would otherwise show two tiles with the same label.
        const dupe = members.find(m => (m.name || '').toLowerCase() === name.toLowerCase())
        if (dupe) {
          this.nameError = this.$t('Someone with that name is already on the pebble.')
          return
        }

        members.push({
          name,
          role: this.role,
          added_at: new Date().toISOString(),
        })
        await this.$api.users.setCustomStorage(MEMBERS_KEY, members)
        this.$emit('added', { name, role: this.role })
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
.add-user-modal { width: 480px; max-width: 100%; }

.intro {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.save-error {
  font-size: 0.8125rem;
  color: #b04a4a;
  background: rgba(176, 74, 74, 0.08);
  border-radius: 8px;
  padding: 0.45rem 0.65rem;
  margin: 0.5rem 0 0;
}

.footnote {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin-top: 1rem;
  padding: 0.55rem 0.75rem;
  background: rgba(45, 95, 78, 0.08);
  border-radius: 10px;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.45;
}

.modal-card-foot {
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
