import type { ClientEventCommandContext } from '@wolfstar/http-framework';
import { Point } from '@wolfstar/influx-utilities';
import { InfluxListener } from '../lib/structures/InfluxListener.js';
import { Actions, Points, Tags } from '../lib/util/enum.js';

export class SharedListener extends InfluxListener {
	public constructor(context: InfluxListener.LoaderContext, options: InfluxListener.Options) {
		super(context, { ...options, event: 'commandRun' });
	}

	public run({ command, interaction }: ClientEventCommandContext) {
		this.container.influx!.interactionCounters[interaction.type]++;

		const point = new Point(Points.Commands) //
			.tag(Tags.Action, Actions.Addition)
			.intField(command.name, 1);

		this.writePoint(point);
	}
}
