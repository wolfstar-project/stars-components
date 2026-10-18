// Each test re-imports the module: the variables are cached in module scope and the shared Vitest config disables isolation.
async function loadVariables() {
	vi.resetModules();
	return import('../src/lib/variables.js');
}

describe('EventSub variables', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	test('GIVEN both values from setVariables THEN each getter returns its own value', async () => {
		const { getEventSubCallback, getEventSubSecret, setVariables } = await loadVariables();
		setVariables({ eventSubSecret: 'a-secret-value', eventSubCallback: 'https://example.com/callback' });

		expect(getEventSubSecret()).toBe('a-secret-value');
		expect(getEventSubCallback()).toBe('https://example.com/callback');
	});

	test('GIVEN the secret from setVariables and the callback from the environment THEN neither getter returns the other value', async () => {
		vi.stubEnv('TWITCH_EVENT_SUB_CALLBACK', 'https://example.com/from-env');
		const { getEventSubCallback, getEventSubSecret, setVariables } = await loadVariables();
		setVariables({ eventSubSecret: 'a-secret-value' });

		expect(getEventSubCallback()).toBe('https://example.com/from-env');
		expect(getEventSubSecret()).toBe('a-secret-value');
	});

	test('GIVEN both values from the environment THEN each getter returns its own value', async () => {
		vi.stubEnv('TWITCH_EVENT_SUB_SECRET', 'an-env-secret');
		vi.stubEnv('TWITCH_EVENT_SUB_CALLBACK', 'https://example.com/from-env');
		const { getEventSubCallback, getEventSubSecret } = await loadVariables();

		expect(getEventSubSecret()).toBe('an-env-secret');
		expect(getEventSubCallback()).toBe('https://example.com/from-env');
	});
});
