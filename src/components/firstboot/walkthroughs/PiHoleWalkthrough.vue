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

    <!-- Sub 0: open Pi-hole admin. -->
    <section v-if="sub === 0" class="wt-body">
      <p>{{ $t('Pi-hole is your home network\'s ad blocker. Instead of installing a blocker on every device, your pebble blocks ads at the DNS layer — for your phones, TVs, smart speakers, everything.') }}</p>
      <div class="setup-cta">
        <a class="setup-cta-btn" :href="adminUrl" target="_blank" rel="noopener noreferrer">
          <b-icon icon="internet-outline" pack="casa" size="is-medium" />
          <span>{{ $t('Open Pi-hole admin') }}</span>
        </a>
        <p class="setup-cta-hint">{{ $t('Opens in a new tab.') }} <code>{{ adminUrl }}</code></p>
      </div>
      <p class="next-prompt">{{ $t('Once you\'re on the Pi-hole login page, tap Next for the steps.') }}</p>
    </section>

    <!-- Sub 1: in-app steps (sign in). -->
    <section v-else-if="sub === 1" class="wt-body">
      <p>{{ $t('On the Pi-hole admin page:') }}</p>
      <ol class="steps">
        <li>{{ $t('Sign in. We already set the admin password to your KODE password — same one you created at the start of this wizard.') }}</li>
        <li>{{ $t('You should see the dashboard with queries ticking up (or zeros if no device on your network is using it yet — fixed in the next step).') }}</li>
      </ol>
      <p class="next-prompt">{{ $t('Signed in? Tap Next to point your network at the pebble.') }}</p>
    </section>

    <!-- Sub 2: connect your network (the equivalent of "mobile app"
         for an app that has no mobile app — point router DNS here). -->
    <section v-else-if="sub === 2" class="wt-body">
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

    <!-- Sub 3: extra settings (blocklists + false positives). -->
    <section v-else-if="sub === 3" class="wt-body">
      <p>{{ $t('A few settings worth adjusting once it\'s blocking:') }}</p>
      <ol class="steps">
        <li>
          <strong>{{ $t('Better blocklists.') }}</strong>
          {{ $t('Adlists → paste each URL below → Add → Tools → Update Gravity.') }}
        </li>
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
      <ol class="steps" start="2">
        <li>
          <strong>{{ $t('Fix false positives.') }}</strong>
          {{ $t('If a site breaks: Query Log → find the red row → Allowlist next to it → refresh.') }}
        </li>
      </ol>
    </section>

    <!-- Sub 4: all done. -->
    <section v-else-if="sub === 4" class="wt-body">
      <p>{{ $t('That\'s Pi-hole running for your whole network.') }}</p>
      <ul class="tips">
        <li>{{ $t('Try visiting an ad-heavy site (a news site, a free game) — banners should be gone or replaced with blank rectangles.') }}</li>
        <li>{{ $t('The Top Permitted Domains and Top Blocked Domains lists are genuinely interesting — fun to see what\'s phoning home.') }}</li>
        <li>{{ $t('Once everything is wired up, your pebble\'s OLED will show "Ads blocked today" alongside the other rotations.') }}</li>
      </ul>
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

const SUB_TITLES = [
  'Open Pi-hole',
  'Sign in',
  'Point your router at the pebble',
  'Extra settings',
  'You\'re blocking ads',
]

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

/* Per-row copy button for blocklist URLs in the extras step. */
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
