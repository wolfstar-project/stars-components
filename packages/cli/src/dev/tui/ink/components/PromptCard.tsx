import { Box, Text } from 'ink';
import { describeCommand } from '../../../../utils/command-diff.js';
import type { DevPrompt } from '../../../dev-service.js';
import { usePaint } from '../theme.js';

/** The rows a prompt takes, border included, so the log pane above it can be sized. */
export function promptHeight(prompt: DevPrompt, available: number): number {
	return Math.min(Math.max(4, available), prompt.changes.length + 4);
}

/**
 * The card under the log stream that asks before the bot's commands are deployed again: a redeploy changes what
 * every user of the application sees, so it is never done behind the developer's back.
 */
export function PromptCard({ prompt, width, height }: { prompt: DevPrompt; width: number; height: number }) {
	const paint = usePaint();
	// Border (2), title and question leave the rest to the list.
	const room = Math.max(0, height - 4);
	const shown = prompt.changes.slice(0, prompt.changes.length > room ? Math.max(0, room - 1) : room);
	const more = prompt.changes.length - shown.length;

	return (
		<Box flexDirection="column" width={width} height={height} borderStyle="single" borderColor={paint('accent')} paddingX={1}>
			<Text bold color={paint('accent')} wrap="truncate-end">
				Commands updated:
			</Text>
			{shown.map((change) => (
				<Text key={`${change.guild}:${change.type}:${change.name}`} wrap="truncate-end">
					<Text dimColor>{'- '}</Text>
					<Text color={paint(change.kind === 'removed' ? 'error' : change.kind === 'added' ? 'success' : 'url')}>
						{describeCommand(change)}
					</Text>
					<Text dimColor>{` ${change.kind}`}</Text>
				</Text>
			))}
			{more > 0 && <Text dimColor>{`  and ${more} more`}</Text>}
			<Text wrap="truncate-end">
				Refresh commands? <Text dimColor>(y/n)</Text>
			</Text>
		</Box>
	);
}
