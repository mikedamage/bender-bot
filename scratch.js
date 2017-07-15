const bunyan = require('bunyan');
const sdk = require('matrix-js-sdk');
const { userId, accessToken, baseUrl } = require('./testaccount.json');

const logger = bunyan.createLogger({ app: 'bender-scratch' });

const client = sdk.createClient({
  baseUrl,
  userId,
  accessToken,
});

logger.debug({ client }, 'Create Matrix JS SDK client instance');

// Auto-join rooms when invited
client.on('RoomMember.membership', (evt, member) => {
  if (!(member.membership === 'invite' && member.userId === userId)) return;
  logger.info({ member, evt }, 'Received room invitation');
  client.joinRoom(member.roomId).then(() => logger.info({ roomId: member.roomId }, 'Joined room'));
});
