import { EventGatewayListener, RegisterAsGatewayListener, type User } from '@wolfstar/plugin-gateway';

@RegisterAsGatewayListener('shardReady')
export class ShardReadyListener extends EventGatewayListener<'shardReady'> {
	public override run(shardId: number, user: User) {
		this.container.logger.info(`Shard ${shardId} connected as ${user.username}`);
	}
}
