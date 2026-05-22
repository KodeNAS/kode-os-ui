<template>
  <WizardModal
    ref="wizard"
    :title="$t('Add a device')"
    :steps="[$t('Choose device'), $t('Set it up'), $t('Done')]"
    @close="$emit('close')"
    @finish="$emit('close')"
  >
    <template #default="{ step, setCanAdvance }">
      <!-- Step 0: pick device type -->
      <PickDeviceTypeStep
        v-if="step === 0"
        :value="deviceType"
        @pick="onPick(setCanAdvance, $event)"
      />

      <!-- Step 1: per-device instructions -->
      <PhoneStep    v-else-if="step === 1 && deviceType === 'phone'"    :host="host" />
      <ComputerStep v-else-if="step === 1 && deviceType === 'computer'" :host="host" />
      <TVStep       v-else-if="step === 1 && deviceType === 'tv'"       :host="host" />

      <!-- Step 2: success -->
      <DoneStep v-else-if="step === 2" :type="deviceType" @add-another="restart" />
    </template>
  </WizardModal>
</template>

<script>
import WizardModal from './WizardModal.vue'
import PickDeviceTypeStep from './steps/PickDeviceTypeStep.vue'
import PhoneStep from './steps/PhoneStep.vue'
import ComputerStep from './steps/ComputerStep.vue'
import TVStep from './steps/TVStep.vue'
import DoneStep from './steps/DoneStep.vue'

export default {
  name: 'AddDeviceWizard',
  components: {
    WizardModal,
    PickDeviceTypeStep,
    PhoneStep,
    ComputerStep,
    TVStep,
    DoneStep,
  },
  data() {
    return {
      deviceType: '',
      // window.location.hostname covers both IP (192.168.0.220) and mDNS
      // (pebble.local) cases — whatever the user is currently browsing to.
      host: window.location.hostname || 'pebble.local',
    }
  },
  mounted() {
    // The wizard opens on step 0 with no device picked — Next should stay
    // disabled until the user clicks one of the option cards.
    if (this.$refs.wizard) this.$refs.wizard.setCanAdvance(false)
  },
  methods: {
    onPick(setCanAdvance, key) {
      this.deviceType = key
      setCanAdvance(true)
    },
    restart() {
      this.deviceType = ''
      if (this.$refs.wizard) {
        this.$refs.wizard.goTo(0)
        this.$refs.wizard.setCanAdvance(false)
      }
    },
  },
}
</script>
