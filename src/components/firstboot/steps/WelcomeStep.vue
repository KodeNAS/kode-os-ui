<template>
  <div class="fb-step welcome-step has-text-centered">
    <!-- KODE NAS wordmark. The logo SVG uses `currentColor` but is loaded
         via <img>, so we recolor it to white with a CSS filter trick
         (brightness(0) maps to pure black, invert(1) flips to white).
         A soft radial glow on .welcome-mark provides depth. -->
    <div class="welcome-mark">
      <img
        :src="require('@/assets/img/logo/logo.svg')"
        :srcset="`${require('@/assets/img/logo/logo.png')} 1x, ${require('@/assets/img/logo/logo.svg')} 2x`"
        alt="KODE NAS"
        class="welcome-logo"
      />
    </div>

    <h1 class="welcome-title">
      {{ isReplay ? $t('Walk through setup again') : $t('Welcome to pebble') }}
    </h1>
    <p class="welcome-subtitle">
      {{ isReplay ? $t('Update your pebble\'s name, apps, and walkthroughs.') : $t('Your own private cloud, ready in 5 minutes.') }}
    </p>

    <!-- Quick value-prop chips. Shown only on first run — replay users
         already know what's in the box. -->
    <ul v-if="!isReplay" class="welcome-pills" aria-hidden="true">
      <li class="welcome-pill">
        <b-icon icon="gallery-outline" pack="casa" size="is-small" />
        <span>{{ $t('Your photos') }}</span>
      </li>
      <li class="welcome-pill">
        <b-icon icon="folder-outline" pack="casa" size="is-small" />
        <span>{{ $t('Your files') }}</span>
      </li>
      <li class="welcome-pill">
        <b-icon icon="media-outline" pack="casa" size="is-small" />
        <span>{{ $t('Your media') }}</span>
      </li>
      <li class="welcome-pill">
        <b-icon icon="protection-outline" pack="casa" size="is-small" />
        <span>{{ $t('Private') }}</span>
      </li>
    </ul>

    <div class="welcome-actions">
      <button
        type="button"
        class="welcome-cta"
        @click="$emit('next')"
      >
        <span>{{ isReplay ? $t("Let's go") : $t("Let's get started") }}</span>
        <b-icon icon="right-outline" pack="casa" size="is-small" />
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WelcomeStep',
  props: {
    isReplay: { type: Boolean, default: false },
  },
}
</script>

<style lang="scss" scoped>
.welcome-step {
  /* Tighter container; the firstboot-shell wraps us. */
  padding: 0.5rem 0.5rem 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  animation: welcome-fade-in 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

/* Wordmark block — wide enough for the KODE NAS horizontal logo
   (5:1 aspect ratio). The radial glow behind it provides depth and
   pulses softly so the mark feels alive without being noisy. */
.welcome-mark {
  position: relative;
  width: 260px;
  max-width: 90%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.5rem;
  margin: 0.5rem 0 0.4rem;
  animation: welcome-mark-pop 0.7s cubic-bezier(0.2, 0.9, 0.2, 1.1) 0.05s both;

  &::before {
    /* Soft radial glow that hugs the wordmark. Wider than the logo so
       it doesn't read as a hard halo, but tight enough on the vertical
       axis that it doesn't make the section feel empty. */
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 130%;
    height: 240%;
    transform: translate(-50%, -50%);
    background: radial-gradient(ellipse at center,
      rgba(45, 95, 78, 0.45) 0%,
      rgba(45, 95, 78, 0.22) 32%,
      transparent 70%);
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
    animation: welcome-glow-pulse 3.4s ease-in-out infinite;
  }
}

.welcome-logo {
  position: relative;
  z-index: 1;
  width: 100%;
  height: auto;
  display: block;
  /* The logo SVG fills with currentColor, which doesn't apply when
     loaded via <img>. brightness(0) clamps it to pure black, invert(1)
     flips that to pure white — yielding a clean white wordmark we can
     drop-shadow over the dark glass. */
  filter:
    brightness(0)
    invert(1)
    drop-shadow(0 4px 14px rgba(0, 0, 0, 0.55))
    drop-shadow(0 0 24px rgba(45, 95, 78, 0.45));
}

.welcome-title {
  font-size: 2.1rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0;
  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.78) 100%);
  -webkit-background-clip: text;
          background-clip: text;
  color: transparent;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
}

.welcome-subtitle {
  font-size: 1.0625rem;
  color: rgba(255, 255, 255, 0.78);
  margin: 0;
  max-width: 36ch;
  line-height: 1.45;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
}

/* Value-prop chips. Glassy pills that sit just below the subtitle. */
.welcome-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  list-style: none;
  margin: 0.35rem 0 0.25rem;
  padding: 0;
}

.welcome-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 5px 11px;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

.welcome-actions {
  margin-top: 0.9rem;
}

/* Custom CTA — bigger than Buefy's medium, with a soft inner highlight,
   spring on hover, and an icon that nudges right. */
.welcome-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.6rem;
  background: linear-gradient(180deg, #3a7762 0%, #2d5f4e 100%);
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 8px 22px rgba(0, 0, 0, 0.35);
  transition: transform 0.18s cubic-bezier(0.2, 0.7, 0.2, 1),
              box-shadow 0.18s ease,
              background 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(180deg, #428970 0%, #336d59 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.32),
      0 12px 28px rgba(0, 0, 0, 0.42);

    ::v-deep .icon { transform: translateX(2px); }
  }

  &:active { transform: translateY(0); }

  ::v-deep .icon {
    color: rgba(255, 255, 255, 0.92);
    transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
}

@keyframes welcome-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes welcome-mark-pop {
  0%   { opacity: 0; transform: scale(0.72); }
  60%  { opacity: 1; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes welcome-glow-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1.0; transform: scale(1.06); }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-step,
  .welcome-mark,
  .welcome-mark::before,
  .welcome-cta,
  .welcome-cta ::v-deep .icon {
    animation: none !important;
    transition: none !important;
  }
}
</style>
