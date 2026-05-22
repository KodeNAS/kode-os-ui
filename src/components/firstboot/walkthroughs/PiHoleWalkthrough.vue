<template>
  <div class="walkthrough">
    <div class="wt-header">
      <span class="wt-icon is-pihole">
        <b-icon icon="shield-outline" pack="casa" size="is-medium" />
      </span>
      <div>
        <h3 class="wt-title">Pi-hole</h3>
        <p class="wt-subtitle">{{ subTitle }}</p>
      </div>
      <div class="wt-substep">{{ sub + 1 }} / {{ total }}</div>
    </div>

    <!-- Sub 0: what it is + open admin -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('Pi-hole acts as your home network\'s ad blocker. Instead of installing an ad blocker on every device, your pebble blocks ads at the source — for your phones, TVs, smart speakers, everything.') }}</p>
      <p>{{ $t('Open the Pi-hole admin to finish setup:') }}</p>
      <div class="server-row">
        <code class="server">{{ adminUrl }}</code>
        <b-button size="is-small" type="is-dark" rounded icon-pack="casa" icon-left="copy-outline" @click="copy(adminUrl)">
          {{ copied ? $t('Copied') : $t('Copy') }}
        </b-button>
      </div>
      <b-button rounded type="is-light" tag="a" :href="adminUrl" target="_blank" rel="noopener noreferrer">
        {{ $t('Open Pi-hole admin') }}
      </b-button>
      <p class="hint">{{ $t('You\'ll see the default Pi-hole login page — sign in with the password set during install.') }}</p>
    </section>

    <!-- Sub 1: point router DNS to pebble -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('To start blocking ads, tell your home router to use the pebble as its DNS server. This is the one technical bit — it takes about 2 minutes:') }}</p>
      <ol class="steps">
        <li>{{ $t('Open your router\'s admin page (often <code>192.168.1.1</code> or <code>192.168.0.1</code>).') }}</li>
        <li>{{ $t('Find DNS Settings (sometimes under LAN, DHCP, or Network).') }}</li>
        <li>{{ $t('Set the Primary DNS to your pebble\'s address:') }} <code>{{ host }}</code></li>
        <li>{{ $t('Save and reboot your router (or wait ~5 minutes).') }}</li>
      </ol>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Don\'t know how? Search Google for "set DNS on" + your router model. It\'s usually 3-4 clicks.') }}</span>
      </div>
    </section>

    <!-- Sub 2: verify -->
    <section v-else-if="sub === 2" class="wt-body">
      <p>{{ $t('Once the router restarts, ads should start disappearing across your network.') }}</p>
      <ol class="steps">
        <li>{{ $t('Open the Pi-hole admin again.') }}</li>
        <li>{{ $t('You should see Queries blocked ticking up — that\'s ads and trackers getting stopped.') }}</li>
        <li>{{ $t('Try visiting a site with ads on any device — they should be gone or replaced with blank boxes.') }}</li>
      </ol>
    </section>

    <!-- Sub 3: managing false positives -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('Sometimes Pi-hole blocks something useful by accident (a download, a streaming login). If that happens:') }}</p>
      <ul class="tips">
        <li>{{ $t('Open Pi-hole admin → Query Log to find the blocked domain.') }}</li>
        <li>{{ $t('Click Allowlist next to it.') }}</li>
        <li>{{ $t('Refresh the page you were on — it should work now.') }}</li>
      </ul>
      <p class="hint">{{ $t('Once it\'s all working, the OLED will show "Ads blocked today" alongside the other rotations.') }}</p>
    </section>

    <div class="wt-actions">
      <b-button v-if="sub > 0" rounded @click="sub -= 1">{{ $t('Back') }}</b-button>
      <div class="is-flex-grow-1"></div>
      <b-button rounded type="is-primary" @click="advance">
        {{ isFinal ? (isLast ? $t('All set') : $t('Next app')) : $t('Next') }}
      </b-button>
    </div>
  </div>
</template>

<script>
import copy from 'clipboard-copy'
import { resolveAppUrl } from '@/service/kodeApps'

const SUB_TITLES = ['What it does', 'Point your router at the pebble', 'Verify it\'s working', 'Fix false positives']

export default {
  name: 'PiHoleWalkthrough',
  props: {
    host: { type: String, required: true },
    isLast: { type: Boolean, default: false },
  },
  data() {
    return {
      sub: 0,
      copied: false,
      total: SUB_TITLES.length,
      adminUrl: `http://${this.host}/admin/`,
    }
  },
  async created() {
    const live = await resolveAppUrl('pihole', this.host)
    if (live) {
      // ensure /admin/ suffix even if API returns just the root
      this.adminUrl = live.endsWith('/admin/') ? live : live.replace(/\/+$/, '') + '/admin/'
    }
  },
  computed: {
    subTitle() { return this.$t(SUB_TITLES[this.sub]) },
    isFinal() { return this.sub === this.total - 1 },
  },
  methods: {
    async copy(text) {
      try { await copy(text); this.copied = true; setTimeout(() => (this.copied = false), 1500) }
      catch (e) { this.copied = false }
    },
    advance() {
      if (this.sub < this.total - 1) this.sub += 1
      else this.$emit('done')
    },
  },
}
</script>

<style lang="scss" scoped>
@import './_walkthrough.scss';
.wt-icon.is-pihole { background: linear-gradient(135deg, #a83239, #d04a51); }
</style>
