import { EmbedBuilder, time, TimestampStyles } from '@discordjs/builders';
import { Command, container, RegisterCommand } from '@wolfstar/http-framework';
import { applyLocalizedBuilder, getSupportedUserLanguageName, getT, type TFunction } from '@wolfstar/http-framework-i18n';
import {
	ButtonStyle,
	ComponentType,
	MessageFlags,
	type APIActionRowComponent,
	type APIComponentInMessageActionRow,
	type APIEmbedField
} from 'discord-api-types/v10';
import { cpus, uptime, type CpuInfo } from 'node:os';
import { getInvite, getRepository } from '../lib/information.js';

type TranslateFn = TFunction<'commands/shared'>;

@RegisterCommand((builder) => applyLocalizedBuilder(builder, 'commands/shared:info'))
export class SharedCommand extends Command {
	public override chatInputRun(interaction: Command.ChatInputInteraction) {
		const lng = getSupportedUserLanguageName(interaction);
		const t = getT(lng, 'commands/shared');
		const embed = new EmbedBuilder()
			.setDescription(t('infoEmbedDescription'))
			.addFields(this.getUptimeStatistics(t), this.getServerUsageStatistics(t, lng));
		const components = this.getComponents(t);

		return interaction.reply({ embeds: [embed.toJSON()], components, flags: MessageFlags.Ephemeral });
	}

	private getUptimeStatistics(t: TranslateFn): APIEmbedField {
		const now = Date.now();
		const nowSeconds = Math.round(now / 1000);

		return {
			name: t('infoFieldUptimeTitle'),
			value: t('infoFieldUptimeValue', {
				host: time(Math.round(nowSeconds - uptime()), TimestampStyles.RelativeTime),
				client: time(Math.round(nowSeconds - process.uptime()), TimestampStyles.RelativeTime)
			})
		};
	}

	private getServerUsageStatistics(t: TranslateFn, lng: string): APIEmbedField {
		const usage = process.memoryUsage();

		return {
			name: t('infoFieldServerUsageTitle'),
			value: t('infoFieldServerUsageValue', {
				cpu: cpus().map(SharedCommand.formatCpuInfo.bind(null)).join(' | '),
				heapUsed: (usage.heapUsed / 1048576).toLocaleString(lng, { maximumFractionDigits: 2 }),
				heapTotal: (usage.heapTotal / 1048576).toLocaleString(lng, { maximumFractionDigits: 2 })
			})
		};
	}

	private getComponents(t: TranslateFn) {
		const url = getInvite();
		const support = this.getSupportComponent(t);
		const github = this.getGitHubComponent(t);
		const donate = this.getDonateComponent(t);
		const data = url
			? [this.getActionRow(support, this.getInviteComponent(t, url)), this.getActionRow(github, donate)]
			: [this.getActionRow(support, github, donate)];

		return data;
	}

	private getActionRow(...components: APIComponentInMessageActionRow[]): APIActionRowComponent<APIComponentInMessageActionRow> {
		return { type: ComponentType.ActionRow, components };
	}

	private getSupportComponent(t: TranslateFn): APIComponentInMessageActionRow {
		return {
			type: ComponentType.Button,
			style: ButtonStyle.Link,
			label: t('infoButtonSupport'),
			emoji: { name: '🆘' },
			url: 'https://discord.gg/6gakFR2'
		};
	}

	private getInviteComponent(t: TranslateFn, url: string): APIComponentInMessageActionRow {
		return {
			type: ComponentType.Button,
			style: ButtonStyle.Link,
			label: t('infoButtonInvite'),
			emoji: { name: '🎉' },
			url
		};
	}

	private getGitHubComponent(t: TranslateFn): APIComponentInMessageActionRow {
		return {
			type: ComponentType.Button,
			style: ButtonStyle.Link,
			label: t('infoButtonGitHub'),
			emoji: { id: '950888087188283422', name: 'github2' },
			url: getRepository()
		};
	}

	private getDonateComponent(t: TranslateFn): APIComponentInMessageActionRow {
		return {
			type: ComponentType.Button,
			style: ButtonStyle.Link,
			label: t('infoButtonDonate'),
			emoji: { name: '🧡' },
			url: 'https://donate.wolfstar.rocks'
		};
	}

	private static formatCpuInfo({ times }: CpuInfo) {
		return `${Math.round(((times.user + times.nice + times.sys + times.irq) / times.idle) * 10000) / 100}%`;
	}
}

void container.stores.loadPiece({ name: 'info', piece: SharedCommand as any, store: 'commands' });
