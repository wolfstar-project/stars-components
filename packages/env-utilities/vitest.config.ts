import VersionInjector from '@redstardev/unplugin-version-injector/vite';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.shared.js';

export default mergeConfig(
	configShared,
	defineProject({
		plugins: [VersionInjector()]
	})
);
