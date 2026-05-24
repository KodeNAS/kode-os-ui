<!--
  KODE OS first-boot wizard. Replaces the upstream CasaOS Welcome flow
  (Welcome → Create Account) with a multi-step setup: Welcome → System
  check → Admin account → Pebble name → Pick apps → per-app walkthroughs
  → Done. Reuses upstream auth/register/login plumbing via the
  AdminAccountStep component.

  Copyright (c) 2022 by IceWhale (original Welcome.vue)
  KODE OS additions © KODE NAS, licensed separately.
-->
<template>
  <div id="kode-firstboot" class="is-flex is-justify-content-center is-align-items-center">
    <div v-if="!isLoading" class="firstboot-shell">
      <!-- Compact step rail (skipped on welcome / user-type / done screens) -->
      <ol v-if="showRail" class="fb-rail">
        <li
          v-for="(label, i) in railLabels"
          :key="i"
          class="fb-rail-item"
          :class="{
            'is-current': i === railIndex,
            'is-done': i < railIndex,
          }"
        >
          <span class="fb-rail-dot">{{ i + 1 }}</span>
          <span class="fb-rail-label">{{ label }}</span>
        </li>
      </ol>

      <transition name="fb-fade" mode="out-in">
        <LanguageStep  v-if="stepIndex === 0" key="lang"         @next="onLanguagePicked" />
        <WelcomeStep   v-else-if="stepIndex === 1" key="welcome"  :is-replay="isReplay" @next="next" />
        <UserTypeStep  v-else-if="stepIndex === 2" key="usertype" @next="onUserType" />
        <SystemCheckStep    v-else-if="stepIndex === 3" key="sys" @next="next"            @back="back" />
        <AdminAccountStep   v-else-if="stepIndex === 4" key="adm" @next="onAdminDone"     @back="back" />
        <PebbleNameStep     v-else-if="stepIndex === 5" key="nm"  @next="onPebbleNameDone" @back="back" />
        <PickAppsStep       v-else-if="stepIndex === 6" key="ap"  @next="onAppsPicked"    @back="back" />
        <LayoutChooserStep  v-else-if="stepIndex === 7" key="lc"  @next="onLayoutPicked"  @back="back" />
        <InstallAppsStep
          v-else-if="stepIndex === 8" key="ia"
          :target-ids="targetAppstoreIds"
          :host="host"
          :creds="{ username: adminUsername, email: adminEmail, password: adminPassword, fullName: adminFullName, language }"
          @next="onInstallDone" @back="back"
        />
        <WalkthroughStep    v-else-if="stepIndex === 9" key="wt"  :apps="pickedApps" :host="host" @next="next" @back="back" @restart="restart" />
        <DoneStep           v-else-if="stepIndex === 10" key="dn" :hostname="hostname" :apps="pickedApps" :is-replay="isReplay" @finish="finish" />
      </transition>

      <!-- Dev wipe — pinned to the wizard shell so it's reachable from
           every step. Opens the same FactoryResetModal the Settings
           page uses, with the same type-WIPE confirmation. -->
      <button
        type="button"
        class="fb-wipe"
        :title="$t('Factory reset (developer)')"
        @click="openWipe"
      >
        <b-icon icon="alert" pack="casa" size="is-small" />
        <span>{{ $t('Wipe') }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import WelcomeStep      from '@/components/firstboot/steps/WelcomeStep.vue'
import LanguageStep     from '@/components/firstboot/steps/LanguageStep.vue'
import UserTypeStep     from '@/components/firstboot/steps/UserTypeStep.vue'
import SystemCheckStep  from '@/components/firstboot/steps/SystemCheckStep.vue'
import AdminAccountStep from '@/components/firstboot/steps/AdminAccountStep.vue'
import PebbleNameStep   from '@/components/firstboot/steps/PebbleNameStep.vue'
import PickAppsStep     from '@/components/firstboot/steps/PickAppsStep.vue'
import LayoutChooserStep from '@/components/firstboot/steps/LayoutChooserStep.vue'
import InstallAppsStep  from '@/components/firstboot/steps/InstallAppsStep.vue'
import WalkthroughStep  from '@/components/firstboot/steps/WalkthroughStep.vue'
import DoneStep         from '@/components/firstboot/steps/DoneStep.vue'
import FactoryResetModal from '@/components/settings/FactoryResetModal.vue'
import { TEMPLATES } from '@/service/dashboardTemplates'

export default {
  name: 'welcome-page',
  components: {
    WelcomeStep,
    LanguageStep,
    UserTypeStep,
    SystemCheckStep,
    AdminAccountStep,
    PebbleNameStep,
    PickAppsStep,
    LayoutChooserStep,
    InstallAppsStep,
    WalkthroughStep,
    DoneStep,
  },
  data() {
    return {
      isLoading: true,
      stepIndex: 0,
      lastStep: 10,
      adminCreated: false,
      userType: '', // 'beginner' | 'normal' | 'developer' — chosen at step 2
      // Compact rail labels for steps 3..9 (Language + Welcome + UserType + Done are hidden).
      railLabels: [
        this.$t('Check'),
        this.$t('Account'),
        this.$t('Name'),
        this.$t('Apps'),
        this.$t('Layout'),
        this.$t('Install'),
        this.$t('Set up'),
      ],
      // Collected wizard data
      language: 'en_us',
      adminUsername: '',
      adminEmail: '',
      adminFullName: '',
      adminPassword: '',
      hostname: 'pebble',
      pickedApps: [],
      // Appstore ids derived from pickedApps. PickAppsStep emits this
      // alongside the picker keys so InstallAppsStep doesn't have to
      // re-derive the mapping.
      targetAppstoreIds: [],
      // Default to the user's "Default" template if they don't visit
      // the layout chooser (e.g. developer fast-path).
      chosenLayoutKey: 'builtin-default',
      host: window.location.hostname || 'pebble.local',
    }
  },
  computed: {
    railIndex() {
      // rail items map to stepIndex 3..9 (SystemCheck through Walkthrough)
      return Math.max(0, Math.min(this.railLabels.length - 1, this.stepIndex - 3))
    },
    showRail() {
      return this.stepIndex >= 3 && this.stepIndex < this.lastStep
    },
    isReplay() {
      return this.$route.query.replay === '1'
    },
  },
  async mounted() {
    // Pre-flight: if an admin account already exists on the pebble
    // (either because this is a Settings → replay run, or because the
    // wizard was completed once and we're walking it again in a
    // different mode), pre-fill the credentials bag and flip
    // `adminCreated` so AdminAccountStep is skipped end-to-end. This
    // is what makes running setup in beginner THEN re-running in
    // developer (or vice-versa) not prompt for a new account.
    try {
      const statusRes = await this.$api.users.getUserStatus()
      const data = statusRes && statusRes.data && statusRes.data.data
      // The init `key` is only emitted while the pebble has zero
      // admins. Its absence means an account already exists.
      const needsInit = !!(data && data.key)
      if (!needsInit) {
        this.adminCreated = true
        // Pull the current user's username/email/fullName so InstallApps
        // (and any future bootstrap helpers) get the same identity the
        // user originally set, regardless of which mode they replay in.
        try {
          const userRes = await this.$api.users.getUserInfo()
          const u = (userRes && userRes.data && userRes.data.data) || {}
          if (u.user_name) this.adminUsername = u.user_name
          else if (u.username) this.adminUsername = u.username
          if (u.email)     this.adminEmail    = u.email
          if (u.nickname)  this.adminFullName = u.nickname
          else if (u.description) this.adminFullName = u.description
          // Password is intentionally NOT recoverable from the backend.
          // Walkthroughs always tell the user "use the same password
          // you set in KODE", so leaving this blank is fine — the only
          // place that read it (the post-install bootstrap loop) was
          // removed when we cleaned up the "setup" indicators.
        } catch (e) { /* non-blocking — we still skip AdminAccountStep */ }
        // Pre-fill hostname + last-picked apps from custom storage so
        // re-running in a different mode preserves prior choices.
        try {
          const fb = await this.$api.users.getCustomStorage('kode_first_boot')
          const raw = (fb && fb.data && fb.data.data) || {}
          if (raw.hostname) this.hostname = raw.hostname
          if (Array.isArray(raw.apps)) this.pickedApps = raw.apps
        } catch (e) { /* non-blocking */ }
      }
    } catch (e) { /* getUserStatus failed — fall back to fresh wizard */ }

    this.isLoading = false
  },
  methods: {
    next() {
      if (this.stepIndex >= this.lastStep) return
      // Skip the AdminAccountStep when an account already exists —
      // covers both ?replay=1 (from Settings → walk through setup
      // again) and a fresh in-session replay from a previous wizard
      // run (e.g. beginner → developer in the same browsing session).
      // SystemCheck is step 3, AdminAccountStep is step 4, PebbleName 5.
      if ((this.isReplay || this.adminCreated) && this.stepIndex === 3) {
        this.stepIndex = 5
        return
      }
      this.stepIndex += 1
    },
    async back() {
      if (this.stepIndex <= 0) return

      // Skip backward past AdminAccountStep (step 4) when an account exists;
      // re-entering would try to re-register on top of the existing one.
      if (this.stepIndex === 5 && (this.adminCreated || this.isReplay)) {
        this.stepIndex = 3
        return
      }

      // Returning to UserTypeStep (step 2) with a fresh account means the user
      // is changing their mind — delete the account so initKey regenerates and
      // the next forward pass can register with new credentials.
      if (this.stepIndex === 3 && this.adminCreated && !this.isReplay) {
        await this.deleteAccount()
        this.stepIndex = 2
        return
      }

      this.stepIndex -= 1
    },
    async deleteAccount() {
      try {
        await this.$api.users.deleteAllUser()
        const statusRes = await this.$api.users.getUserStatus()
        const key = statusRes && statusRes.data && statusRes.data.data && statusRes.data.data.key
        if (key) this.$store.commit('SET_INIT_KEY', key)
        this.$store.commit('SET_NEED_INITIALIZATION', true)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        this.adminCreated = false
        this.adminUsername = ''
      } catch (e) {
        this.$buefy.toast.open({
          message: this.$t('Couldn\'t roll back the account. Use Factory reset in Settings to start cleanly.'),
          type: 'is-warning',
          position: 'is-top',
          duration: 6000,
        })
      }
    },
    onLanguagePicked(payload) {
      if (payload && payload.language) this.language = payload.language
      this.next()
    },
    openWipe() {
      // Same modal Settings → Factory reset opens. On confirm it
      // wipes accounts + /DATA + custom storage + localStorage and
      // hard-reloads to /welcome, which is exactly what dev wants
      // when iterating on the wizard.
      this.$buefy.modal.open({
        parent: this,
        component: FactoryResetModal,
        hasModalCard: true,
        trapFocus: true,
        canCancel: ['x', 'outside', 'escape'],
        animation: 'zoom-in',
      })
    },
    onUserType(payload) {
      const type = (payload && payload.userType) || 'beginner'
      this.userType = type
      // Developer skips the SystemCheck. If no admin exists yet we
      // still need to walk through AdminAccountStep (the router
      // bounces back to /welcome until the pebble is initialized).
      // But if an account is already set up — e.g. the user finished
      // the wizard in beginner and is now replaying as developer —
      // skip account creation entirely and finish immediately.
      if (type === 'developer') {
        if (this.adminCreated) {
          this.finishDeveloper()
          return
        }
        this.stepIndex = 4
        return
      }
      this.next()
    },
    async finishDeveloper() {
      // Mark wizard complete with developer profile. KODE OS no longer
      // exposes an Advanced mode — there's only one dashboard now, so
      // every user-type lands on the same widget canvas.
      try {
        await this.$api.users.setCustomStorage('kode_first_boot', {
          complete: true,
          completed_at: new Date().toISOString(),
          user_type: 'developer',
          skipped: true,
        })
      } catch (e) { /* non-blocking */ }
      this.resetDashboardLayoutForFirstBoot()
      sessionStorage.setItem('fromWelcome', true)
      this.$router.push('/')
    },
    async restart() {
      // The user wants the wizard fully re-runnable. If an account was
      // created during this attempt, delete it so initKey gets regenerated.
      if (this.adminCreated) {
        await this.deleteAccount()
      }
      this.hostname = 'pebble'
      this.pickedApps = []
      this.userType = ''
      this.stepIndex = 0
    },
    onAdminDone(payload) {
      if (payload) {
        if (payload.username) this.adminUsername = payload.username
        if (payload.email)    this.adminEmail    = payload.email
        if (payload.fullName) this.adminFullName = payload.fullName
        if (payload.password) this.adminPassword = payload.password
      }
      this.adminCreated = true
      // Developer mode finishes immediately after account creation,
      // skipping PebbleName, PickApps, and Walkthroughs.
      if (this.userType === 'developer') {
        this.finishDeveloper()
        return
      }
      this.next()
    },
    onPebbleNameDone(payload) {
      if (payload && payload.hostname) this.hostname = payload.hostname
      this.next()
    },
    onAppsPicked(payload) {
      if (payload && Array.isArray(payload.apps)) this.pickedApps = payload.apps
      if (payload && Array.isArray(payload.targetIds)) this.targetAppstoreIds = payload.targetIds
      // Always advance to LayoutChooser (step 7) — whether or not any
      // apps were picked. From there the user can choose their starting
      // dashboard layout, then we run the install/sync step, then the
      // walkthroughs (conditional on having any apps).
      this.stepIndex = 7
    },
    onLayoutPicked(payload) {
      if (payload && payload.templateKey) this.chosenLayoutKey = payload.templateKey
      // After Layout: always run InstallApps (step 8), even with zero
      // apps — that step's diff will be a no-op but it still confirms
      // the install state matches the picks.
      this.stepIndex = 8
    },
    onInstallDone() {
      // After install/sync: walkthroughs (step 9) only if the user
      // picked at least one app, otherwise jump straight to Done (10).
      this.stepIndex = this.pickedApps.length > 0 ? 9 : 10
    },
    async finish() {
      // Only persist the first-boot complete flag on initial setup; replay
      // runs from Settings shouldn't clobber the original completed_at.
      if (!this.isReplay) {
        try {
          await this.$api.users.setCustomStorage('kode_first_boot', {
            complete: true,
            completed_at: new Date().toISOString(),
            hostname: this.hostname,
            apps: this.pickedApps,
            user_type: this.userType || 'beginner',
          })
        } catch (e) { /* non-blocking */ }

        // Advanced mode is gone in KODE OS — every userType lands on
        // the same widget canvas.
        this.resetDashboardLayoutForFirstBoot()
        sessionStorage.setItem('fromWelcome', true)
      }
      this.$router.push('/')
    },
    resetDashboardLayoutForFirstBoot() {
      // After a factory reset / fresh install, write the user's chosen
      // starting layout (from LayoutChooserStep) into localStorage so
      // the dashboard mounts onto it directly. Falls back to clearing
      // the keys for the 'blank' choice (so the dashboard's loadLayout
      // applies DEFAULT_LAYOUT, which IS the user's "Default" template
      // already) and for any unrecognized key.
      try {
        localStorage.removeItem('kode_tile_order') // legacy
        // Record which premade the buyer picked so the dashboard tour
        // can show layout-specific copy on first run. Cleared as soon
        // as the user edits anything via saveLayout in BeginnerDashboard.
        if (this.chosenLayoutKey && this.chosenLayoutKey !== 'blank') {
          localStorage.setItem('kode_chosen_template_v1', this.chosenLayoutKey)
        } else {
          localStorage.removeItem('kode_chosen_template_v1')
        }
        if (this.chosenLayoutKey === 'blank') {
          // Blank canvas — start with empty columns. Write a single
          // 2-column empty layout so the user has something to drop
          // widgets into without invoking the Default fallback.
          localStorage.setItem('kode_columns_layout_v2', JSON.stringify([
            { widgets: [], subCols: null },
            { widgets: [], subCols: null },
          ]))
          localStorage.setItem('kode_columns_weights_v1', JSON.stringify([1, 1]))
          localStorage.setItem('kode_column_count_v1', '2')
          return
        }
        const t = TEMPLATES.find(x => x.key === this.chosenLayoutKey)
        if (!t) {
          // Unknown key — clear so loadLayout falls back to DEFAULT_LAYOUT.
          localStorage.removeItem('kode_columns_layout_v2')
          localStorage.removeItem('kode_columns_weights_v1')
          localStorage.removeItem('kode_column_count_v1')
          return
        }
        // Normalize cols into the canonical {widgets, subCols} shape so
        // the dashboard's loader doesn't have to coerce legacy arrays.
        const cleaned = t.cols.map(c => (
          Array.isArray(c)
            ? { widgets: [...c], subCols: null }
            : {
                widgets: Array.isArray(c.widgets) ? [...c.widgets] : [],
                subCols: Array.isArray(c.subCols) ? c.subCols.map(s => [...s]) : null,
              }
        ))
        localStorage.setItem('kode_columns_layout_v2', JSON.stringify(cleaned))
        if (Array.isArray(t.weights) && t.weights.length === cleaned.length) {
          localStorage.setItem('kode_columns_weights_v1', JSON.stringify(t.weights))
        } else {
          localStorage.removeItem('kode_columns_weights_v1')
        }
        localStorage.setItem('kode_column_count_v1', String(cleaned.length))
      } catch (e) { /* ignore */ }
    },
  },
}
</script>

<style lang="scss" scoped>
#kode-firstboot {
  height: calc(100% - 5.5rem);
  position: relative;
  z-index: 500;
  padding: 1.5rem;
}

.firstboot-shell {
  position: relative;
  width: 640px;
  max-width: 100%;
  /* Cap the shell at the viewport so a tall step (the install
     progress list, mostly) scrolls inside the box instead of pushing
     content out of the bottom of the card. */
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
  overflow-x: hidden;
  /* Global wallpaper scrim in App.vue handles base darkening. Shell adds
     a touch more so the card pops off the wallpaper evenly. The inset
     highlight + slightly larger radius give the wizard a softer, more
     "panel"-feeling silhouette that matches the dashboard tiles. */
  background: rgba(15, 25, 30, 0.32);
  backdrop-filter: blur(22px) saturate(180%);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 28px;
  padding: 2.25rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 24px 60px rgba(0, 0, 0, 0.38);

  /* Subtle scrollbar that matches the rest of the OS. */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.25); border-radius: 999px; }
}

/* Compact step rail. With 7 steps we ran out of horizontal room to
   show every label without truncating to "A...", "I...", "S..."; the
   solution is dots-only for everything except the active step, which
   expands into a pill carrying its own label. Done dots are filled,
   upcoming dots are translucent. */
.fb-rail {
  list-style: none;
  margin: 0 0 1.25rem 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.fb-rail-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.4rem 0.25rem 0.25rem;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.75rem;
  transition: background 0.18s ease, color 0.18s ease, padding 0.18s ease;
  flex-shrink: 0;

  &.is-current {
    background: rgba(255, 255, 255, 0.22);
    color: #fff;
    font-weight: 500;
    padding: 0.25rem 0.75rem 0.25rem 0.25rem;
    flex-shrink: 1;
    min-width: 0;
  }
  &.is-done {
    color: #fff;
  }
}

.fb-rail-dot {
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 600;

  .is-current &,
  .is-done & { background: #2d5f4e; }
}

/* Labels are hidden by default; only the current step's label is
   visible so the rail stays compact and fits without truncation. */
.fb-rail-label {
  display: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fb-rail-item.is-current .fb-rail-label {
  display: inline;
}

.fb-fade-enter-active,
.fb-fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.fb-fade-enter,
.fb-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Dev wipe — small pill in the bottom-right of the wizard shell.
   Low-prominence (red on hover only) so it doesn't compete with the
   primary CTA, but always reachable across every step. */
.fb-wipe {
  position: absolute;
  bottom: 0.85rem;
  right: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 4px 9px;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  z-index: 5;

  &:hover {
    color: #fff;
    background: rgba(176, 74, 74, 0.55);
    border-color: rgba(176, 74, 74, 0.7);
  }

  ::v-deep .icon { color: inherit; }
}
</style>
