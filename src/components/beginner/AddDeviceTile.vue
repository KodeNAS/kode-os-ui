<template>
  <button type="button" class="kode-tile add-device-tile" @click="open">
    <span class="add-device-icon">
      <b-icon icon="plus-outline" pack="casa" size="is-medium" />
    </span>
    <span class="add-device-text">
      <span class="add-device-title">{{ $t('Add a device') }}</span>
      <span class="add-device-desc">{{ $t('Phone, computer, or smart TV') }}</span>
    </span>
  </button>
</template>

<script>
import AddDeviceWizard from '@/components/wizard/AddDeviceWizard.vue'

export default {
  name: 'AddDeviceTile',
  methods: {
    open() {
      this.$buefy.modal.open({
        parent: this,
        component: AddDeviceWizard,
        hasModalCard: true,
        trapFocus: true,
        scroll: 'keep',
        animation: 'zoom-in',
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.kode-tile {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  text-align: left;
  transition: transform 0.18s, box-shadow 0.18s;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.85),
      0 14px 36px rgba(0, 0, 0, 0.22);
  }
}

.add-device-icon {
  flex: 0 0 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2d5f4e, #3f7a66);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-device-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.add-device-title {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
}

.add-device-desc {
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 1px;
}
</style>
