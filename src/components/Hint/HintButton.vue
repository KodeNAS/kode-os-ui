<template>
  <b-dropdown
    ref="dropdown"
    animation="fade1"
    class="navbar-item hint-dropdown"
    aria-role="list"
  >
    <template #trigger>
      <b-tooltip
        :active="!$store.state.isMobile"
        :label="$t('Hints & help')"
        position="is-right"
        type="is-dark"
      >
        <p role="button" data-tour="hintbutton" class="hint-trigger">
          <b-icon class="picon" icon="question-outline" pack="casa" size="is-20" />
        </p>
      </b-tooltip>
    </template>

    <b-dropdown-item :focusable="false" aria-role="menu-item" class="p-0" custom>
      <div class="hint-menu">
        <h4 class="hint-title">{{ $t('Hints & help') }}</h4>

        <button
          type="button"
          class="hint-row"
          @click="replayTour"
        >
          <span class="hint-row-icon is-tour">
            <b-icon icon="information-outline" pack="casa" size="is-small" />
          </span>
          <span class="hint-row-text">
            <span class="hint-row-label">{{ $t('Replay the tour') }}</span>
            <span class="hint-row-desc">{{ $t('Walk through the dashboard again, step by step.') }}</span>
          </span>
        </button>

        <div class="hint-row hint-toggle-row">
          <span class="hint-row-icon is-hover">
            <b-icon icon="show-search-outline" pack="casa" size="is-small" />
          </span>
          <span class="hint-row-text">
            <span class="hint-row-label">{{ $t('Hint hover mode') }}</span>
            <span class="hint-row-desc">{{ $t('Show a small tip when you hover any tile.') }}</span>
          </span>
          <b-switch
            v-model="hintMode"
            class="is-flex-direction-row-reverse mr-0 _small"
            type="is-dark"
            @input="onHintModeChange"
          />
        </div>
      </div>
    </b-dropdown-item>
  </b-dropdown>
</template>

<script>
import { startEasyTour, isHintModeOn, setHintMode } from '@/service/tour'

export default {
  name: 'HintButton',
  data() {
    return {
      hintMode: isHintModeOn(),
    }
  },
  methods: {
    replayTour() {
      if (this.$refs.dropdown && this.$refs.dropdown.toggle) {
        this.$refs.dropdown.toggle()
      }
      // small delay so the dropdown finishes closing before the overlay paints
      setTimeout(() => startEasyTour(), 120)
    },
    onHintModeChange(val) {
      setHintMode(!!val)
    },
  },
}
</script>

<style lang="scss" scoped>
.hint-trigger {
  display: inline-flex;
  align-items: center;
}

.hint-menu {
  padding: 0.6rem;
  min-width: 280px;
}

.hint-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(0, 0, 0, 0.55);
  margin: 0 0.5rem 0.5rem;
}

.hint-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.55rem 0.65rem;
  text-align: left;
  background: none;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(45, 95, 78, 0.10);
  }
}

.hint-toggle-row {
  cursor: default;

  &:hover { background: none; }
}

.hint-row-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  &.is-tour  { background: linear-gradient(135deg, #2d5f4e, #3f7a66); }
  &.is-hover { background: linear-gradient(135deg, #5e6ad2, #7c8af0); }
}

.hint-row-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.hint-row-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

.hint-row-desc {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 1px;
}
</style>
