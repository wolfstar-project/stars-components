import { SlashCommandSubcommandBuilder } from '@discordjs/builders';
import { Command, RegisterCommand, RegisterSubcommand } from '@wolfstar/http-framework';

@RegisterCommand((builder) => builder.setName('math').setDescription('Perform calculations'))
export class MathCommand extends Command {
	@RegisterSubcommand(
		new SlashCommandSubcommandBuilder()
			.setName('add')
			.setDescription('Add two numbers')
			.addNumberOption((option) => option.setName('left').setDescription('Left value').setRequired(true))
			.addNumberOption((option) => option.setName('right').setDescription('Right value').setRequired(true))
	)
	public add(interaction: Command.ChatInputInteraction, { left, right }: { left: number; right: number }) {
		return interaction.reply({ content: `${left + right}` });
	}

	@RegisterSubcommand(
		new SlashCommandSubcommandBuilder()
			.setName('subtract')
			.setDescription('Subtract two numbers')
			.addNumberOption((option) => option.setName('left').setDescription('Left value').setRequired(true))
			.addNumberOption((option) => option.setName('right').setDescription('Right value').setRequired(true))
	)
	public subtract(interaction: Command.ChatInputInteraction, { left, right }: { left: number; right: number }) {
		return interaction.reply({ content: `${left - right}` });
	}
}
