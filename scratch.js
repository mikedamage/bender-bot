const Bender = require('./lib/bender');
const AcceptInvitations = require('./lib/plugins/accept-invitations');
const NormalizeMessages = require('./lib/plugins/normalize-messages');
const { userId, accessToken, baseUrl, deviceId } = require('./testaccount.json');

const bender = new Bender({ userId, accessToken, baseUrl, deviceId, repl: true, logging: { level: 'info' } });

const acceptInvitations = new AcceptInvitations(bender);
const normalizeMessages = new NormalizeMessages(bender);

bender.logger.info(acceptInvitations.rules);

bender.use(acceptInvitations);
bender.use(normalizeMessages);

bender.on('connect', () => bender.logger.info('Connected to server'));

bender.connect();
