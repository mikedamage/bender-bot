const { BenderPlugin, BenderPluginError } = require('../bender-plugin');

class NormalizeMessages extends BenderPlugin {
  static get defaults() {
    return {
      rules: [
        {
          name: 'only messages',
          priority: 1,
          condition: function(R) {
            R.when(this.event.getType() !== 'm.room.message');
          },
          consequence: function(R) {
            this.result = false;
            R.stop();
          },
        },
        {
          name: 'ignore archive dumps',
          priority: 2,
          condition: function(R) {
            R.when(this.data.toStartOfTimeline);
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
    return 'Emits a "message" event to all subscribed listeners when a chat message is received';
  }

  bindListeners() {
    const { bender } = this;

    bender.client.on('Room.timeline', (event, data, toStartOfTimeline) => {
      data.toStartOfTimeline = toStartOfTimeline;

      const sender = data.sender = event.getSender();
      const content = data.content = event.getContent();

      this.checkRules({ bender, event, data }).then(({ result }) => {
        if (!result) return;
        this.logger.info({ sender, body: content.body }, 'Received message');
        this.emit('message', event, data, sender, content);
      });
    });
  }
}

module.exports = NormalizeMessages;
