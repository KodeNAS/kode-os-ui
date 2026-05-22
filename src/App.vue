<template>
	<div id="app" :class="{'is-dark-bg':$route.meta.showBackground}" class="is-flex is-flex-direction-column" :style="{'--vh': vh}" >
		<template v-if="$route.meta.showBackground">
			<!-- Background Layer Start -->
			<casa-wallpaper :animate="isWelcome?initAni:noneAni"></casa-wallpaper>
			<!-- KODE OS: uniform dark scrim over the wallpaper. Sits above the
			     image layer and below all UI so darkening is consistent across
			     every route that shows the wallpaper. -->
			<div class="kode-wallpaper-scrim"></div>
			<!-- Background Layer End -->

			<div class="base-bar is-flex"
				 style="background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%);">
				<!-- BrandBar Start -->
				<brand-bar v-if="!$store.state.isMobile && $router.currentRoute.path === '/'"
						   v-animate-css="brandAni"></brand-bar>
				<!-- BrandBar End -->
				<!-- KODE OS: ContactBar removed — Discord/GitHub/Share/Feedback links pointed at IceWhale/CasaOS channels. -->
			</div>

		</template>

		<!-- Router View Start -->
		<!-- KODE OS: wrap in a positioned stacking-context so views render
		     above the .kode-wallpaper-scrim (z-index 1). -->
		<div class="kode-content-layer is-flex is-flex-direction-column">
			<router-view/>
		</div>
		<!-- Router View End -->

	</div>
</template>

<script>
import BrandBar      from './components/BrandBar.vue'
import CasaWallpaper from './components/wallpaper/CasaWallpaper.vue'
import {mixin}       from './mixins/mixin';

const customIconConfig = {
	customIconPacks: {
		'casa': {
			sizes: {
				'default': 'is-size-4',
				'is-20': 'is-size-5',
				'is-small': '',
				'is-medium': 'is-size-3',
				'is-large': 'is-size-1'
			},
			iconPrefix: 'casa-',
			internalIcons: {
				'check': 'checkmark',
				'information': 'information',
				'check-circle': 'checkmark-circle-outline',
				'alert': 'alert',
				'alert-circle': 'alert',
				'arrow-up': 'arrow-up',
				'chevron-right': 'arrow-right',
				'chevron-left': 'arrow-back',
				'chevron-down': 'arrow-down',
				'eye': 'eye',
				'eye-off': 'eye-off',
				'menu-down': 'arrow-dropdown',
				'menu-up': 'arrow-dropup',
				'close-circle': 'close-circle-outline'
			}
		},
	}
}

export default {
	components: {
		BrandBar,
		CasaWallpaper
	},
	mixins: [mixin],
	data() {
		return {
			//isLoading: true,
			steps: [],
			noneAni: {
				classes: 'fadeIn',
				duration: 500
			},
			initAni: {
				classes: 'zoomOutIn',
				duration: 2500
			},
			brandAni: {
				classes: "fadeInLeft",
				duration: 700
			},
			"vh": "0px"
		}
	},


	computed: {
		isLoading() {
			return this.$store.state.siteLoading
		},
		isWelcome() {
			return this.$store.state.needInitialization
		}
	},

	created() {
		console.log(`%c
_____             _____ _____
|     |___ ___ ___|     |   __|
|   --| .'|_ -| .'|  |  |__   |
|_____|__,|___|__,|_____|_____|
-- Made by IceWhale with YOU --
`, `font-family: monospace`);

		this.$buefy.config.setOptions(customIconConfig)
	},
	mounted() {
		this.setInitLang();
		window.addEventListener('resize', this.onWindowResize);
		this.onWindowResize();
		let vh = window.innerHeight * 0.01;
		this["vh"] = `${vh}px`;
	},
	methods: {
		/**
		 * @description: Get and Set default language
		 * @return {*} void
		 */
		setInitLang() {
			let lang = localStorage.getItem('lang') ? localStorage.getItem('lang') : this.getLangFromBrowser()
			lang = lang.includes("_") ? lang : "en_us";
			this.setLang(lang);
		},
		/**
		 * @description: Handle on Window reize
		 * @return {*}
		 */
		onWindowResize() {
			const isMobile = document.body.clientWidth < 480
			this.$store.commit('SET_IS_MOBILE', isMobile)
		},
	},
	sockets: {
		connect() {
			console.log('socket connected');
		},

	},
}
</script>

<style lang="scss" scoped>
#app {
	width: 100vw;
	height: 100dvh;
	font-weight: 400;
	font-size: 0.875rem;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	color: #2c3e50;
	overflow-y: hidden;

	&.is-dark-bg {
		background-color: #000;
	}

	& .base-bar {
		position: fixed;
		bottom: 0;
		z-index: 10;
	}

	.kode-wallpaper-scrim {
		position: fixed;
		inset: 0;
		background: rgba(15, 25, 30, 0.45);
		pointer-events: none;
		z-index: 1;
	}

	.kode-content-layer {
		position: relative;
		z-index: 2;
		flex: 1;
		min-height: 0;
	}
}

/* Driver.js tour — KODE styling overrides. Unscoped so the global
   .driver-popover.kode-tour-popover selector lands. */
.driver-popover.kode-tour-popover {
	background: rgba(255, 255, 255, 0.97);
	backdrop-filter: blur(24px) saturate(180%);
	-webkit-backdrop-filter: blur(24px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.6);
	border-radius: 18px;
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.85),
		0 18px 48px rgba(0, 0, 0, 0.25);
	color: #1f2937;
	font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	padding: 1.1rem 1.2rem;
}

.driver-popover.kode-tour-popover .driver-popover-title {
	color: #1f2937;
	font-size: 1.0625rem;
	font-weight: 500;
	letter-spacing: -0.01em;
	margin-bottom: 0.4rem;
}

.driver-popover.kode-tour-popover .driver-popover-description {
	color: rgba(0, 0, 0, 0.72);
	font-size: 0.875rem;
	line-height: 1.5;
}

.driver-popover.kode-tour-popover .driver-popover-footer {
	margin-top: 0.85rem;
}

.driver-popover.kode-tour-popover .driver-popover-progress-text {
	color: rgba(0, 0, 0, 0.55);
	font-size: 0.75rem;
}

.driver-popover.kode-tour-popover .driver-popover-next-btn,
.driver-popover.kode-tour-popover .driver-popover-prev-btn {
	background: rgba(0, 0, 0, 0.06);
	color: #1f2937;
	border: 1px solid rgba(0, 0, 0, 0.06);
	border-radius: 999px;
	padding: 0.4rem 1rem;
	font-size: 0.8125rem;
	font-weight: 500;
	text-shadow: none;
	box-shadow: none;
}

.driver-popover.kode-tour-popover .driver-popover-next-btn {
	background: #2d5f4e;
	color: #fff;
	border-color: #2d5f4e;
}

.driver-popover.kode-tour-popover .driver-popover-next-btn:hover {
	background: #3f7a66;
}

.driver-popover.kode-tour-popover .driver-popover-close-btn {
	color: rgba(0, 0, 0, 0.45);
	font-size: 1.25rem;
	padding: 0.25rem 0.5rem;
}

.driver-popover.kode-tour-popover .driver-popover-arrow-side-bottom.driver-popover-arrow,
.driver-popover.kode-tour-popover .driver-popover-arrow-side-top.driver-popover-arrow,
.driver-popover.kode-tour-popover .driver-popover-arrow-side-left.driver-popover-arrow,
.driver-popover.kode-tour-popover .driver-popover-arrow-side-right.driver-popover-arrow {
	border-color: rgba(255, 255, 255, 0.97);
}
</style>
