global.Olm = require('olm');
const replify = require('replify');
const bunyan = require('bunyan');
const sdk = require('matrix-js-sdk');
const { userId, accessToken, baseUrl } = require('./testaccount.json');

const logger = bunyan.createLogger({ name: 'bender-scratch' });
logger.info('Start Matrix client');

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

// Log messages received in joined rooms
client.on('Room.timeline', (evt, room, toStartOfTimeline) => {
  if (toStartOfTimeline || evt.getType() !== 'm.room.message') return;

  const sender = evt.getSender();
  const content = evt.getContent();

  logger.info({ room, sender, content }, `Message received in ${room.name}`);
});

replify('bender', client);

client.startClient();
