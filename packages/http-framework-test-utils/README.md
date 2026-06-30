# `@wolfstar/http-framework-test-utils`

Test utilities and fixtures for [`@wolfstar/http-framework`](https://github.com/wolfstar-project/stars-components/tree/main/packages/http-framework) — designed to work with [Vitest](https://vitest.dev/).

## Installation

```bash
npm install --save-dev @wolfstar/http-framework-test-utils vitest
# or
pnpm add -D @wolfstar/http-framework-test-utils vitest
```

## Usage

### `createTestHarness`

The entry point for most tests. Returns a `TestableClient` and an `InteractionTestRunner` wired together:

```typescript
import { createTestHarness } from '@wolfstar/http-framework-test-utils';

const { client, runner } = createTestHarness();

// Load your commands before running tests
await client.load();
```

### Running interactions

Use `InteractionTestRunner.run()` to dispatch a Discord interaction and get back a typed result:

```typescript
import { ChatInputApplicationCommandInteractionData } from '@wolfstar/http-framework-test-utils';

const result = await runner.run({
	...ChatInputApplicationCommandInteractionData,
	data: { id: '0', name: 'ping', type: 1, options: [] }
});

expect(result.statusCode).toBe(200);
expect(result.json()).toMatchObject({ type: 4, data: { content: 'Pong!' } });
```

### Vitest custom matchers

Import and register the matchers in your Vitest setup file:

```typescript
// vitest.setup.ts
import { expect } from 'vitest';
import { httpFrameworkMatchers } from '@wolfstar/http-framework-test-utils/vitest';

expect.extend(httpFrameworkMatchers);
```

Then in tests:

```typescript
expect(result).toHaveStatus(200);
expect(result).toHaveBody('{"type":4}');
expect(result).toHaveJsonBody({ type: 4, data: { content: 'Pong!' } });
```

### Available fixtures

Pre-built interaction payloads for all interaction types:

| Export                                             | Type                         |
| -------------------------------------------------- | ---------------------------- |
| `ChatInputApplicationCommandInteractionData`       | Chat input command           |
| `MessageApplicationCommandInteractionData`         | Message context menu command |
| `UserApplicationCommandInteractionData`            | User context menu command    |
| `ApplicationCommandAutocompleteInteractionData`    | Autocomplete                 |
| `MessageComponentButtonInteractionData`            | Button                       |
| `MessageComponentStringSelectInteractionData`      | String select menu           |
| `MessageComponentChannelSelectInteractionData`     | Channel select menu          |
| `MessageComponentRoleSelectInteractionData`        | Role select menu             |
| `MessageComponentUserSelectInteractionData`        | User select menu             |
| `MessageComponentMentionableSelectInteractionData` | Mentionable select menu      |
| `ModalSubmitInteractionData`                       | Modal submit                 |

Base data is also exported: `UserData`, `InteractionGuildMemberData`, `MessageData`, `BaseInteractionData`.

### Helper utilities

```typescript
import { buildSubcommand, getAndDelete, makeCommand } from '@wolfstar/http-framework-test-utils';

// Build a SlashCommandSubcommandBuilder
const sub = buildSubcommand('add', 'Adds two numbers');

// Construct a command instance for unit testing
const cmd = makeCommand(MyCommand);

// Retrieve and clean up a command's registry entry
const entry = getAndDelete(MyCommand);
```

## Exports

| Entry point                                  | Contents                                         |
| -------------------------------------------- | ------------------------------------------------ |
| `@wolfstar/http-framework-test-utils`        | All utilities, fixtures, runners, and types      |
| `@wolfstar/http-framework-test-utils/vitest` | Custom Vitest matchers (`httpFrameworkMatchers`) |

## Requirements

- Node.js `>=20`
- `@wolfstar/http-framework` (peer dependency)
- `vitest >=4.0.0` (optional peer dependency — only needed for the `/vitest` entry point)
