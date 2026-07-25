<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
	description: string;
	name: string;
	path: string;
	version: string;
}>();

const copied = ref(false);
const installCommand = `pnpm add ${props.name}`;

async function copyInstallCommand() {
	await navigator.clipboard.writeText(installCommand);
	copied.value = true;
	window.setTimeout(() => {
		copied.value = false;
	}, 1600);
}
</script>

<template>
	<header class="package-header">
		<div class="package-header-kicker">Package · v{{ version }}</div>
		<h1>{{ name }}</h1>
		<p>{{ description }}</p>
		<div class="package-header-actions">
			<button type="button" class="install-command" :aria-label="`Copy ${installCommand}`" @click="copyInstallCommand">
				<code>{{ installCommand }}</code>
				<span>{{ copied ? 'Copied!' : 'Copy' }}</span>
			</button>
			<a :href="`https://npmx.dev/package/${name}`">npm</a>
			<a :href="`https://github.com/wolfstar-project/stars-components/tree/main/packages/${path}`">Source</a>
		</div>
	</header>
</template>
