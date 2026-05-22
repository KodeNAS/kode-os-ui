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
        <WelcomeStep   v-if="stepIndex === 0" key="welcome"      :is-replay="isReplay" @next="next" />
        <UserTypeStep  v-else-if="stepIndex === 1" key="usertype" @next="onUserType" />
        <SystemCheckStep    v-else-if="stepIndex === 2" key="sys" @next="next"            @back="back" />
        <AdminAccountStep   v-else-if="stepIndex === 3" key="adm" @next="onAdminDone"     @back="back" />
        <PebbleNameStep     v-else-if="stepIndex === 4" key="nm"  @next="onPebbleNameDone" @back="back" />
        <PickAppsStep       v-else-if="stepIndex === 5" key="ap"  @next="onAppsPicked"    @back="back" />
        <WalkthroughStep    v-else-if="stepIndex === 6" key="wt"  :apps="pickedApps" :host="host" @next="next" @back="back" @restart="restart" />
        <DoneStep           v-else-if="stepIndex === 7" key="dn"  :hostname="hostname" :apps="pickedApps" :is-replay="isReplay" @finish="finish" />
      </transition>
    </div>
  </div>
</template>

<script>
import WelcomeStep      from '@/components/firstboot/steps/WelcomeStep.vue'
import UserTypeStep     from '@/components/firstboot/steps/UserTypeStep.vue'
import SystemCheckStep  from '@/components/firstboot/steps/SystemCheckStep.vue'
import AdminAccountStep from '@/components/firstboot/steps/AdminAccountStep.vue'
import PebbleNameStep   from '@/components/firstboot/steps/PebbleNameStep.vue'
import PickAppsStep     from '@/components/firstboot/steps/PickAppsStep.vue'
import WalkthroughStep  from '@/components/firstboot/steps/WalkthroughStep.vue'
import DoneStep         from '@/components/firstboot/steps/DoneStep.vue'

export default {
  name: 'welcome-page',
  components: {
    WelcomeStep,
    UserTypeStep,
    SystemCheckStep,
    AdminAccountStep,
    PebbleNameStep,
    PickAppsStep,
    WalkthroughStep,
    DoneStep,
  },
  data() {
    return {
      isLoading: true,
      stepIndex: 0,
      lastStep: 7,
      adminCreated: false,
      userType: '', // 'beginner' | 'normal' | 'developer' — chosen at step 1
      // Compact rail labels for steps 2..6 (welcome + usertype + done are hidden).
      railLabels: [
        this.$t('Check'),
        this.$t('Account'),
        this.$t('Name'),
        this.$t('Apps'),
        this.$t('Set up'),
      ],
      // Collected wizard data
      adminUsername: '',
      hostname: 'pebble',
      pickedApps: [],
      host: window.location.hostname || 'pebble.local',
    }
  },
  computed: {
    railIndex() {
      // rail items map to stepIndex 2..6 (SystemCheck through Walkthrough)
      return Math.max(0, Math.min(this.railLabels.length - 1, this.stepIndex - 2))
    },
    showRail() {
      return this.stepIndex >= 2 && this.stepIndex < this.lastStep
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
      if (this.isReplay && this.stepIndex === 2) {
        this.stepIndex = 4
        return
      }
      this.stepIndex += 1
    },
    async back() {
      if (this.stepIndex <= 0) return

      // Skip backward past AdminAccountStep (step 3) when an account exists;
      // re-entering would try to re-register on top of the existing one.
      if (this.stepIndex === 4 && (this.adminCreated || this.isReplay)) {
        this.stepIndex = 2
        return
      }

      // Returning to UserTypeStep with a fresh account means the user is
      // changing their mind — delete the account so initKey regenerates
      // and the next forward pass can register with new credentials.
      if (this.stepIndex === 2 && this.adminCreated && !this.isReplay) {
        await this.deleteAccount()
        this.stepIndex = 1
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
      // step 3 (AdminAccountStep); onAdminDone routes developer to finish.
      if (type === 'developer') {
        this.stepIndex = 3
        return
      }
      this.next()
    },
    async finishDeveloper() {
      // Mark wizard complete with developer profile + Advanced mode default.
      this.$store.commit('SET_INTERFACE_MODE', 'advanced')
      try {
        await this.$api.users.setCustomStorage('kode_first_boot', {
          complete: true,
          completed_at: new Date().toISOString(),
          user_type: 'developer',
          skipped: true,
        })
      } catch (e) { /* non-blocking */ }
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
      if (payload && payload.username) this.adminUsername = payload.username
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
      // If the user picked zero apps somehow, skip the walkthrough step
      // and go straight to Done. With UserTypeStep inserted at index 1,
      // Walkthrough is now step 6 and Done is step 7.
      this.stepIndex = this.pickedApps.length > 0 ? 6 : 7
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

        // Normal-mode users default to Advanced interface; Beginner defaults to Easy.
        if (this.userType === 'normal') {
          this.$store.commit('SET_INTERFACE_MODE', 'advanced')
        }
        sessionStorage.setItem('fromWelcome', true)
      }
      this.$router.push('/')
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
  width: 560px;
  max-width: 100%;
  /* Global wallpaper scrim in App.vue handles base darkening. Shell adds
     a touch more so the card pops off the wallpaper evenly. */
  background: rgba(15, 25, 30, 0.30);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 22px;
  padding: 2rem;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
}

.fb-rail {
  list-style: none;
  margin: 0 0 1.25rem 0;
  padding: 0;
  display: flex;
  gap: 0.4rem;
}

.fb-rail-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;

  &.is-current {
    background: rgba(255, 255, 255, 0.22);
    color: #fff;
    font-weight: 500;
  }
  &.is-done {
    color: #fff;
  }
}

.fb-rail-dot {
  flex: 0 0 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 500;

  .is-current &,
  .is-done & { background: #2d5f4e; }
}

.fb-rail-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
