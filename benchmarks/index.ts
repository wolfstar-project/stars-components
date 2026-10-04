import { withCodSpeed } from '@codspeed/tinybench-plugin';
import { Bench } from 'tinybench';
import { register as registerCli } from './cli.js';
import { register as registerDiscordUtilities } from './discord-utilities.js';
import { register as registerHttpFramework, registerAsync as registerHttpFrameworkAsync } from './http-framework.js';
import { register as registerRouter } from './router.js';
import { register as registerSchema } from './schema.js';

// Synchronous benchmarks are run with `runSync` so that their execution profiles are as accurate as possible.
const syncBench = withCodSpeed(new Bench({ name: 'stars-components', time: 100 }));
registerHttpFramework(syncBench);
registerDiscordUtilities(syncBench);
registerCli(syncBench);
registerSchema(syncBench);
registerRouter(syncBench);
syncBench.runSync();
console.table(syncBench.table());

const asyncBench = withCodSpeed(new Bench({ name: 'stars-components', time: 100 }));
await registerHttpFrameworkAsync(asyncBench);
await asyncBench.run();
console.table(asyncBench.table());
