import path from 'node:path';
import { transformerTwoslash } from '@shikijs/vitepress-twoslash';
import { markdownItImageSize } from 'markdown-it-image-size';
import { defineConfig } from 'vitepress';
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons';
import llmstxt from 'vitepress-plugin-llms';
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
		},
		languages: ['ts', 'js', 'json', 'bash', 'dotenv'],
		codeTransformers: [
			transformerTwoslash({
				twoslashOptions: {
					compilerOptions: {
						moduleResolution: 100
					}
				}
			})
		],
		config(md) {
			md.use(groupIconMdPlugin, {
				titleBar: {
					includeSnippet: true
				}
			});
			md.use(markdownItImageSize, {
				publicDir: path.resolve(import.meta.dirname, '../public')
			});
		}
	},
	vite: {
		plugins: [
			groupIconVitePlugin({
				customIcon: {
					pnpm: 'vscode-icons:file-type-pnpm',
					npm: 'vscode-icons:file-type-npm',
					yarn: 'vscode-icons:file-type-yarn',
					bun: 'vscode-icons:file-type-bun'
				}
			}),
			llmstxt({
				ignoreFiles: ['api/**'],
				description: 'Shared utilities and components powering the Star Network',
				details: `\
Stars Components is a TypeScript monorepo of focused packages for Discord HTTP interactions, infrastructure, integrations, and testing.

- HTTP-first Discord bots with \`@wolfstar/http-framework\`
- Typed environment parsing, logging, and Result-based fetch helpers
- Shared pieces for commands, i18n, and Influx metrics
- Generated API reference from public package entry points`
			})
		],
		optimizeDeps: {
			include: ['@shikijs/vitepress-twoslash/client']
		}
	},
	themeConfig: {
		logo: {
			src: 'https://cdn.wolfstar.rocks/wolfstar-assets/wolfstar.png',
			alt: 'WolfStar'
		},
		nav: [
			{ text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
			{ text: 'Packages', link: '/packages/', activeMatch: '/packages/' },
			{ text: 'API', link: '/api/', activeMatch: '/api/' },
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
				detailedView: true,
				miniSearch: {
					searchOptions: {
						boostDocument(documentId) {
							if (documentId.startsWith('/guide/')) return 2;
							if (documentId.startsWith('/packages/')) return 1.5;
							if (documentId.startsWith('/api/')) return 0.75;
							return 1;
						}
					}
				}
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
