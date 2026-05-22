<template>
  <div class="kode-tile ip-widget">
    <span v-if="hintModeOn" class="kode-hint">{{ hintLabel }}</span>
    <header class="tile-header">
      <h2 class="tile-title">{{ $t('Your pebble') }}</h2>
    </header>
    <div class="ip-rows">
      <div class="ip-row">
        <span class="ip-label">{{ $t('Local IP') }}</span>
        <code class="ip-value">{{ localAddress }}</code>
      </div>
      <div class="ip-row">
        <span class="ip-label">{{ $t('Hostname') }}</span>
        <code class="ip-value">{{ hostname }}</code>
      </div>
    </div>
  </div>
</template>

<script>
import { hintMode } from '@/mixins/hintMode'

export default {
  name: 'IPAddressWidget',
  mixins: [hintMode],
  data() {
    return {
      localAddress: window.location.hostname || 'unknown',
      hostname: '',
    }
  },
  computed: {
    hintLabel() {
      return this.$t('Local IP and hostname for your pebble. Use these to point devices on your network at it.')
    },
  },
  async created() {
    // Try the saved pebble name first, fall back to the browser-visible host.
    try {
      const res = await this.$api.users.getCustomStorage('kode_pebble_name')
      const name = res && res.data && res.data.data && res.data.data.name
      this.hostname = name || this.localAddress
    } catch (e) {
      this.hostname = this.localAddress
    }
  },
}
</script>

<style lang="scss" scoped>
.kode-tile {
  position: relative;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 1.1rem 1.25rem;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
}

.kode-hint {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translate(-50%, -100%);
  background: rgba(15, 25, 30, 0.92);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  line-height: 1.4;
  max-width: 260px;
  white-space: normal;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 50;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}
.kode-tile:hover .kode-hint { opacity: 1; }

.tile-header {
  margin-bottom: 0.65rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.tile-title {
  font-size: 0.9375rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  color: rgba(31, 41, 55, 0.7);
  margin: 0;
}

.ip-rows {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.ip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.ip-label {
  color: rgba(0, 0, 0, 0.6);
}

.ip-value {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 8px;
  border-radius: 6px;
  color: #1f2937;
  font-size: 0.8125rem;
  font-feature-settings: 'tnum' 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}
</style>
