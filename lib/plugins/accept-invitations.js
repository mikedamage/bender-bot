const { BenderPlugin, BenderPluginError } = require('../bender-plugin');

const rules = [
  {
    priority: 1,
    name: 'only invitations',
    condition: function(R, { bender, event, data }) {
      R.when(data.membership !== 'invite');
    },
    consequence: function(R, { bender, event, data }) {
      data.result = false;
      R.stop();
    },
  },
  {
    priority: 2,
    name: 'only when bot is recipient',
    condition: function(R, { bender, event, data }) {
      R.when(data.userId !== bender.options.userId);
    },
    consequence: function(R, { bender, event, data }) {
      data.result = false;
    },
  },
];

class AcceptInvitations extends BenderPlugin {
  static get defaults() {
    return { rules };
  }

  static get description() {
    return 'Automatically join room when Bender receives an invitation';
  }

  bindListeners() {
    const { bender } = this;

    bender.client.on('RoomMember.membership', (event, data) => {
      const { roomId } = data;

      debugger;

      this.checkRules({ bender, event, data }).then(({ result }) => {
        this.logger.debug({ result }, 'Rules match?');
        if (!result) return;
        this.logger.info({ data }, 'Received room invitation. Automatically joining.');
        bender.joinRoom(roomId);
      }).catch((...args) => this.logger.error({ args }));
    });
  }
}

module.exports = AcceptInvitations;
