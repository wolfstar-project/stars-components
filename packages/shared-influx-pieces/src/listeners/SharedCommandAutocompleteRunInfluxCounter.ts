import type { ClientEventAutocompleteContext } from '@wolfstar/http-framework';
import { InfluxListener } from '../lib/structures/InfluxListener.js';

export class SharedListener extends InfluxListener {
	public constructor(context: InfluxListener.LoaderContext, options: InfluxListener.Options) {
		super(context, { ...options, event: 'autocompleteRun' });
	}

	public run({ interaction }: ClientEventAutocompleteContext) {
		this.container.influx!.interactionCounters[interaction.type]++;
	}
}
