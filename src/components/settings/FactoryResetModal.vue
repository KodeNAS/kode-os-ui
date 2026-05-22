<template>
  <div class="modal-card factory-reset-modal">
    <header class="modal-card-head">
      <div class="is-flex-grow-1">
        <h3 class="title is-header has-text-danger">{{ $t('Reset to factory state?') }}</h3>
      </div>
      <b-icon
        class="close-button"
        icon="close-outline"
        pack="casa"
        @click.native="$emit('close')"
      />
    </header>

    <section class="modal-card-body">
      <p class="lead">
        {{ $t("This returns your pebble to the state it was in when you first plugged it in — without erasing your photos, files, or apps.") }}
      </p>

      <div class="will-section">
        <div class="will-block destroy">
          <h4 class="will-title">
            <b-icon icon="alert" pack="casa" size="is-small" />
            {{ $t('Will be deleted') }}
          </h4>
          <ul>
            <li>{{ $t('All KODE accounts on this pebble') }}</li>
            <li>{{ $t('Your pebble\'s name and Easy/Advanced mode') }}</li>
            <li>{{ $t('First-boot completion flag — wizard re-runs') }}</li>
            <li>{{ $t('Wallpaper preference') }}</li>
          </ul>
        </div>

        <div class="will-block keep">
          <h4 class="will-title">
            <b-icon icon="check" pack="casa" size="is-small" />
            {{ $t('Will be kept') }}
          </h4>
          <ul>
            <li>{{ $t('All installed apps (Immich, Jellyfin, etc.)') }}</li>
            <li>{{ $t('All files in /DATA (Photos, Videos, Documents…)') }}</li>
            <li>{{ $t('All app data and configurations') }}</li>
            <li>{{ $t('Your pebble\'s network setup') }}</li>
          </ul>
        </div>
      </div>

      <p class="confirm-prompt">
        {{ $t('Type') }} <strong>RESET</strong> {{ $t('to confirm:') }}
      </p>
      <b-input
        v-model="confirmText"
        type="text"
        :placeholder="$t('RESET')"
        autocomplete="off"
        class="confirm-input"
      />
    </section>

    <footer class="modal-card-foot is-flex is-align-items-center">
      <div class="is-flex-grow-1"></div>
      <b-button :label="$t('Cancel')" rounded @click="$emit('close')" />
      <b-button
        :label="$t('Reset pebble')"
        :disabled="!canReset"
        :loading="isResetting"
        rounded
        type="is-danger"
        @click="reset"
      />
    </footer>
  </div>
</template>

<script>
export default {
  name: 'FactoryResetModal',
  data() {
    return {
      confirmText: '',
      isResetting: false,
    }
  },
  computed: {
    canReset() {
      return this.confirmText.trim().toUpperCase() === 'RESET' && !this.isResetting
    },
  },
  methods: {
    async reset() {
      if (!this.canReset) return
      this.isResetting = true

      // Step 1: Best-effort wipe KODE-specific custom storage while we still
      // have auth. allSettled so a single failure doesn't abort the reset.
      await Promise.allSettled([
        this.$api.users.setCustomStorage('kode_first_boot', {}),
        this.$api.users.setCustomStorage('kode_pebble_name', {}),
      ])

      // Step 2: Delete all user accounts on the pebble. This is the
      // load-bearing destructive call — if it fails we abort.
      try {
        await this.$api.users.deleteAllUser()
      } catch (err) {
        this.$buefy.toast.open({
          message: this.$t('Reset failed — could not delete accounts. {msg}', {
            msg: (err && err.response && err.response.data && err.response.data.message) || err.message || '',
          }),
          type: 'is-danger',
          position: 'is-top',
          duration: 5000,
        })
        this.isResetting = false
        return
      }

      // Step 3: Wipe KODE-controlled localStorage + auth tokens.
      const keysToKill = [
        'kode_interface_mode',
        'wallpaper',
        'access_token',
        'refresh_token',
        'expires_at',
        'user',
        'version',
        'lang',
        'networkStorage',
        'is_update',
      ]
      keysToKill.forEach((k) => localStorage.removeItem(k))

      // Step 4: Reset Vuex so the router's beforeEach guard sees us as
      // uninitialized and routes /welcome on next nav.
      this.$store.commit('SET_NEED_INITIALIZATION', true)
      this.$store.commit('SET_INTERFACE_MODE', 'beginner')
      this.$store.commit('SET_ACCESS_TOKEN', '')
      this.$store.commit('SET_REFRESH_TOKEN', '')
      this.$store.commit('SET_USER', {
        avatar: '', created_at: '', description: '', email: '', id: 0,
        nickname: '', role: '', updated_at: '', username: '',
      })

      this.$emit('close')

      // Step 5: Hard reload to /welcome so all in-memory state from any
      // component (including caches, polls, sockets) is dropped.
      window.location.assign('/#/welcome')
      window.location.reload()
    },
  },
}
</script>

<style lang="scss" scoped>
.factory-reset-modal {
  width: 560px;
  max-width: 100%;
}

.lead {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.55;
  margin-bottom: 1.25rem;
}

.will-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.25rem;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
}

.will-block {
  padding: 0.85rem 1rem;
  border-radius: 12px;

  ul {
    margin: 0.25rem 0 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.8125rem;
    line-height: 1.55;
    color: rgba(0, 0, 0, 0.75);
  }

  li {
    padding: 0.15rem 0;
    padding-left: 0.8rem;
    position: relative;

    &::before {
      content: '•';
      position: absolute;
      left: 0;
      font-weight: 700;
    }
  }
}

.will-block.destroy {
  background: rgba(176, 74, 74, 0.08);
  border: 1px solid rgba(176, 74, 74, 0.18);

  .will-title { color: #b04a4a; }
  li::before  { color: #b04a4a; }
}

.will-block.keep {
  background: rgba(45, 95, 78, 0.08);
  border: 1px solid rgba(45, 95, 78, 0.18);

  .will-title { color: #2d5f4e; }
  li::before  { color: #2d5f4e; }
}

.will-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.35rem;
}

.confirm-prompt {
  font-size: 0.9375rem;
  margin-bottom: 0.5rem;
  color: rgba(0, 0, 0, 0.78);

  strong {
    background: rgba(0, 0, 0, 0.06);
    padding: 1px 8px;
    border-radius: 4px;
    font-family: monospace;
    letter-spacing: 0.05em;
  }
}

.confirm-input {
  max-width: 220px;
}

.modal-card-foot { gap: 0.5rem; }
</style>
