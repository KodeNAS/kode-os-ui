<template>
  <div class="computer-step">
    <p class="step-intro">
      {{ intro }}
    </p>

    <ol class="instructions">
      <li v-for="(step, i) in steps" :key="i" v-html="step"></li>
    </ol>

    <div class="server-row">
      <code class="server">{{ serverAddress }}</code>
      <b-button
        size="is-small"
        type="is-dark"
        rounded
        icon-pack="casa"
        icon-left="copy-outline"
        @click="copyServer"
      >
        {{ copied ? $t('Copied') : $t('Copy') }}
      </b-button>
    </div>

    <p class="shares-label">{{ $t('Folders on your pebble:') }}</p>
    <ul class="shares">
      <li v-for="share in shares" :key="share" class="share-chip">
        {{ share }}
      </li>
    </ul>

    <details class="other-platforms">
      <summary>{{ $t('Using a different system?') }}</summary>
      <ul class="other-list">
        <li v-for="(addr, label) in otherAddresses" :key="label">
          <strong>{{ label }}:</strong> <code>{{ addr }}</code>
        </li>
      </ul>
    </details>
  </div>
</template>

<script>
import UAParser from 'ua-parser-js'
import copy from 'clipboard-copy'

const SHARES = ['Photos', 'Videos', 'Documents', 'Music', 'Backups', 'Downloads']

export default {
  name: 'ComputerStep',
  props: {
    host: { type: String, required: true },
  },
  data() {
    return {
      os: this.detectOs(),
      copied: false,
      shares: SHARES,
    }
  },
  computed: {
    intro() {
      switch (this.os) {
        case 'mac':
          return this.$t('We\'ll connect your Mac to your pebble\'s folders in Finder.')
        case 'windows':
          return this.$t('We\'ll connect your PC to your pebble\'s folders in File Explorer.')
        case 'linux':
          return this.$t('We\'ll connect your Linux machine to your pebble\'s folders.')
        default:
          return this.$t('Connect your computer to your pebble\'s folders.')
      }
    },
    serverAddress() {
      if (this.os === 'windows') return `\\\\${this.host}`
      return `smb://${this.host}`
    },
    steps() {
      switch (this.os) {
        case 'mac':
          return [
            this.$t('Open <strong>Finder</strong>.'),
            this.$t('In the menu bar, click <strong>Go → Connect to Server…</strong> (or press ⌘K).'),
            this.$t('Paste the address below and click <strong>Connect</strong>.'),
            this.$t('Sign in with your KODE account.'),
          ]
        case 'windows':
          return [
            this.$t('Open <strong>File Explorer</strong>.'),
            this.$t('Click the address bar at the top.'),
            this.$t('Paste the address below and press <strong>Enter</strong>.'),
            this.$t('Sign in with your KODE account when prompted.'),
          ]
        default:
          return [
            this.$t('Open your file manager.'),
            this.$t('Choose "Connect to Server" or press <strong>Ctrl+L</strong> for an address bar.'),
            this.$t('Paste the address below and connect.'),
            this.$t('Sign in with your KODE account.'),
          ]
      }
    },
    otherAddresses() {
      return {
        Mac: `smb://${this.host}`,
        Windows: `\\\\${this.host}`,
        Linux: `smb://${this.host}`,
      }
    },
  },
  methods: {
    detectOs() {
      try {
        const ua = new UAParser().getOS().name || ''
        const name = ua.toLowerCase()
        if (name.includes('mac')) return 'mac'
        if (name.includes('windows')) return 'windows'
        if (name.includes('linux') || name.includes('ubuntu') || name.includes('debian') || name.includes('fedora') || name.includes('arch')) {
          return 'linux'
        }
      } catch (e) { /* ignore */ }
      return 'unknown'
    },
    async copyServer() {
      try {
        await copy(this.serverAddress)
        this.copied = true
        setTimeout(() => (this.copied = false), 1500)
      } catch (e) {
        this.copied = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.step-intro {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 0.85rem;
}

.instructions {
  margin: 0 0 0.85rem 1.1rem;
  padding: 0;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.78);
  line-height: 1.6;
}

.server-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.server {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shares-label {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 0.4rem;
}

.shares {
  list-style: none;
  margin: 0 0 1rem 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.share-chip {
  padding: 0.35rem 0.75rem;
  background: rgba(45, 95, 78, 0.10);
  color: #2d5f4e;
  border-radius: 999px;
  font-size: 0.8125rem;
}

.other-platforms {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);

  summary {
    cursor: pointer;
    user-select: none;
    padding: 0.4rem 0;
  }
}

.other-list {
  list-style: none;
  margin: 0.5rem 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  code {
    background: rgba(0, 0, 0, 0.06);
    padding: 1px 6px;
    border-radius: 4px;
    color: #1f2937;
  }
}
</style>
