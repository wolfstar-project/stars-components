import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client';
import type { EnhanceAppContext, Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import PackageGrid from './PackageGrid.vue';
import PackageHeader from './PackageHeader.vue';
import '@shikijs/vitepress-twoslash/style.css';
import 'virtual:group-icons.css';
import './styles.css';

export default {
	extends: DefaultTheme,
	enhanceApp({ app }: EnhanceAppContext) {
		app.component('PackageGrid', PackageGrid);
		app.component('PackageHeader', PackageHeader);
		app.use(TwoslashFloatingVue);
	}
} satisfies Theme;
