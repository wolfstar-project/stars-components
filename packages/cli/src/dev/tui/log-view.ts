import { DEFAULT_LOG_LEVELS, LOG_LEVELS, type ResolvedStarsConfig, type StarsLogLevel } from '@wolfstar/schema';
import { stripVTControlCharacters } from 'node:util';
import { isErrorDetail, type LogEntry, type LogLevel } from '../../utils/log-buffer.js';

/** The levels a view filters by, in the order the dev UI lists them. */
export const VIEW_LEVELS = ['error', 'warn', 'info', 'debug', 'trace'] as const satisfies readonly StarsLogLevel[];

/** `success` is an `info` that went well: it is painted differently, but filtered with it. */
export function viewLevel(level: LogLevel): StarsLogLevel {
	return level === 'success' ? 'info' : level;
}

export function isLogLevel(value: string): value is StarsLogLevel {
	return (LOG_LEVELS as readonly string[]).includes(value);
}

/**
 * Which entries a renderer shows. A channel is visible when `allow` lists it (or is `null`, for every channel) and
 * `hidden` does not: `allow` is what a preset or a solo narrows the view to, `hidden` what was switched off one by
 * one, so a channel that first logs later follows the preset instead of popping up.
 */
export interface LogViewFilter {
	readonly allow: ReadonlySet<string> | null;
	readonly hidden: ReadonlySet<string>;
	readonly levels: ReadonlySet<StarsLogLevel>;
	readonly query: string;
}

export interface LogViewFlags {
	/** `--channel`, each value possibly a comma-separated list. */
	channels?: readonly string[];
	/** `--level`: this level and every more severe one. */
	level?: StarsLogLevel;
}

/** The filter a session starts with: `--channel`/`--level` first, then `dev.logs`, then everything but `trace`. */
export function initialLogView(config: Pick<ResolvedStarsConfig, 'dev'>, flags: LogViewFlags = {}): LogViewFilter {
	const flagged =
		flags.channels
			?.flatMap((value) => value.split(','))
			.map((value) => value.trim())
			.filter(Boolean) ?? [];
	const channels = flagged.length > 0 ? flagged : (config.dev.logs?.channels ?? null);
	const levels = flags.level ? LOG_LEVELS.slice(LOG_LEVELS.indexOf(flags.level)) : (config.dev.logs?.levels ?? DEFAULT_LOG_LEVELS);
	return { allow: channels === null ? null : new Set(channels), hidden: new Set(), levels: new Set(levels), query: '' };
}

export function isChannelVisible(filter: Pick<LogViewFilter, 'allow' | 'hidden'>, channel: string): boolean {
	return (filter.allow === null || filter.allow.has(channel)) && !filter.hidden.has(channel);
}

export function matchesView(entry: LogEntry, filter: LogViewFilter): boolean {
	if (!isChannelVisible(filter, entry.channel) || !filter.levels.has(viewLevel(entry.level))) return false;
	if (!filter.query) return true;
	const query = filter.query.toLowerCase();
	return [entry.text, ...(entry.detail ?? [])].some((line) => stripVTControlCharacters(line).toLowerCase().includes(query));
}

export function toggleChannel(filter: LogViewFilter, channel: string): LogViewFilter {
	const allow = filter.allow === null ? null : new Set(filter.allow);
	const hidden = new Set(filter.hidden);
	if (isChannelVisible(filter, channel)) {
		hidden.add(channel);
		allow?.delete(channel);
	} else {
		hidden.delete(channel);
		allow?.add(channel);
	}

	return { ...filter, allow, hidden };
}

/** Shows only `channel`; on the channel that is already alone, shows every channel again. */
export function soloChannel(filter: LogViewFilter, channel: string): LogViewFilter {
	const alone = filter.allow?.size === 1 && filter.allow.has(channel) && filter.hidden.size === 0;
	return { ...filter, allow: alone ? null : new Set([channel]), hidden: new Set() };
}

/** Never leaves the view without a level: switching the last one off is ignored. */
export function toggleLevel(filter: LogViewFilter, level: StarsLogLevel): LogViewFilter {
	const levels = new Set(filter.levels);
	if (levels.has(level)) levels.delete(level);
	else levels.add(level);
	return levels.size === 0 ? filter : { ...filter, levels };
}

/** Shows only `level`; on the level that is already alone, shows every level again. */
export function soloLevel(filter: LogViewFilter, level: StarsLogLevel): LogViewFilter {
	const alone = filter.levels.size === 1 && filter.levels.has(level);
	return { ...filter, levels: new Set(alone ? VIEW_LEVELS : [level]) };
}

/** One terminal line of the log pane. */
export type LogRow =
	| { readonly kind: 'entry'; readonly entry: LogEntry; readonly text: string }
	/** A line that belongs to the entry above it: its detail, the rest of a multi-line message, a stack frame. */
	| { readonly kind: 'detail'; readonly entry: LogEntry; readonly text: string }
	| { readonly kind: 'rule' }
	| { readonly kind: 'header'; readonly channel: string; readonly count: number };

export interface BuildRowsOptions {
	/** Lists the entries channel by channel, in the order the channels first logged, instead of by time. */
	group?: boolean;
}

/**
 * Lays entries out as terminal lines. An entry with detail lines is a block, set apart by a rule above and below; a
 * stack frame the bot printed after an error is folded under that error instead of being a message of its own.
 */
export function buildRows(entries: readonly LogEntry[], options: BuildRowsOptions = {}): LogRow[] {
	if (!options.group) return layout(entries);

	const channels = new Map<string, LogEntry[]>();
	for (const entry of entries) {
		const list = channels.get(entry.channel);
		if (list) list.push(entry);
		else channels.set(entry.channel, [entry]);
	}

	return [...channels].flatMap(([channel, list]) => [{ kind: 'header', channel, count: list.length } as const, ...layout(list)]);
}

/**
 * What a terminal line can show of a log line: no colour codes, and no control characters. A tab is the one that
 * matters: the terminal expands it to up to eight columns the layout never counted, and the line wraps.
 */
function printable(text: string): string {
	return stripVTControlCharacters(text).replaceAll('\t', '  ').replace(CONTROL_CHARACTERS, '');
}

// oxlint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

function layout(entries: readonly LogEntry[]): LogRow[] {
	const rows: LogRow[] = [];
	const rule = () => {
		if (rows.length > 0 && rows.at(-1)!.kind !== 'rule') rows.push({ kind: 'rule' });
	};

	for (const entry of entries) {
		const [first = '', ...rest] = stripVTControlCharacters(entry.text).split('\n').map(printable);
		if (isErrorDetail(entry) && rows.at(-1) !== undefined && rows.at(-1)!.kind !== 'rule') {
			rows.push({ kind: 'detail', entry, text: first.trim() });
			continue;
		}

		const block = entry.level !== 'error' && (entry.detail?.length ?? 0) > 0;
		if (block) rule();
		rows.push({ kind: 'entry', entry, text: first });
		for (const line of [...rest, ...(entry.detail ?? []).map(printable)]) rows.push({ kind: 'detail', entry, text: line });
		if (block) rows.push({ kind: 'rule' });
	}

	if (rows.at(-1)?.kind === 'rule') rows.pop();
	return rows;
}

/**
 * Where a scrolled-back view stops: the entry of its last line, and how many lines without an entry (a rule) follow
 * it. An index into the rows would drift as soon as the buffer drops its oldest entries or a filter changes.
 */
export interface LogPin {
	readonly id: number;
	readonly extra: number;
}

const entryId = (row: LogRow | undefined): number | null => (row?.kind === 'entry' || row?.kind === 'detail' ? row.entry.id : null);

/** The pin for a view ending at `end` (exclusive), `null` when that is the end of the stream: the view is live. */
export function pinAt(rows: readonly LogRow[], end: number): LogPin | null {
	if (end >= rows.length) return null;
	for (let index = end - 1; index >= 0; index--) {
		const id = entryId(rows[index]);
		if (id !== null) return { id, extra: end - 1 - index };
	}

	return null;
}

/**
 * One past the last row a pinned view shows. When the pinned entry is gone (dropped from the buffer, or filtered
 * out) the view falls back to the oldest rows there are, which is where that entry was heading.
 */
export function pinnedEnd(rows: readonly LogRow[], pin: LogPin | null, height: number): number {
	if (pin === null) return rows.length;
	const floor = Math.min(height, rows.length);
	const index = rows.findLastIndex((row) => entryId(row) === pin.id);
	return index < 0 ? floor : Math.min(rows.length, Math.max(floor, index + 1 + pin.extra));
}

/** The row of the most recent error among `rows`, whatever order they are listed in, `-1` without one. */
export function newestErrorRow(rows: readonly LogRow[]): number {
	let newest = -1;
	for (const [index, row] of rows.entries()) {
		if (row.kind !== 'entry' || row.entry.level !== 'error') continue;
		const current = rows[newest];
		if (current?.kind !== 'entry' || row.entry.id > current.entry.id) newest = index;
	}

	return newest;
}

/** Lays labels out as words on lines of `width` columns. Each line lists the indices of its labels. */
export function wrapLabels(labels: readonly string[], width: number): number[][] {
	const lines: number[][] = [];
	let used = 0;
	for (const [index, label] of labels.entries()) {
		if (lines.length === 0 || (used > 0 && used + 1 + label.length > width)) {
			lines.push([]);
			used = 0;
		}

		lines.at(-1)!.push(index);
		used += (used > 0 ? 1 : 0) + label.length;
	}

	return lines;
}

/** The `[start, end)` of at most `max` lines out of `count` that keeps `focused` in sight. */
export function windowAround(count: number, focused: number, max: number): [start: number, end: number] {
	if (count <= max) return [0, count];
	const size = Math.max(1, max);
	const start = Math.max(0, Math.min(count - size, focused - size + 1));
	return [start, start + size];
}

export type TokenKind = 'url' | 'path' | 'number' | 'name' | 'dim' | 'ok' | 'warn' | 'error';

export interface Segment {
	readonly text: string;
	readonly token?: TokenKind;
}

const TOKEN = new RegExp(
	[
		/(?<url>https?:\/\/[^\s)]+)/,
		/(?<uuid>\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b)/,
		/(?<route>\b(?:slash|user|message|component|modal|autocomplete):[^\s,]+)/,
		/(?<path>(?:\.{1,2}\/|\/)?(?:[\w@.-]+\/)+[\w@.-]+\.[a-z]{1,5}\b(?::\d+(?::\d+)?)?)/,
		/(?<quoted>`[^`\n]+`|'[^'\n]+')/,
		/(?<method>\b(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b)/,
		/(?<duration>\b\d+(?:\.\d+)?(?:ms|s)\b)/,
		/(?<number>\b\d+\b)/
	]
		.map((pattern) => pattern.source)
		.join('|'),
	'g'
);

/**
 * Splits a log line into what is worth telling apart at a glance: URLs, file paths, names, numbers. On the `http`
 * channel the status code carries its class (`ok`, `warn`, `error`) instead of being a plain number.
 */
export function highlight(text: string, channel?: string): Segment[] {
	const segments: Segment[] = [];
	let index = 0;
	for (const match of text.matchAll(TOKEN)) {
		const groups = match.groups!;
		if (match.index > index) segments.push({ text: text.slice(index, match.index) });
		segments.push({ text: match[0], token: tokenOf(groups, match[0], channel) });
		index = match.index + match[0].length;
	}

	if (index < text.length) segments.push({ text: text.slice(index) });
	return segments;
}

function tokenOf(groups: Record<string, string | undefined>, text: string, channel: string | undefined): TokenKind {
	if (groups.url !== undefined) return 'url';
	if (groups.uuid !== undefined || groups.path !== undefined) return groups.path !== undefined ? 'path' : 'dim';
	if (groups.route !== undefined || groups.quoted !== undefined || groups.method !== undefined) return 'name';
	if (groups.number !== undefined && channel === 'http' && text.length === 3) {
		return text.startsWith('5') ? 'error' : text.startsWith('4') ? 'warn' : 'ok';
	}

	return 'number';
}

const BADGES: Record<LogLevel, string> = { trace: 'T', debug: 'D', info: 'I', success: 'I', warn: 'W', error: 'E' };

/** The one-letter badge of a level, the way the reference dashboards print them. */
export function levelBadge(level: LogLevel): string {
	return BADGES[level];
}

/** `22:07:01`, always 24-hour, whatever the locale. */
export function formatClock(time: number): string {
	const date = new Date(time);
	const pad = (value: number) => value.toString().padStart(2, '0');
	return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
