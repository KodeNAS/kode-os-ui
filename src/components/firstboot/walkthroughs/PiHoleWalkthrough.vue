<template>
  <div class="walkthrough">
    <div class="wt-header">
      <span class="wt-icon is-pihole">
        <b-icon icon="protection-outline" pack="casa" size="is-medium" />
      </span>
      <div>
        <h3 class="wt-title">Pi-hole</h3>
        <p class="wt-subtitle">{{ subTitle }}</p>
      </div>
      <div class="wt-substep">{{ sub + 1 }} / {{ total }}</div>
    </div>

    <!-- Sub 0: what it is + open admin (with QR for phone access) -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('Pi-hole is your home network\'s ad blocker. Instead of installing a blocker on every device, your pebble blocks ads at the DNS layer — for your phones, TVs, smart speakers, everything.') }}</p>
      <p>{{ $t('Open the Pi-hole admin to finish setup. You can paste the URL on a computer or scan the QR from your phone:') }}</p>
      <div class="qr-row">
        <div class="qr">
          <QrcodeVue :value="adminUrl" :size="180" level="M" background="#ffffff" foreground="#000000" />
        </div>
        <div class="qr-side">
          <div class="server-row">
            <code class="server">{{ adminUrl }}</code>
            <b-button size="is-small" type="is-dark" rounded icon-pack="casa" icon-left="copy-outline" @click="copy(adminUrl)">
              {{ copied ? $t('Copied') : $t('Copy') }}
            </b-button>
          </div>
          <b-button rounded type="is-light" tag="a" :href="adminUrl" target="_blank" rel="noopener noreferrer">
            {{ $t('Open Pi-hole admin') }}
          </b-button>
          <p class="hint">{{ $t('Sign in with the admin password set during install. The default lives in /etc/pihole/setupVars.conf on your pebble if you forgot it.') }}</p>
        </div>
      </div>
    </section>

    <!-- Sub 1: point router DNS to pebble -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('To start blocking, tell your home router to use the pebble as its DNS server. This is the one technical bit — about 2 minutes:') }}</p>
      <ol class="steps">
        <li>
          {{ $t('Open your router\'s admin page (commonly') }}
          <code>192.168.1.1</code> {{ $t('or') }} <code>192.168.0.1</code>{{ $t(').') }}
        </li>
        <li>{{ $t('Find DNS Settings (sometimes under LAN, DHCP, or Network).') }}</li>
        <li>{{ $t('Set Primary DNS to your pebble:') }} <code>{{ host }}</code></li>
        <li>{{ $t('Leave Secondary DNS blank, or set it to') }} <code>1.1.1.1</code> {{ $t('as a backup.') }}</li>
        <li>{{ $t('Save, then reboot your router (or wait ~5 minutes for DHCP leases to renew).') }}</li>
      </ol>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Can\'t find DNS settings on your router? Search "set DNS on" + your router model — it\'s usually 3-4 clicks deep, with screenshots online for most models.') }}</span>
      </div>
    </section>

    <!-- Sub 2: verify -->
    <section v-else-if="sub === 2" class="wt-body">
      <p>{{ $t('Once the router restarts, ads should start vanishing across your network.') }}</p>
      <ol class="steps">
        <li>{{ $t('Open the Pi-hole admin again.') }}</li>
        <li>{{ $t('On the dashboard, Queries blocked should be ticking up — that\'s ads and trackers getting stopped at the DNS level.') }}</li>
        <li>{{ $t('Try visiting an ad-heavy site (a news site, a free game) on any device — banners should be gone or replaced with blank rectangles.') }}</li>
        <li>{{ $t('Open the Top Permitted Domains and Top Blocked Domains lists — it\'s genuinely interesting to see what\'s phoning home.') }}</li>
      </ol>
      <div class="callout">
        <b-icon icon="alert" pack="casa" size="is-small" />
        <span>{{ $t('No blocked queries after 10 minutes? Your router probably didn\'t actually apply the DNS change — double-check step 2 and reboot the router fully.') }}</span>
      </div>
    </section>

    <!-- Sub 3: NEW — recommended blocklists -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('Pi-hole ships with a basic blocklist. For real coverage, add a couple of community lists:') }}</p>
      <ol class="steps">
        <li>{{ $t('In the Pi-hole admin, go to Adlists.') }}</li>
        <li>{{ $t('Paste each URL below into the Address field and click Add. Then run Tools → Update Gravity to apply.') }}</li>
      </ol>
      <ul class="blocklist">
        <li>
          <code class="server">https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts</code>
          <b-button size="is-small" rounded icon-pack="casa" icon-left="copy-outline" @click="copy('https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts')">
            {{ $t('Copy') }}
          </b-button>
        </li>
        <li>
          <code class="server">https://adaway.org/hosts.txt</code>
          <b-button size="is-small" rounded icon-pack="casa" icon-left="copy-outline" @click="copy('https://adaway.org/hosts.txt')">
            {{ $t('Copy') }}
          </b-button>
        </li>
        <li>
          <code class="server">https://v.firebog.net/hosts/Easyprivacy.txt</code>
          <b-button size="is-small" rounded icon-pack="casa" icon-left="copy-outline" @click="copy('https://v.firebog.net/hosts/Easyprivacy.txt')">
            {{ $t('Copy') }}
          </b-button>
        </li>
      </ul>
      <p class="hint">{{ $t('Together these block ~150k known ad/tracker domains. You can always add more from firebog.net or oisd.nl later.') }}</p>
    </section>

    <!-- Sub 4: false positives -->
    <section v-else-if="sub === 4" class="wt-body">
      <p>{{ $t('Sometimes Pi-hole blocks something useful by accident — a download, a streaming login, a banking widget. If that happens:') }}</p>
      <ol class="steps">
        <li>{{ $t('Open the Pi-hole admin → Query Log.') }}</li>
        <li>{{ $t('Find the failing request (it\'ll be highlighted red, with the domain that was blocked).') }}</li>
        <li>{{ $t('Click Allowlist next to it.') }}</li>
        <li>{{ $t('Refresh the page you were on — it should work now.') }}</li>
      </ol>
      <div class="callout">
        <b-icon icon="information-outline" pack="casa" size="is-small" />
        <span>{{ $t('Common allowlist additions: app-measurement.com (Google Analytics, some apps need it), notify.bugsnag.com (some games), and clicks.aweber.com (some newsletters).') }}</span>
      </div>
      <p class="hint">{{ $t('Once it\'s all running, the OLED on your pebble will show "Ads blocked today" alongside the other rotations.') }}</p>
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
import QrcodeVue from 'qrcode.vue'
import copy from 'clipboard-copy'
import { resolveAppUrl } from '@/service/kodeApps'

const SUB_TITLES = [
  'What it does',
  'Point your router at the pebble',
  'Verify it\'s working',
  'Add quality blocklists',
  'Fix false positives',
]

export default {
  name: 'PiHoleWalkthrough',
  components: { QrcodeVue },
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
      // Ensure /admin/ suffix even if API returns just the root.
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

/* Per-row copy button for blocklist URLs in sub-step 3. */
.blocklist {
  list-style: none;
  margin: 0 0 0.75rem 0;
  padding: 0;

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
  }
}
</style>
