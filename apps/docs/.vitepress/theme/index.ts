import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import PackageGrid from './PackageGrid.vue';
import PackageHeader from './PackageHeader.vue';
import './styles.css';

export default {
	extends: DefaultTheme,
	enhanceApp({ app }) {
		app.component('PackageGrid', PackageGrid);
		app.component('PackageHeader', PackageHeader);
	}
} satisfies Theme;
