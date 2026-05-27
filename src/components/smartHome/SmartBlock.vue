<template>
	<div class="common-card">
		<div class="blur-background"></div>
		<div class="wuji-content _box is-flex is-flex-direction-column">
			<h6 class="title is-4 mb-0 has-text-white is-flex-shrink-0">{{ $t('Smarten up your home') }}</h6>
			<div class="is-flex is-align-items-center is-flex-grow-1 _notice-content-text">
				<div class="info ">
					<div class="des two-line  is-size-14px">
						{{
						$t('We want to give you a smart home experience with privacy, high speed, and localized storage.')
						}}
					</div>
				</div>
				<b-image :src="require('@/assets/img/smart/smart_icon.svg')" class="is-80x80"></b-image>
			</div>
			<div class="buttons is-flex is-flex-shrink-0 is-flex-direction-row-reverse">
				<b-button class="mb-0" rounded size="is-small" type="is-primary" disabled>{{
					$t('In development')
					}}
				</b-button>
			</div>
		</div>

	</div>
</template>

<script>
// KODE OS: was a "Shoot it on Discord!" button pointing at the
// CasaOS upstream Discord. Removed per the v0.2.0-alpha cleanup —
// we don't have a Discord yet and don't want to send users to the
// upstream channel. Button is now `disabled` so the card still
// communicates "in development" without offering a dead action.
export default {
	name: "smart-block",
}
</script>

<style lang="scss" scoped>
._box {
	height: 10rem;
	padding: 1rem 1.25rem;
	padding-top: 1.125rem;
	margin-bottom: 1rem;

	._notice-content-text {
		margin-right: 2rem;
		margin-left: 2rem;
	}
}
.des{
	line-height: 1.5em;
}
</style>
