import { EventGatewayListener, RegisterAsGatewayListener, type Message } from '@wolfstar/plugin-gateway';

/** Answers `!howl` in any channel the bot can read, a message-based command HTTP interactions cannot receive. */
@RegisterAsGatewayListener('messageCreate')
export class HowlListener extends EventGatewayListener<'messageCreate'> {
	public override async run(message: Message) {
		if (message.author.bot || message.content.trim().toLowerCase() !== '!howl') return;
		await message.reply({ content: 'Awoo! 🐺' });
	}
}
