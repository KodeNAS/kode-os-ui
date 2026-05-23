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

    <!-- Credentials box. Most users assume "KODE account" = the password
         they remember, but Samba is its own auth — flagging that here
         saves a lot of "why doesn't it work" frustration later. -->
    <div class="creds">
      <div class="creds-title">{{ $t('Sign-in credentials') }}</div>
      <div class="creds-row">
        <span class="creds-label">{{ $t('Username:') }}</span>
        <code class="creds-value">{{ username || $t('your KODE username') }}</code>
      </div>
      <div class="creds-row">
        <span class="creds-label">{{ $t('Password:') }}</span>
        <code class="creds-value">{{ $t('same as your KODE account') }}</code>
      </div>
      <p class="creds-hint">
        {{ $t('Mac, Windows, and Linux all remember this after the first connection. Tick "Remember in Keychain" / "Reconnect at sign-in" if your OS offers it.') }}
      </p>
    </div>

    <p class="shares-label">{{ $t('Folders on your pebble:') }}</p>
    <ul class="shares">
      <li v-for="share in shares" :key="share" class="share-chip">
        {{ share }}
      </li>
    </ul>

    <!-- OS-specific troubleshooting collapsibles. Closed by default so
         the happy path stays clean; the user only opens the one for
         the OS they're on if they hit a wall. -->
    <details class="troubleshoot" :open="os === 'mac'">
      <summary>
        <b-icon icon="ios" pack="casa" size="is-small" />
        <span>{{ $t('Mac — common gotchas') }}</span>
      </summary>
      <ul class="trouble-list">
        <li>{{ $t('After clicking Connect, pick "Registered User" in the dialog (NOT Guest).') }}</li>
        <li>{{ $t('To pin in the sidebar: drag the connected folder from the desktop into Finder\'s sidebar.') }}</li>
        <li>{{ $t('To auto-reconnect at login: System Settings → General → Login Items → + and pick the share.') }}</li>
      </ul>
    </details>

    <details class="troubleshoot" :open="os === 'windows'">
      <summary>
        <b-icon icon="protection-outline" pack="casa" size="is-small" />
        <span>{{ $t('Windows — common gotchas') }}</span>
      </summary>
      <ul class="trouble-list">
        <li>{{ $t('To make it permanent: right-click "This PC" → "Map network drive…" → paste the address.') }}</li>
        <li>{{ $t('If Windows says "the network path was not found", try the IP address instead of the .local hostname.') }}</li>
        <li>{{ $t('"You can\'t access this shared folder" on Windows 10/11 Home? Enable SMB1 in Windows Features (or upgrade Samba on the pebble to use SMB2).') }}</li>
      </ul>
    </details>

    <details class="troubleshoot" :open="os === 'linux'">
      <summary>
        <b-icon icon="terminal-outline" pack="casa" size="is-small" />
        <span>{{ $t('Linux — common gotchas') }}</span>
      </summary>
      <ul class="trouble-list">
        <li>
          {{ $t('GNOME Files: Other Locations → "Connect to Server" at the bottom.') }}
        </li>
        <li>
          {{ $t('KDE Dolphin: type') }} <code>smb://{{ host }}</code> {{ $t('directly in the address bar.') }}
        </li>
        <li>
          {{ $t('CLI: install smbclient + cifs-utils, then') }}
          <code>sudo mount -t cifs //{{ host }}/Photos /mnt/photos -o username=YOU</code>
        </li>
      </ul>
    </details>

    <details class="other-platforms">
      <summary>{{ $t('Different system? All addresses') }}</summary>
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
      username: '',
    }
  },
  async created() {
    // Try to look up the active user so the creds card can pre-fill
    // their username — small but reassuring touch.
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      if (u && u.username) this.username = u.username
    } catch (e) { /* ignore */ }
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
            this.$t('Sign in with the credentials below.'),
          ]
        case 'windows':
          return [
            this.$t('Open <strong>File Explorer</strong>.'),
            this.$t('Click the address bar at the top.'),
            this.$t('Paste the address below and press <strong>Enter</strong>.'),
            this.$t('Sign in when prompted using the credentials below.'),
          ]
        default:
          return [
            this.$t('Open your file manager.'),
            this.$t('Choose "Connect to Server" or press <strong>Ctrl+L</strong> for an address bar.'),
            this.$t('Paste the address below and connect.'),
            this.$t('Sign in with the credentials below.'),
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
  margin-bottom: 0.85rem;
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

/* Credentials card — quiet but distinct so users notice it. */
.creds {
  background: rgba(45, 95, 78, 0.06);
  border: 1px solid rgba(45, 95, 78, 0.15);
  border-radius: 12px;
  padding: 0.7rem 0.85rem;
  margin-bottom: 1rem;
}

.creds-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(45, 95, 78, 0.85);
  margin-bottom: 0.45rem;
}

.creds-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.8125rem;
}

.creds-label {
  color: rgba(0, 0, 0, 0.55);
  flex-shrink: 0;
  width: 5rem;
}

.creds-value {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 8px;
  border-radius: 6px;
  color: #1f2937;
}

.creds-hint {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.45;
  margin-top: 0.45rem;
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

/* OS-specific troubleshooting drawers. Detected-OS one is open by
   default; the others are closed. */
.troubleshoot {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 0.4rem;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 10px;
  padding: 0.2rem 0.6rem;

  summary {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    user-select: none;
    padding: 0.4rem 0;
    color: rgba(0, 0, 0, 0.78);

    &::marker { color: rgba(0, 0, 0, 0.4); }
  }

  &[open] summary {
    color: #1f2937;
    font-weight: 500;
  }
}

.trouble-list {
  list-style: disc;
  margin: 0.2rem 0 0.5rem 1.4rem;
  padding: 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: rgba(0, 0, 0, 0.72);

  li { padding: 0.18rem 0; }

  code {
    background: rgba(0, 0, 0, 0.07);
    padding: 1px 6px;
    border-radius: 4px;
    color: #1f2937;
    font-size: 0.85em;
  }
}

.other-platforms {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 0.4rem;

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
