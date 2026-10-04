---
'@wolfstar/cli': minor
---

feat(cli): a full-screen dashboard for `stars dev` (#252)

On a terminal of at least 90x20 `stars dev` opens a dashboard: a sidebar with the state of the session (framework
version, uptime, port, tunnel, log file) and the channel and level filters, and the log stream next to it with level
badges, highlighted URLs, paths, names and numbers, blocks for entries with detail lines, and stack frames folded
under their error. The compact panel is still there (`dev.layout: 'panel'`, `--layout panel`, the `v` key, or a small
terminal).

When the application commands the bot registers change, a card under the stream asks (`Refresh commands? (y/n)`)
before the bot redeploys them, with `dev.commands.refresh: 'prompt'` (the default).

New keys: `d` stops the bot until the next `r`, `v` switches layout, and the dashboard's own: `←`/`→` and `Tab` to
select a channel or a level, `Space` to toggle it, `s` to solo it, `a` for all, `b` to group by channel, `g`/`G` for
the top and back to live, `/` to search. New flag: `--layout`.
