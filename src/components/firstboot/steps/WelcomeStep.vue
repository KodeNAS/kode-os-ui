<template>
  <div class="fb-step welcome-step has-text-centered">
    <!-- Decorative ring + glow behind the logo. The ring is a static
         SVG; the glow is a CSS pseudo on .welcome-mark so it pulses
         softly even without JS. -->
    <div class="welcome-mark">
      <span class="welcome-ring" aria-hidden="true"></span>
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
        <b-icon icon="image" pack="casa" size="is-small" />
        <span>{{ $t('Your photos') }}</span>
      </li>
      <li class="welcome-pill">
        <b-icon icon="folder" pack="casa" size="is-small" />
        <span>{{ $t('Your files') }}</span>
      </li>
      <li class="welcome-pill">
        <b-icon icon="video" pack="casa" size="is-small" />
        <span>{{ $t('Your media') }}</span>
      </li>
      <li class="welcome-pill">
        <b-icon icon="shield-outline" pack="casa" size="is-small" />
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
        <b-icon icon="arrow-right" pack="casa" size="is-small" />
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

/* Logo block. The ring + glow combine to give the mark a sense of
   "lifted off the wallpaper" without using a hard border. */
.welcome-mark {
  position: relative;
  width: 140px;
  height: 140px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0.25rem 0 0.4rem;
  animation: welcome-mark-pop 0.7s cubic-bezier(0.2, 0.9, 0.2, 1.1) 0.05s both;

  &::before {
    /* Soft radial glow behind the logo. */
    content: '';
    position: absolute;
    inset: -28px;
    background: radial-gradient(closest-side,
      rgba(45, 95, 78, 0.35) 0%,
      rgba(45, 95, 78, 0.18) 40%,
      transparent 75%);
    border-radius: 50%;
    z-index: 0;
    animation: welcome-glow-pulse 3.4s ease-in-out infinite;
  }
}

.welcome-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background:
    radial-gradient(closest-side, rgba(255, 255, 255, 0.05), transparent 70%),
    conic-gradient(from 0deg,
      rgba(255, 255, 255, 0.0) 0deg,
      rgba(45, 95, 78, 0.45) 60deg,
      rgba(255, 255, 255, 0.0) 130deg,
      rgba(255, 255, 255, 0.0) 360deg);
  -webkit-mask: radial-gradient(closest-side, transparent 62%, #000 64%);
          mask: radial-gradient(closest-side, transparent 62%, #000 64%);
  animation: welcome-ring-spin 18s linear infinite;
}

.welcome-logo {
  position: relative;
  z-index: 1;
  width: 92px;
  height: 92px;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.45));
  object-fit: contain;
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

@keyframes welcome-ring-spin {
  to { transform: rotate(360deg); }
}

@keyframes welcome-glow-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50%      { opacity: 1.0; transform: scale(1.06); }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-step,
  .welcome-mark,
  .welcome-mark::before,
  .welcome-ring,
  .welcome-cta,
  .welcome-cta ::v-deep .icon {
    animation: none !important;
    transition: none !important;
  }
}
</style>
