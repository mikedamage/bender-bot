const BenderPlugin = require('../bender-plugin');

const rules = [
  {
    condition: function(R, { bender, event, data }) {
      R.when(event.getType() !== 'm.room.message');
    },
    consequence: function(R, { bender, event, data }) {
      data.result = false;
      R.stop();
    },
  },
  {
    condition: function(R, { bender, event, data }) {
      R.when(data.toStartOfTimeline);
    },
    consequence: function(R, { bender, event, data }) {
      data.result = false;
      R.stop();
    },
  },
];

class NormalizeMessages extends BenderPlugin {
  static get defaults() {
    return { rules };
  }

  static get description() {
    return 'Emits a "message" event to all subscribed listeners when a chat message is received';
  }

  bindListeners() {
    const { bender } = this;

    bender.client.on('Room.timeline', (event, data, toStartOfTimeline) => {
      data.toStartOfTimeline = toStartOfTimeline;

      const sender = event.getSender();
      const content = event.getContent();

      this.checkRules({ bender, event, data }).then((result) => {
        if (!result) return;
        this.logger.info({ sender, body: content.body }, 'Received message');
        this.emit('message', event, data, sender, content);
      });
    });
  }
}

module.exports = NormalizeMessages;
