---
'@wolfstar/cli': patch
---

Fix `stars dev` asking to redeploy commands that did not change. The bot is no longer started (or restarted) while a build is still writing the output, so it cannot report a part of its commands, and the commands the bot registers are compared with the deployed ones rather than with the previous report, so a command reported as removed and then added again no longer prompts. Accepting the prompt while a build runs is refused with a warning instead of registering an incomplete set of commands.
