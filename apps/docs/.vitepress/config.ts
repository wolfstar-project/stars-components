import { defineConfig } from 'vitepress';
import typedocSidebar from '../api/typedoc-sidebar.json';
import { packages } from './data/packages';

const packageGroups = ['Core framework', 'Infrastructure', 'Shared pieces', 'Platform helpers'] as const;

export default defineConfig({
	title: 'Stars Components',
	description: 'Documentation for the shared packages powering the Star Network.',
	lang: 'en-US',
	cleanUrls: true,
	lastUpdated: true,
	head: [
		['meta', { name: 'theme-color', content: '#7657ff' }],
		['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
	],
	markdown: {
		lineNumbers: true,
		image: {
			lazyLoading: true
		}
	},
	themeConfig: {
		logo: {
			src: 'https://cdn.wolfstar.rocks/wolfstar-assets/wolfstar.png',
			alt: 'WolfStar'
		},
		nav: [
			{ text: 'Guide', link: '/guide/getting-started' },
			{ text: 'Packages', link: '/packages/' },
			{ text: 'API', link: '/api/' },
			{
				text: 'Community',
				items: [
					{ text: 'Contributing', link: '/guide/contributing' },
					{ text: 'GitHub', link: 'https://github.com/wolfstar-project/stars-components' },
					{ text: 'WolfStar', link: 'https://wolfstar.rocks' }
				]
			}
		],
		sidebar: {
			'/guide/': [
				{
					text: 'Introduction',
					items: [
						{ text: 'Getting started', link: '/guide/getting-started' },
						{ text: 'Architecture', link: '/guide/architecture' }
					]
				},
				{
					text: 'Guides',
					items: [
						{ text: 'Build a command', link: '/guide/commands' },
						{ text: 'Environment variables', link: '/guide/environment' },
						{ text: 'Testing interactions', link: '/guide/testing' }
					]
				},
				{
					text: 'Project',
					items: [{ text: 'Contributing', link: '/guide/contributing' }]
				}
			],
			'/packages/': [
				{ text: 'Package index', link: '/packages/' },
				...packageGroups.map((category) => ({
					text: category,
					collapsed: false,
					items: packages
						.filter((item) => item.category === category)
						.map((item) => ({ text: item.name.replace('@wolfstar/', ''), link: `/packages/${item.path}` }))
				}))
			],
			'/api/': [
				{
					text: 'API reference',
					items: typedocSidebar
				}
			]
		},
		search: {
			provider: 'local',
			options: {
				detailedView: true
			}
		},
		socialLinks: [{ icon: 'github', link: 'https://github.com/wolfstar-project/stars-components' }],
		editLink: {
			pattern: 'https://github.com/wolfstar-project/stars-components/edit/main/apps/docs/:path',
			text: 'Edit this page on GitHub'
		},
		footer: {
			message: 'Released under the Apache-2.0 License.',
			copyright: 'Copyright © WolfStar Project'
		},
		docFooter: {
			prev: 'Previous page',
			next: 'Next page'
		},
		outline: {
			level: [2, 3],
			label: 'On this page'
		},
		lastUpdated: {
			text: 'Last updated'
		},
		returnToTopLabel: 'Return to top',
		sidebarMenuLabel: 'Menu',
		darkModeSwitchLabel: 'Appearance',
		lightModeSwitchTitle: 'Switch to light theme',
		darkModeSwitchTitle: 'Switch to dark theme'
	}
});
