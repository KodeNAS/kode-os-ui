<template>
  <div class="fb-step language-step has-text-white">
    <div class="kicker">{{ 'Welcome to pebble' }}</div>
    <h1 class="title is-3 has-text-white">{{ 'Pick your language' }}</h1>
    <p class="subtitle is-6 has-text-white-bis">
      {{ 'You can change this later in Settings.' }}
    </p>

    <ul class="lang-grid">
      <li
        v-for="opt in LANGUAGES"
        :key="opt.code"
        class="lang-card"
        :class="{ 'is-selected': selected === opt.code, 'is-disabled': !opt.available }"
        :title="opt.available ? '' : 'Coming soon'"
        @click="opt.available && pick(opt.code)"
      >
        <span class="lang-flag" aria-hidden="true">{{ opt.flag }}</span>
        <span class="lang-text">
          <span class="lang-name">{{ opt.label }}</span>
          <span class="lang-native">{{ opt.native }}</span>
        </span>
        <span v-if="!opt.available" class="lang-soon">Soon</span>
        <span v-else-if="selected === opt.code" class="lang-check">
          <b-icon icon="check-outline" pack="casa" size="is-small" />
        </span>
      </li>
    </ul>

    <div class="lang-actions">
      <div class="is-flex-grow-1"></div>
      <b-button
        rounded
        type="is-primary"
        :disabled="!selected"
        @click="confirm"
      >
        {{ 'Continue' }}
      </b-button>
    </div>
  </div>
</template>

<script>
/*
 * First-boot wizard step. Shows a language picker at the very start
 * so the buyer's first interaction with the OS is in their language.
 *
 * Right now this is a UI placeholder — only English actually renders
 * translated content. Other locales are surfaced as "Soon" so future
 * translation work has a slot to land in, and the user's pick is
 * persisted to localStorage so when those translations ship the
 * choice survives.
 */

const LANGUAGES = [
  { code: 'en_us', label: 'English',     native: 'English',     flag: '🇺🇸', available: true },
  { code: 'es_es', label: 'Spanish',     native: 'Español',     flag: '🇪🇸', available: false },
  { code: 'fr_fr', label: 'French',      native: 'Français',    flag: '🇫🇷', available: false },
  { code: 'de_de', label: 'German',      native: 'Deutsch',     flag: '🇩🇪', available: false },
  { code: 'it_it', label: 'Italian',     native: 'Italiano',    flag: '🇮🇹', available: false },
  { code: 'pt_pt', label: 'Portuguese',  native: 'Português',   flag: '🇵🇹', available: false },
  { code: 'nl_nl', label: 'Dutch',       native: 'Nederlands',  flag: '🇳🇱', available: false },
  { code: 'pl_pl', label: 'Polish',      native: 'Polski',      flag: '🇵🇱', available: false },
  { code: 'ru_ru', label: 'Russian',     native: 'Русский',     flag: '🇷🇺', available: false },
  { code: 'ja_jp', label: 'Japanese',    native: '日本語',       flag: '🇯🇵', available: false },
  { code: 'ko_kr', label: 'Korean',      native: '한국어',       flag: '🇰🇷', available: false },
  { code: 'zh_cn', label: 'Chinese',     native: '中文',         flag: '🇨🇳', available: false },
  { code: 'ar_sa', label: 'Arabic',      native: 'العربية',     flag: '🇸🇦', available: false },
  { code: 'hi_in', label: 'Hindi',       native: 'हिन्दी',       flag: '🇮🇳', available: false },
]

export default {
  name: 'LanguageStep',
  data() {
    return {
      LANGUAGES,
      // Default to whatever the browser's already configured to.
      selected: (() => {
        try {
          const saved = localStorage.getItem('lang')
          if (saved && LANGUAGES.find(l => l.code === saved && l.available)) return saved
        } catch (e) { /* ignore */ }
        return 'en_us'
      })(),
    }
  },
  methods: {
    pick(code) {
      this.selected = code
    },
    confirm() {
      if (!this.selected) return
      // Persist now so language survives a wizard restart. Wire-up to
      // actual i18n happens later when translations land — for now
      // only en_us is selectable so this is effectively a no-op.
      try { localStorage.setItem('lang', this.selected) } catch (e) { /* ignore */ }
      this.$emit('next', { language: this.selected })
    },
  },
}
</script>

<style lang="scss" scoped>
.fb-step { animation: lang-fade 0.4s ease both; }
@keyframes lang-fade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.kicker {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.35rem;
}
/* Bulma applies `.title + .subtitle { margin-top: -1.25rem }` which
   yanks the subtitle up into the title's descender — overriding so
   the two lines don't overlap. Same fix in every wizard step that
   uses the kicker / title / subtitle stack. */
.title { margin-bottom: 0.5rem !important; line-height: 1.2 !important; }
.subtitle {
  margin-top: 0 !important;
  margin-bottom: 1.25rem !important;
  opacity: 0.85;
  line-height: 1.45 !important;
}

.lang-grid {
  list-style: none;
  margin: 0 0 1.25rem 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
}

.lang-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem 0.55rem 0.55rem;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  cursor: pointer;
  min-width: 0;
  transition: background 0.15s, border-color 0.15s, transform 0.18s, opacity 0.15s;

  &:hover:not(.is-disabled) {
    background: rgba(255, 255, 255, 0.16);
    transform: translateY(-1px);
  }

  &.is-selected {
    background: rgba(45, 95, 78, 0.32);
    border-color: rgba(45, 95, 78, 0.85);
    box-shadow: 0 0 0 2px rgba(45, 95, 78, 0.55);
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: default;
  }
}

.lang-flag {
  flex: 0 0 28px;
  font-size: 1.4rem;
  line-height: 1;
  text-align: center;
}

.lang-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.lang-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lang-native {
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.65);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lang-soon {
  flex-shrink: 0;
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.65);
}

.lang-check {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2d5f4e;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lang-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
