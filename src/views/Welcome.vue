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
        <LanguageStep  v-if="stepIndex === 0" key="lang"         @next="next" />
        <WelcomeStep   v-else-if="stepIndex === 1" key="welcome"  :is-replay="isReplay" @next="next" />
        <UserTypeStep  v-else-if="stepIndex === 2" key="usertype" @next="onUserType" />
        <SystemCheckStep    v-else-if="stepIndex === 3" key="sys" @next="next"            @back="back" />
        <AdminAccountStep   v-else-if="stepIndex === 4" key="adm" @next="onAdminDone"     @back="back" />
        <PebbleNameStep     v-else-if="stepIndex === 5" key="nm"  @next="onPebbleNameDone" @back="back" />
        <PickAppsStep       v-else-if="stepIndex === 6" key="ap"  @next="onAppsPicked"    @back="back" />
        <LayoutChooserStep  v-else-if="stepIndex === 7" key="lc"  @next="onLayoutPicked"  @back="back" />
        <InstallAppsStep    v-else-if="stepIndex === 8" key="ia"  :target-ids="targetAppstoreIds" @next="onInstallDone" @back="back" />
        <WalkthroughStep    v-else-if="stepIndex === 9" key="wt"  :apps="pickedApps" :host="host" @next="next" @back="back" @restart="restart" />
        <DoneStep           v-else-if="stepIndex === 10" key="dn" :hostname="hostname" :apps="pickedApps" :is-replay="isReplay" @finish="finish" />
      </transition>
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
  mounted() {
    this.isLoading = false
  },
  methods: {
    next() {
      if (this.stepIndex >= this.lastStep) return
      // In replay mode, skip the AdminAccountStep — the account already exists.
      // SystemCheck is now step 3 (Language added at index 0); skip to PebbleName (5).
      if (this.isReplay && this.stepIndex === 3) {
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
    onUserType(payload) {
      const type = (payload && payload.userType) || 'beginner'
      this.userType = type
      // Developer skips the SystemCheck but STILL needs to create an admin
      // account — otherwise the router bounces back to /welcome or /login
      // on the next navigation (no initialized user). Jump straight to
      // step 4 (AdminAccountStep); onAdminDone routes developer to finish.
      if (type === 'developer') {
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
</style>
