<script>
import { nanoid } from 'nanoid'
import TopBar from '@/components/TopBar.vue'
import FilePanel from '@/components/filebrowser/FilePanel.vue'
import UpdateCompleteModal from '@/components/settings/UpdateCompleteModal.vue'
import BeginnerDashboard from '@/views/BeginnerDashboard.vue'
import { mixin } from '@/mixins/mixin'
import events from '@/events/events'

const wallpaperConfig = 'wallpaper'

export default {
  name: 'HomePage',
  components: {
    TopBar,
    FilePanel,
    BeginnerDashboard,
  },
  mixins: [mixin],
  provide() {
    return {
      homeShowFiles: this.showFiles,
    }
  },
  data() {
    return {
      isLoading: true,
      hardwareInfoLoading: true,
      user_id: localStorage.getItem('user_id') ? localStorage.getItem('user_id') : 1,
      isFileActive: false,
      topbarHidden: false,
      // When true, the auto-hide is paused — used by the dashboard
      // tour so it can keep the top bar visible while explaining it.
      topbarLocked: false,
      _topbarHideTimer: null,
      barData: {},
      topBarAni: {
        classes: 'fadeInDown',
        duration: 800,
      },
    }
  },

  computed: {
    sidebarOpen() {
      return this.$store.state.sidebarOpen
    },
    searchbarShow() {
      return this.$store.state.searchEngineSwitch
    },
  },
  created() {
    this.getHardwareInfo()
    this.getWallpaperConfig()
    this.getConfig()

    this.$store.commit('SET_ACCESS_ID', nanoid())
  },
  mounted() {
    window.addEventListener('resize', this.onResize)
    window.addEventListener('mousemove', this.onMouseMoveTopBar)
    // The dashboard tour dispatches these events around its top-bar
    // step so the bar stays visible while the popover points at it.
    window.addEventListener('kode:reveal-topbar', this.lockTopBarVisible)
    window.addEventListener('kode:release-topbar', this.unlockTopBar)
    this.onResize()
    if (localStorage.getItem('is_update') === 'true') {
      this.showUpdateCompleteModal()
      localStorage.removeItem('is_update')
    }
    if (sessionStorage.getItem('fromWelcome')) {
      this.$messageBus('global_newvisit')
      // KODE OS: rssConfirm() removed — was prompting the CasaOS blog
      // news feed on every wizard finish. News-feed surface is off; see
      // BrandBar.vue + TopBar.vue.
      sessionStorage.removeItem('fromWelcome')
    }
    this.$messageBus('global_visit')

    this.$EventBus.$on('casaUI:openStorageManager', () => {
      this.showStorageManagerPanelModal()
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('mousemove', this.onMouseMoveTopBar)
    window.removeEventListener('kode:reveal-topbar', this.lockTopBarVisible)
    window.removeEventListener('kode:release-topbar', this.unlockTopBar)
    if (this._topbarHideTimer) clearTimeout(this._topbarHideTimer)
    this.$EventBus.$off('casaUI:openStorageManager')
  },
  methods: {

    /**
     * @description: Get CasaOS Configs
     * @param {*}
     * @return {*}
     */
    async getConfig() {
      let systemConfig = await this.$api.users.getCustomStorage('system')
      if (systemConfig.data.success != 200 || systemConfig.data.data == '') {
        const barData = {
          lang: this.getLangFromBrowser(),
          search_engine: 'https://duckduckgo.com/?q=',
          search_switch: true,
          recommend_switch: true,
          shortcuts_switch: true,
          widgets_switch: true,
          existing_apps_switch: true,
          rss_switch: this.barData.rss_switch,
        }
        // save
        const saveRes = await this.$api.users.setCustomStorage('system', barData)
        if (saveRes.data.success === 200) {
          systemConfig = saveRes
          this.barData = saveRes.data.data
        }
      }

      this.$store.commit('SET_SEARCH_ENGINE_SWITCH', systemConfig.data.data.search_switch)
      this.$store.commit('SET_RECOMMEND_SWITCH', systemConfig.data.data.recommend_switch)
      this.$store.commit('SET_RSS_SWITCH', systemConfig.data.data.rss_switch)
      this.barData = systemConfig.data.data
      this.isLoading = false
    },

    /**
     * @description: Show SideBar
     * @param {*}
     * @return {*} void
     */
    showSideBar() {
      console.log('showSidebar')
    },

    /**
     * @description: Show Files
     * @param {*}
     * @return {*} void
     */
    showFiles(path) {
      this.isFileActive = true
      // Top bar is desktop-only. Force it hidden the moment files opens
      // and cancel any pending hover-show / hide timers so it can't
      // sneak back in while the file browser is up.
      if (this._topbarHideTimer) {
        clearTimeout(this._topbarHideTimer)
        this._topbarHideTimer = null
      }
      this.topbarHidden = true
      // Let App.vue know to hide the BrandBar attribution row — the
      // translucent file panel lets that text show through otherwise.
      try { window.dispatchEvent(new CustomEvent('kode:files-open')) } catch (e) { /* ignore */ }
      this.$nextTick(() => {
        this.$refs.filePanel.init(path)
      })
    },
    onFilesClose() {
      // Wired to the file-modal close event so App.vue can re-show the
      // BrandBar and the top bar can resume its hover behavior.
      this.isFileActive = false
      try { window.dispatchEvent(new CustomEvent('kode:files-close')) } catch (e) { /* ignore */ }
    },

    afterFileEnter() {
      this.$EventBus.$emit(events.AFTER_FILES_ENTER)
    },

    /**
     * @description: Window Resize Handler
     * @param {*}
     * @return {*} void
     */
    onResize() {
      if (window.innerWidth > 480 && this.sidebarOpen) {
        this.$store.commit('SET_SIDEBAR_CLOSE')
      }
    },

    /**
     * @description: Get Hardware info and save to store
     * @param {*}
     * @return {*} void
     */

    getHardwareInfo() {
      this.$api.sys.getUtilization().then((res) => {
        if (res.data.success === 200) {
          this.hardwareInfoLoading = false
          this.$store.commit('SET_HARDWARE_INFO', res.data.data)
        }
      })
    },

    openHomeContaxtMenu(e) {
      // console.log(e.target);
      this.$EventBus.$emit(events.SHOW_HOME_CONTEXT_MENU, e)
    },

    getWallpaperConfig() {
      this.$api.users.getCustomStorage(wallpaperConfig).then((res) => {
        if (res.data.success === 200 && res.data.data != '') {
          this.$store.commit('SET_WALLPAPER', {
            path: res.data.data.path,
            from: res.data.data.from,
          })
        }
      })
    },

    async showUpdateCompleteModal() {
      await this.$api.users.getLinkAppDetail()
      const versionRes = await this.$api.sys.getVersion()
      if (versionRes.data.success == 200) {
        this.$buefy.modal.open({
          parent: this,
          component: UpdateCompleteModal,
          hasModalCard: true,
          customClass: 'network-storage-modal',
          trapFocus: true,
          canCancel: [],
          scroll: 'keep',
          animation: 'zoom-in',
          props: {
            changeLog: versionRes.data.data.version.change_log,
          },
        })
      }
    },

    // one-off
    rssConfirm() {
      this.$buefy.dialog.confirm({
        title: this.$t('Show news feed from CasaOS Blog'),
        message: this.$t('CasaOS dashboard will get the the latest news feed of https://blog.casaos.io via Internet, which might leave your visit records to the site. Do you accept?'),
        type: 'is-dark',
        confirmText: this.$t('Accept'),
        cancelText: this.$t('Cancel'),
        onConfirm: async () => {
          const systemConfig = await this.$api.users.getCustomStorage('system')
          const barData = systemConfig.data.data
          barData.rss_switch = true
          const saveRes = await this.$api.users.setCustomStorage('system', barData)
          this.barData = saveRes.data.data
        },
        onCancel: () => {
          this.barData.rss_switch = false
        },
      })
    },

    onMouseMoveTopBar(e) {
      // Tour locks the bar visible so it can be pointed at — bail out
      // and don't react to cursor position while that's the case.
      if (this.topbarLocked) return
      // Top bar is desktop-only. While files (or any other full-screen
      // view) is up, ignore hover entirely so the bar stays hidden no
      // matter where the cursor goes — that view has its own header.
      if (this.isFileActive) {
        if (!this.topbarHidden) this.topbarHidden = true
        return
      }
      // Desktop: show when the mouse is within ~80px of the top edge,
      // otherwise schedule a hide after 700ms idle.
      if (e.clientY < 80) {
        this.cancelHideTopBar()
        if (this.topbarHidden) this.topbarHidden = false
      } else if (!this.topbarHidden && !this._topbarHideTimer) {
        this.scheduleHideTopBar()
      }
    },
    cancelHideTopBar() {
      if (this._topbarHideTimer) {
        clearTimeout(this._topbarHideTimer)
        this._topbarHideTimer = null
      }
      // Desktop only. If we're inside a full-screen view (files etc.)
      // the bar stays hidden no matter what — defensive guard in case
      // the off-screen topbar-shell still receives a mouseenter.
      if (this.isFileActive) return
      this.topbarHidden = false
    },
    scheduleHideTopBar() {
      if (this._topbarHideTimer) return
      if (this.topbarLocked) return
      this._topbarHideTimer = setTimeout(() => {
        if (this.topbarLocked) { this._topbarHideTimer = null; return }
        // Don't hide if any Buefy dropdown inside the TopBar is open.
        const openDropdown = this.$el && this.$el.querySelector('.topbar-shell .dropdown.is-active')
        if (!openDropdown) this.topbarHidden = true
        this._topbarHideTimer = null
      }, 700)
    },
    lockTopBarVisible() {
      // Tour callback: pin the bar visible until the corresponding
      // release event fires. Clears any pending hide timer too.
      this.topbarLocked = true
      if (this._topbarHideTimer) {
        clearTimeout(this._topbarHideTimer)
        this._topbarHideTimer = null
      }
      this.topbarHidden = false
    },
    unlockTopBar() {
      this.topbarLocked = false
    },

    // show storage settings modal
    async showStorageManagerPanelModal() {
      this.$messageBus('widget_storagemanager')
      this.$buefy.modal.open({
        parent: this,
        component: () => import('@/components/Storage/StorageManagerPanel.vue'),
        hasModalCard: true,
        customClass: 'storage-modal',
        trapFocus: true,
        canCancel: [],
        scroll: 'keep',
        animation: 'zoom-in',
      })
    },

  },

}
</script>

<template>
  <div v-if="!isLoading" class="out-container" :class="{ 'is-topbar-hidden': topbarHidden }">
    <!-- NavBar Start — auto-hides; reveals when the mouse approaches the top of
         the viewport, when any TopBar dropdown is open, or briefly on load. -->
    <div
      class="topbar-shell"
      data-tour="topbar"
      @mouseenter="cancelHideTopBar"
      @mouseleave="scheduleHideTopBar"
    >
      <TopBar v-animate-css="topBarAni" :init-bar-data="barData" @showSideBar="showSideBar" />
    </div>
    <!-- NavBar End -->

    <!-- KODE OS: only the Easy-mode widget canvas now. Advanced mode +
         upstream SideBar / SearchBar / AppSection layout were removed
         per product decision — the OS reads as a single appliance UI
         instead of two competing surfaces. -->
    <BeginnerDashboard />

    <!-- Content End -->

    <!-- File Panel Start -->
    <b-modal
      v-model="isFileActive" :can-cancel="[]" :destroy-on-hide="false" animation="zoom-in" aria-modal
      custom-class="file-panel" full-screen has-modal-card @after-enter="afterFileEnter"
      @close="onFilesClose"
    >
      <template #default="props">
        <FilePanel ref="filePanel" @close="props.close" />
      </template>
    </b-modal>
    <!-- File Panel End -->
  </div>
</template>

<style lang="scss" scoped>
.topbar-shell {
    position: sticky;
    top: 0;
    z-index: 100;
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.out-container.is-topbar-hidden .topbar-shell {
    transform: translateY(-100%);
}

.out-container {
    position: relative;
    height: 100%;
}

.contents {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    height: calc(100% - 7rem);
}

.main-content {
    z-index: 10;

    @include until-widescreen {
        width: calc(100% - 18rem);
    }
}

.dark-bg {
    position: fixed;
    transition: all 0.3s ease;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 1);
    z-index: 19;
    opacity: 0;
    visibility: hidden;

    &.open {
        opacity: 1;
        visibility: visible;
    }
}

.slider-content {
    min-width: 18rem;
    position: relative;
    // height: calc(100vh - 6rem);
}

@media screen and (max-width: 480px) {
    .slider-content {
        position: absolute;
        width: 100%;
    }

    .contents {
        height: calc(100dvh - 44px) !important;
        padding-bottom: 1rem;
    }

    .container {
        padding-bottom: 1rem;
    }

    .columns {
        height: 100%;
    }

    .column {
        padding: 0;
        width: 100%;
        right: 0;
    }

    .main-content {
        margin-left: 0;
        transition: all 0.3s;

        &.open {
            transform: scale(0.9);
            opacity: 0;
        }
    }
}

@media screen and (max-width: $tablet) {
    .columns {
        display: flex;
    }
}

</style>
