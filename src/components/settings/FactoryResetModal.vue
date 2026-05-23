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
        {{ $t('This wipes your pebble back to the state it was in when you first plugged it in. The setup wizard will run again.') }}
      </p>

      <div class="destroy-block">
        <h4 class="destroy-title">
          <b-icon icon="alert" pack="casa" size="is-small" />
          {{ $t('Everything below will be permanently deleted') }}
        </h4>
        <ul>
          <li>{{ $t('All KODE accounts on this pebble') }}</li>
          <li>{{ $t('All installed apps (Immich, Jellyfin, Pi-hole, Home Assistant…) and their app data') }}</li>
          <li>{{ $t('All your files in /DATA (Photos, Videos, Documents, Music, Downloads, Backups, Gallery, AppData)') }}</li>
          <li>{{ $t('Pebble name, dashboard layout, wallpaper, and tour state') }}</li>
        </ul>
      </div>

      <p class="confirm-prompt">
        {{ $t('Type') }} <strong>WIPE</strong> {{ $t('to confirm this cannot be undone:') }}
      </p>
      <b-input
        v-model="confirmText"
        type="text"
        :placeholder="$t('WIPE')"
        autocomplete="off"
        class="confirm-input"
      />

      <!-- Live progress while the reset runs. The user can't cancel
           mid-flight but at least sees what's happening rather than a
           frozen modal. -->
      <div v-if="isResetting" class="progress-block">
        <div class="progress-row">
          <span class="progress-icon">
            <span class="spinner"></span>
          </span>
          <span class="progress-label">{{ statusLabel }}</span>
        </div>
        <div v-if="appProgress" class="progress-sub">{{ appProgress }}</div>
      </div>
    </section>

    <footer class="modal-card-foot is-flex is-align-items-center">
      <div class="is-flex-grow-1"></div>
      <b-button :label="$t('Cancel')" :disabled="isResetting" rounded @click="$emit('close')" />
      <b-button
        :label="$t('Wipe everything')"
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
import { syncApps, listInstalledAppIds, uninstallApp } from '@/service/appSync'

// Paths under /DATA that the wizard re-creates. We wipe these on
// factory reset so the user gets a clean tree on next boot.
const DATA_FOLDERS_TO_WIPE = [
  '/DATA/Photos',
  '/DATA/Videos',
  '/DATA/Documents',
  '/DATA/Music',
  '/DATA/Downloads',
  '/DATA/Backups',
  '/DATA/Gallery',
  '/DATA/AppData',
]

export default {
  name: 'FactoryResetModal',
  data() {
    return {
      confirmText: '',
      isResetting: false,
      statusLabel: '',
      appProgress: '',
    }
  },
  computed: {
    canReset() {
      return this.confirmText.trim().toUpperCase() === 'WIPE' && !this.isResetting
    },
  },
  methods: {
    async reset() {
      if (!this.canReset) return
      this.isResetting = true

      // Phase 1 — uninstall every compose app and delete their userdata.
      // We list first so we can show "Removing X of N apps", then run
      // syncApps with an empty target. After it finishes we list AGAIN
      // and retry any leftovers individually — Docker can take a moment
      // to surface a clean state, so a 2nd pass catches stragglers.
      this.statusLabel = this.$t('Removing installed apps…')
      let installed = []
      try {
        installed = await listInstalledAppIds(this.$openAPI)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Factory reset: pre-uninstall list failed', e)
      }
      // eslint-disable-next-line no-console
      console.info('Factory reset: uninstalling apps', installed)
      this.appProgress = installed.length === 0
        ? this.$t('No apps installed.')
        : `${this.$t('Found')} ${installed.length} ${this.$t('apps')}`

      if (installed.length > 0) {
        try {
          await syncApps(
            this.$openAPI,
            [],
            (entry) => {
              if (entry.state === 'running') {
                this.appProgress = `${this.$t('Removing')} ${entry.id}…`
              } else if (entry.state === 'done') {
                this.appProgress = `${this.$t('Removed')} ${entry.id}`
              } else if (entry.state === 'error') {
                // eslint-disable-next-line no-console
                console.warn('Factory reset: failed to remove', entry.id, entry.error)
              }
            },
            { deleteUserdata: true },
          )
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Factory reset: syncApps threw', e)
        }

        // Verification pass — anything still listed gets a second try.
        let leftovers = []
        try {
          leftovers = await listInstalledAppIds(this.$openAPI)
        } catch (e) { /* ignore */ }
        if (leftovers.length > 0) {
          this.appProgress = `${this.$t('Retrying')} ${leftovers.length} ${this.$t('apps')}…`
          // eslint-disable-next-line no-console
          console.warn('Factory reset: leftover apps after first pass', leftovers)
          for (const id of leftovers) {
            try {
              this.appProgress = `${this.$t('Removing')} ${id}…`
              await uninstallApp(this.$openAPI, id, { deleteUserdata: true })
            } catch (e) {
              // eslint-disable-next-line no-console
              console.warn('Factory reset: second-pass uninstall failed for', id, e)
            }
          }
        }
      }
      this.appProgress = ''

      // Phase 2 — delete the user-data folders under /DATA. We list
      // first so we only delete what's actually there (the install may
      // not have every folder), and we go one folder at a time so a
      // single failure (locked file, etc.) doesn't abort the rest.
      this.statusLabel = this.$t('Deleting files in /DATA…')
      try {
        const list = await this.$api.folder.getList('/DATA')
        const items = (list && list.data && list.data.data && list.data.data.content) || []
        const presentPaths = items.map(i => i && i.path).filter(Boolean)
        const toDelete = presentPaths.filter(p => DATA_FOLDERS_TO_WIPE.includes(p))
        // batch.delete expects a JSON-stringified array body
        // (see the existing call site in mixins/mixin.js).
        if (toDelete.length > 0) {
          await this.$api.batch.delete(JSON.stringify(toDelete))
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Factory reset: /DATA wipe partially failed', e)
      }

      // Phase 3 — wipe KODE-specific custom storage while we still have
      // auth. allSettled so a single failure doesn't abort the reset.
      this.statusLabel = this.$t('Clearing settings…')
      await Promise.allSettled([
        this.$api.users.setCustomStorage('kode_first_boot', {}),
        this.$api.users.setCustomStorage('kode_pebble_name', {}),
      ])

      // Phase 4 — delete all user accounts. Load-bearing destructive
      // call; if it fails the user is stuck in a half-reset state, so
      // we abort and surface the error.
      this.statusLabel = this.$t('Removing accounts…')
      try {
        await this.$api.users.deleteAllUser()
      } catch (err) {
        const detail = (err && err.response && err.response.data && err.response.data.message) || err.message || ''
        this.$buefy.toast.open({
          message: `${this.$t('Reset failed — could not delete accounts.')} ${detail}`,
          type: 'is-danger',
          position: 'is-top',
          duration: 5000,
        })
        this.isResetting = false
        return
      }

      // Phase 5 — wipe KODE-controlled localStorage + auth tokens.
      this.statusLabel = this.$t('Finishing up…')
      const keysToKill = [
        'kode_interface_mode',
        'kode_tile_order',
        'kode_tour_seen',
        'kode_hint_mode',
        'kode_columns_layout_v2',
        'kode_columns_weights_v1',
        'kode_column_count_v1',
        'kode_user_templates_v1',
        'kode_clock_settings',
        'kode_weather_settings',
        'kode_potd_settings',
        'kode_potd_cache_v1',
        'kode_recent_expanded',
        'kode_sysinfo_settings',
        'kode_network_settings',
        'kode_network_interface',
        'kode_advanced_view',
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

      // Phase 6 — reset Vuex so the router's beforeEach guard sees us
      // as uninitialized and routes /welcome on next nav.
      this.$store.commit('SET_NEED_INITIALIZATION', true)
      this.$store.commit('SET_ACCESS_TOKEN', '')
      this.$store.commit('SET_REFRESH_TOKEN', '')
      this.$store.commit('SET_USER', {
        avatar: '', created_at: '', description: '', email: '', id: 0,
        nickname: '', role: '', updated_at: '', username: '',
      })

      this.$emit('close')

      // Phase 7 — hard reload to /welcome so all in-memory state from
      // any component (caches, polls, sockets) is dropped.
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

.destroy-block {
  background: rgba(176, 74, 74, 0.08);
  border: 1px solid rgba(176, 74, 74, 0.22);
  border-radius: 12px;
  padding: 0.9rem 1.1rem;
  margin-bottom: 1.25rem;

  ul {
    margin: 0.25rem 0 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.8125rem;
    line-height: 1.55;
    color: rgba(0, 0, 0, 0.78);
  }

  li {
    padding: 0.2rem 0;
    padding-left: 0.9rem;
    position: relative;

    &::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #b04a4a;
      font-weight: 700;
    }
  }
}

.destroy-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #b04a4a;
  margin-bottom: 0.5rem;
}

.confirm-prompt {
  font-size: 0.9375rem;
  margin-bottom: 0.5rem;
  color: rgba(0, 0, 0, 0.78);

  strong {
    background: rgba(176, 74, 74, 0.12);
    color: #b04a4a;
    padding: 1px 8px;
    border-radius: 4px;
    font-family: monospace;
    letter-spacing: 0.05em;
  }
}

.confirm-input {
  max-width: 220px;
}

.progress-block {
  margin-top: 1rem;
  padding: 0.75rem 0.9rem;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

.progress-sub {
  margin-top: 0.25rem;
  margin-left: 1.6rem;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
  font-feature-settings: 'tnum' 1;
}

.spinner {
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.18);
  border-top-color: #b04a4a;
  animation: factory-spin 0.7s linear infinite;
}
@keyframes factory-spin { to { transform: rotate(360deg); } }

.modal-card-foot { gap: 0.5rem; }
</style>
