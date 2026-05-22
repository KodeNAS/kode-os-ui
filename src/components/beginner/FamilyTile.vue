<template>
  <div
    class="kode-tile family-tile"
    :title="hintModeOn ? hintLabel : null"
  >
    <header class="tile-header">
      <h2 class="tile-title">{{ $t('On your pebble') }}</h2>
      <button
        type="button"
        class="tile-add"
        :aria-label="$t('Add user')"
        :title="$t('Add a family member')"
        @click="openAddUser"
      >
        <b-icon icon="plus-outline" pack="casa" size="is-small" />
      </button>
    </header>

    <div v-if="isLoading" class="tile-empty">
      {{ $t('Loading...') }}
    </div>
    <div v-else-if="users.length === 0" class="tile-empty">
      {{ $t('No accounts yet.') }}
    </div>
    <ul v-else class="family-list">
      <li
        v-for="(user, idx) in users"
        :key="user.name"
        class="family-member"
        :class="`is-${user.role}`"
        :title="roleLabel(user.role)"
      >
        <span class="family-avatar">{{ initial(user.name) }}</span>
        <span class="family-name">{{ user.name }}</span>
        <span v-if="idx === 0 || user.role === 'root'" class="family-role-badge is-root">{{ $t('root') }}</span>
        <span v-else class="family-role-badge is-viewer">{{ $t('viewer') }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import AddUserModal from './AddUserModal.vue'
import { hintMode } from '@/mixins/hintMode'

const ROLES_KEY = 'kode_user_roles'

export default {
  name: 'FamilyTile',
  mixins: [hintMode],
  computed: {
    hintLabel() {
      return this.$t('Family accounts on your pebble. Root admin = full control; viewers see files and apps but don\'t change settings. + adds more (coming soon).')
    },
  },
  data() {
    return {
      isLoading: true,
      users: [],
      roles: {},
    }
  },
  created() {
    this.load()
  },
  methods: {
    async load() {
      try {
        // Pull the roles map in parallel with the username list.
        const [namesRes, rolesRes] = await Promise.allSettled([
          this.$api.users.getAllUserName(),
          this.$api.users.getCustomStorage(ROLES_KEY),
        ])

        let names = []
        if (namesRes.status === 'fulfilled') {
          const data = (namesRes.value && namesRes.value.data && namesRes.value.data.data) || []
          names = data
            .map(item => (typeof item === 'string' ? item : (item.user_name || item.username || '')))
            .filter(Boolean)
        }

        let rolesMap = {}
        if (rolesRes.status === 'fulfilled' && rolesRes.value && rolesRes.value.data && rolesRes.value.data.data) {
          rolesMap = rolesRes.value.data.data || {}
        }
        this.roles = rolesMap

        // First user in the list is the root admin by convention (the
        // initial registered account). Everyone else inherits from the
        // roles map, defaulting to viewer.
        this.users = names.map((name, idx) => ({
          name,
          role: idx === 0 ? 'root' : (rolesMap[name] || 'viewer'),
        }))
      } catch (e) {
        this.users = []
      } finally {
        this.isLoading = false
      }
    },
    initial(name) {
      return (name && name[0] && name[0].toUpperCase()) || '?'
    },
    roleLabel(role) {
      return role === 'root' ? this.$t('Root admin — full control') : this.$t('Viewer — sees files and apps, cannot change settings')
    },
    openAddUser() {
      this.$buefy.modal.open({
        parent: this,
        component: AddUserModal,
        hasModalCard: true,
        trapFocus: true,
        scroll: 'keep',
        animation: 'zoom-in',
        events: { added: () => this.load() },
      })
    },
  },
}
</script>

<style lang="scss" scoped>
/* Liquid glass — match RecentActivityTile. */
.kode-tile {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 1.1rem 1.25rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
}

.tile-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.tile-title {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: rgba(31, 41, 55, 0.7);
  margin: 0;
}

.tile-add {
  background: rgba(45, 95, 78, 0.10);
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2d5f4e;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(45, 95, 78, 0.22);
  }
}

.tile-empty {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.55);
  padding: 1rem 0;
}

.family-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.family-member {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.35rem 0.4rem 0.35rem 0.35rem;
  background: rgba(45, 95, 78, 0.08);
  border-radius: 999px;
}

.family-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #2d5f4e;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 500;
  flex: 0 0 28px;
}

.is-viewer .family-avatar {
  background: rgba(31, 41, 55, 0.55);
}

.family-name {
  flex: 1;
  font-size: 0.875rem;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.family-role-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;

  &.is-root {
    background: #2d5f4e;
    color: #fff;
  }

  &.is-viewer {
    background: rgba(31, 41, 55, 0.12);
    color: rgba(31, 41, 55, 0.75);
  }
}
</style>
