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
.kode-tile {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.tile-header {
  margin-bottom: 0.75rem;
}

.tile-title {
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #1f2937;
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
