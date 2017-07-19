const { BenderPlugin, BenderPluginError } = require('../bender-plugin');

class AcceptInvitations extends BenderPlugin {
  static get defaults() {
    return {
      rules: [
        {
          priority: 1,
          name: 'only invitations',
          condition: function(R) {
            R.when(this.data.membership !== 'invite');
          },
          consequence: function(R) {
            this.result = false;
            R.stop();
          },
        },
        {
          priority: 2,
          name: 'only when bot is recipient',
          condition: function(R) {
            R.when(this.data.userId !== this.bender.options.userId);
          },
          consequence: function(R) {
            this.result = false;
            R.stop();
          },
        },
      ]
    }
  }

  static get description() {
    return 'Automatically join room when Bender receives an invitation';
  }

  bindListeners() {
    const { bender } = this;

    bender.client.on('RoomMember.membership', (event, data) => {
      const { roomId } = data;

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
