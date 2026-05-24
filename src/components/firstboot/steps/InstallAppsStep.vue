<template>
  <div class="fb-step install-apps-step has-text-white">
    <h1 class="title is-3 has-text-white">{{ $t('Installing your apps') }}</h1>
    <p class="subtitle is-6 has-text-white-bis">
      <span v-if="phase === 'idle' || phase === 'starting'">
        {{ $t('We\'ll install the apps you picked and remove the ones you didn\'t. This takes about a minute per app.') }}
      </span>
      <span v-else-if="phase === 'running'">
        {{ $t('Hang tight — Docker is pulling and starting your apps.') }}
      </span>
      <span v-else-if="phase === 'done' && errorCount === 0">
        {{ $t('All done. Continue to the walkthroughs.') }}
      </span>
      <span v-else-if="phase === 'done' && errorCount > 0">
        {{ $t('Finished with a few errors. You can continue and retry from Settings → Re-run setup later.') }}
      </span>
    </p>

    <ul v-if="rows.length > 0" class="install-list">
      <li
        v-for="row in rows"
        :key="`${row.action}-${row.id}`"
        class="install-row"
        :class="`is-${row.state}`"
      >
        <span class="install-icon">
          <b-icon v-if="row.state === 'pending'" icon="time-outline" pack="casa" size="is-small" />
          <span v-else-if="row.state === 'running' || row.state === 'starting'" class="spinner"></span>
          <b-icon v-else-if="row.state === 'done'" icon="check-outline" pack="casa" size="is-small" />
          <b-icon v-else icon="alert" pack="casa" size="is-small" />
        </span>
        <div class="install-text">
          <div class="install-name">
            {{ row.action === 'uninstall' ? $t('Removing') : $t('Installing') }}
            <strong>{{ row.id }}</strong>
          </div>
          <div v-if="row.state === 'starting'" class="install-detail">
            {{ $t('Container is starting up') }}{{ row.detail ? ` (${row.detail})` : '…' }}
          </div>
          <div v-if="row.state === 'error' && row.error" class="install-error">{{ row.error }}</div>
        </div>
        <span class="install-status">{{ statusLabel(row.state) }}</span>
      </li>
    </ul>

    <!-- If anything failed, show a Retry button so the user can take
         another pass without going back through the wizard. -->
    <div v-if="errorCount > 0 && phase === 'done'" class="install-retry">
      <p class="install-retry-text">
        {{ $t('Some apps couldn\'t finish installing. You can retry now or skip and re-run setup later from Settings.') }}
      </p>
      <b-button rounded size="is-small" type="is-warning" @click="runSync">
        {{ $t('Retry failed installs') }}
      </b-button>
    </div>

    <div v-else-if="phase === 'done'" class="install-empty">
      {{ $t('Nothing to change — your app selection already matches what\'s installed.') }}
    </div>

    <div class="install-actions">
      <b-button rounded :disabled="phase === 'running'" @click="$emit('back')">
        {{ $t('Back') }}
      </b-button>
      <div class="is-flex-grow-1"></div>
      <b-button
        rounded
        type="is-primary"
        :loading="phase === 'running'"
        :disabled="phase === 'idle' || phase === 'starting'"
        @click="$emit('next')"
      >
        {{ phase === 'running' ? $t('Installing…') : $t('Continue') }}
      </b-button>
    </div>
  </div>
</template>

<script>
/*
 * First-boot wizard step that reconciles the user's picked apps with
 * what's actually installed on the pebble. Runs syncApps from
 * @/service/appSync on mount, streams per-app progress into the list,
 * and unlocks Continue when everything has finished (success or
 * error). Replay-safe: re-running the wizard with the same picks is a
 * no-op since syncApps's diff returns an empty install/uninstall set.
 */
import { syncApps } from '@/service/appSync'
import { prepareYamlByAppId } from '@/service/appBootstrap'

// Standard /DATA folders we make sure exist before installing apps.
// Jellyfin specifically asks the buyer to select library paths during
// its setup wizard — if /DATA/Movies / /DATA/Shows / /DATA/Music don't
// exist, the path picker has nothing to select. Idempotent:
// folder.create() returns an error if the folder already exists which
// we swallow.
const DATA_FOLDERS = [
  '/DATA/Photos',
  '/DATA/Videos',
  '/DATA/Movies',
  '/DATA/Shows',
  '/DATA/Documents',
  '/DATA/Music',
  '/DATA/Downloads',
  '/DATA/Backups',
  '/DATA/Gallery',
  '/DATA/AppData',
]

export default {
  name: 'InstallAppsStep',
  props: {
    // Appstore ids the user wants installed (NOT picker keys; the
    // mapping is done one step up in PickAppsStep before emit).
    targetIds: { type: Array, default: () => [] },
    // Pebble's hostname/IP — used to build per-app URLs (Immich on
    // :2283, Jellyfin on :8096, etc.) when calling each app's first-
    // run bootstrap.
    host: { type: String, default: '' },
    // Owner credentials captured in AdminAccountStep. Used to auto-
    // provision the buyer's account in each app (Immich admin signup,
    // Jellyfin setup wizard, HA owner onboarding, Pi-hole password)
    // so the buyer never sees a "set up your account" screen post-
    // install. Format: { username, email, password, fullName, language }
    creds: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      phase: 'idle',       // idle | starting | running | done
      rows: [],            // [{ id, action, state, error? }]
    }
  },
  computed: {
    errorCount() { return this.rows.filter(r => r.state === 'error').length },
  },
  async mounted() {
    await this.$nextTick()
    this.runSync()
  },
  methods: {
    statusLabel(state) {
      switch (state) {
        case 'pending':       return this.$t('Pending')
        case 'running':       return this.$t('Installing…')
        case 'starting':      return this.$t('Starting…')
        case 'done':          return this.$t('Ready')
        case 'error':         return this.$t('Failed')
        default:              return ''
      }
    },
    async ensureDataFolders() {
      // Best-effort: create every standard folder under /DATA so the
      // app walkthroughs (especially Jellyfin's library picker) have
      // something to point at. Failures are non-blocking — the folder
      // probably already exists.
      for (const path of DATA_FOLDERS) {
        try { await this.$api.folder.create(path) } catch (e) { /* exists or permission */ }
      }
    },
    async runSync() {
      this.phase = 'starting'
      this.rows = []
      // Make sure /DATA/* exists BEFORE installs so any compose file
      // that bind-mounts /DATA/AppData/* has a parent to attach to.
      await this.ensureDataFolders()
      try {
        await syncApps(
          this.$openAPI,
          this.targetIds,
          (entry) => {
            // The progress callback fires repeatedly per app as it
            // transitions pending → running → starting → done/error.
            // Upsert by (id, action) so each row tracks its own state.
            const existing = this.rows.find(r => r.id === entry.id && r.action === entry.action)
            if (existing) {
              existing.state = entry.state
              if (entry.error) existing.error = entry.error
              if (entry.detail != null) existing.detail = entry.detail
            } else {
              this.rows.push({ ...entry })
            }
            if (this.phase === 'starting') this.phase = 'running'
          },
          {
            // Pre-install YAML transforms: lets us inject the buyer's
            // password into env vars (Pi-hole) so the container boots
            // with the right credentials already baked in.
            prepareYaml: (appId, yaml) => prepareYamlByAppId(appId, yaml, this.creds),
          },
        )
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('InstallAppsStep: syncApps threw', e)
      }

      this.phase = 'done'
    },
  },
}
</script>

<style lang="scss" scoped>
.fb-step { animation: ias-fade 0.4s ease both; }
@keyframes ias-fade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Override Bulma's `.title + .subtitle { margin-top: -1.25rem }`. */
.title { margin-bottom: 0.5rem !important; line-height: 1.2 !important; }
.subtitle {
  margin-top: 0 !important;
  margin-bottom: 1.25rem !important;
  opacity: 0.85;
  min-height: 2.5em;
  line-height: 1.45 !important;
}

.install-list {
  list-style: none;
  margin: 0 0 1.25rem 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.install-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.85rem;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  transition: background 0.2s, border-color 0.2s;

  &.is-running,
  &.is-starting {
    background: rgba(45, 95, 78, 0.32);
    border-color: rgba(45, 95, 78, 0.85);
  }
  &.is-done {
    background: rgba(45, 95, 78, 0.20);
    border-color: rgba(45, 95, 78, 0.4);
  }
  &.is-error {
    background: rgba(176, 74, 74, 0.20);
    border-color: rgba(176, 74, 74, 0.55);
  }
}

.install-icon {
  flex: 0 0 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  .is-done & { background: rgba(45, 95, 78, 0.95); }
  .is-error & { background: rgba(176, 74, 74, 0.95); }
}

.spinner {
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: ias-spin 0.7s linear infinite;
}
@keyframes ias-spin { to { transform: rotate(360deg); } }

.install-text {
  flex: 1;
  min-width: 0;
}

.install-name {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.92);

  strong {
    color: #fff;
    font-weight: 600;
    margin-left: 0.2rem;
  }
}

.install-detail {
  margin-top: 2px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.65);
  font-feature-settings: 'tnum' 1;
}

.install-error {
  font-size: 0.75rem;
  color: rgba(255, 220, 220, 0.92);
  margin-top: 2px;
  word-break: break-word;
}

.install-retry {
  margin-bottom: 1rem;
  padding: 0.75rem 0.9rem;
  background: rgba(196, 127, 0, 0.18);
  border: 1px solid rgba(196, 127, 0, 0.4);
  border-radius: 12px;

  .install-retry-text {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 0.5rem;
    line-height: 1.45;
  }
}

.install-status {
  flex-shrink: 0;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.85);

  .is-done & { background: rgba(45, 95, 78, 0.85); color: #fff; }
  .is-error & { background: rgba(176, 74, 74, 0.85); color: #fff; }
}

.install-empty {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.06);
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
}

.install-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
