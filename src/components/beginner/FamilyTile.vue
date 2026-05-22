<template>
  <div class="kode-tile family-tile">
    <header class="tile-header">
      <h2 class="tile-title">{{ $t('On your pebble') }}</h2>
    </header>

    <div v-if="isLoading" class="tile-empty">
      {{ $t('Loading...') }}
    </div>
    <div v-else-if="users.length === 0" class="tile-empty">
      {{ $t('No accounts yet.') }}
    </div>
    <ul v-else class="family-list">
      <li v-for="name in users" :key="name" class="family-member">
        <span class="family-avatar">{{ initial(name) }}</span>
        <span class="family-name">{{ name }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'FamilyTile',
  data() {
    return {
      isLoading: true,
      users: [],
    }
  },
  created() {
    this.load()
  },
  methods: {
    async load() {
      try {
        const res = await this.$api.users.getAllUserName()
        const data = (res && res.data && res.data.data) || []
        // Endpoint returns an array of strings or objects with .user_name; handle both.
        this.users = data
          .map(item => (typeof item === 'string' ? item : (item.user_name || item.username || '')))
          .filter(Boolean)
      } catch (e) {
        this.users = []
      } finally {
        this.isLoading = false
      }
    },
    initial(name) {
      return (name && name[0] && name[0].toUpperCase()) || '?'
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
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.tile-title {
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: rgba(31, 41, 55, 0.7);
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
  flex-wrap: wrap;
  gap: 0.75rem;
}

.family-member {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem 0.4rem 0.4rem;
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
}

.family-name {
  font-size: 0.875rem;
  color: #1f2937;
}
</style>
