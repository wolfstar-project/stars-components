<script setup lang="ts">
import { computed, ref } from 'vue';
import { packages } from '../data/packages';

const categories = ['All', 'Core framework', 'Infrastructure', 'Shared pieces', 'Platform helpers'] as const;
const activeCategory = ref<(typeof categories)[number]>('All');
const visiblePackages = computed(() =>
	activeCategory.value === 'All' ? packages : packages.filter((item) => item.category === activeCategory.value)
);
</script>

<template>
	<div class="package-filter" aria-label="Filter packages by category">
		<button
			v-for="category in categories"
			:key="category"
			type="button"
			:class="{ active: activeCategory === category }"
			:aria-pressed="activeCategory === category"
			@click="activeCategory = category"
		>
			{{ category }}
		</button>
	</div>

	<div class="package-grid">
		<a v-for="item in visiblePackages" :key="item.name" class="package-card" :href="`/packages/${item.path}`">
			<span class="package-card-category">{{ item.category }}</span>
			<h2>{{ item.name }}</h2>
			<p>{{ item.description }}</p>
			<span class="package-card-footer">
				<span>v{{ item.version }}</span>
				<span aria-hidden="true">Read docs →</span>
			</span>
		</a>
	</div>
</template>
