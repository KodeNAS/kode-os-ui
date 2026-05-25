/*
 * @LastEditors: zhanghengxin ezreal.zhang@icewhale.org
 * @LastEditTime: 2022/12/1 下午8:21
 * @FilePath: /CasaOS-UI/src/router/index.js
 * @Description:
 *
 * Copyright (c) 2022 by IceWhale, All Rights Reserved.
 */

import Vue       from 'vue'
import VueRouter from 'vue-router'
import api       from '@/service/api'
import store     from '@/store'
import route     from './route.js'

Vue.use(VueRouter)

const routes = route

const router = new VueRouter({
	mode: 'hash',
	base: process.env.BASE_URL,
	routes
})

const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
	return originalPush.call(this, location).catch((err) => err)
}

const needInit = async () => {
	if (store.state.needInitialization) {
		return true
	}
	try {
		let userStatusRes = await api.users.getUserStatus();
		if (userStatusRes.data.success === 200 && !userStatusRes.data.data.initialized) {
			store.commit('SET_NEED_INITIALIZATION', true)
			store.commit('SET_INIT_KEY', userStatusRes.data.data.key)
			localStorage.removeItem("access_token");
			localStorage.removeItem("refresh_token");
			return true
		} else {
			return false
		}
	} catch (error) {
		console.error(error)
		return false
	}
}

// KODE OS v0.2.0-alpha+ wizard-token gating. The bootable image's
// first-boot service mints a random token at boot, writes it to
// /var/lib/casaos/www/.wizard-token (web-accessible) + shows it on
// the OLED + MOTD as part of the wizard URL. This function returns
// true only if the URL token matches the file token.
//
// Threat model caveat: the token file is fetchable from the LAN, so
// this is really URL obfuscation rather than authentication. The
// real security gate is CasaOS's getUserStatus.initialized flag,
// which we also check before allowing the wizard to render. A LAN
// attacker who reads /.wizard-token COULD race the buyer to admin
// creation — that window is the few minutes between first boot and
// wizard completion. Proper server-validated tokens land in v0.3.0.
const wizardTokenMatches = async (urlToken) => {
	if (!urlToken) return false
	try {
		const r = await fetch('/.wizard-token', { cache: 'no-store' })
		if (!r.ok) return false  // file gone → wizard already done / never set
		const fileToken = (await r.text()).trim()
		return fileToken.length > 0 && fileToken === urlToken
	} catch (e) {
		return false
	}
}

// Resolve where needInit redirects to. For bootable images
// (/.wizard-token present), force everyone through the token URL so
// /welcome can't be hit directly. For v0.1.0-alpha manual installs
// (no token file), keep the legacy /welcome redirect.
const wizardEntryRoute = async () => {
	try {
		const r = await fetch('/.wizard-token', { cache: 'no-store' })
		if (r.ok) {
			const token = (await r.text()).trim()
			if (token.length > 0) return `/wizard/${token}`
		}
	} catch (e) { /* fall through */ }
	return '/welcome'
}


router.beforeEach(async (to, from, next) => {
	const accessToken = localStorage.getItem("access_token");
	const version = localStorage.getItem("version");
	const requireAuth = to.matched.some(record => record.meta.requireAuth);
	const isWizardToken = to.matched.some(record => record.meta.wizardToken);

	// 判断是否需要初始化
	let needInitRes = await needInit();

	// /wizard/:token — the token-gated entry point. Both conditions
	// must hold: server reports uninitialized AND URL token matches
	// the file. Either failing → bounce to login (which on a fresh
	// image is the only other reachable page and tells the buyer to
	// re-check the URL from the OLED).
	if (isWizardToken) {
		if (!needInitRes) {
			next('/');  // already initialized — wizard's done, go home
			return
		}
		if (!await wizardTokenMatches(to.params.token)) {
			next('/login');  // bad token, no wizard for you
			return
		}
		next();
		return
	}

	if (to.path !== '/welcome') {
		if (needInitRes) {
			// Redirect to the wizard. On bootable images this is the
			// token URL; on script-installed v0.1.0-alpha boxes it's
			// the legacy /welcome.
			next(await wizardEntryRoute());
		} else {
			if (requireAuth && !accessToken) {
				next('/login');
			} else {
				switch (to.path) {
					case "/login":
						if (accessToken) {
							next('/');
						}
						break;

					case "/logout":
						localStorage.removeItem("access_token");
						localStorage.removeItem("refresh_token");
						localStorage.removeItem("wallpaper");
						localStorage.removeItem("user");
						next('/login');
						break;

					default:
						if (version == null) {
							localStorage.removeItem("access_token");
							next('/login');
						}
						break;
				}
				next();
			}
		}
	} else {
		// KODE OS: allow re-entering /welcome from inside the app when the
		// user clicks "Re-run setup" in Settings (?replay=1) — they're
		// already authenticated and just want to replay the wizard.
		// Also keep the bare /welcome path working for v0.1.0-alpha
		// script-installed boxes where /.wizard-token doesn't exist.
		if (needInitRes || (to.query.replay === '1' && accessToken)) {
			next();
		} else {
			next("/login");
		}
	}
});


export default router
