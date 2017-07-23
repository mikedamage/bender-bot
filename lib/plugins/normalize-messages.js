const { BenderPlugin, BenderPluginError } = require('../bender-plugin');

class NormalizeMessages extends BenderPlugin {
  static get defaults() {
    return {
      rules: [
        {
          name: 'only messages',
          priority: 1,
          condition(R) {
            R.when(this.event.getType() !== 'm.room.message');
          },
          consequence(R) {
            this.result = false;
            R.stop();
          },
        },
        {
          name: 'ignore archive dumps',
          priority: 2,
          condition(R) {
            R.when(this.room.toStartOfTimeline);
          },
          consequence(R) {
            this.result = false;
            R.stop();
          },
        },
      ],
    };
  }

  static get description() {
    return 'Emits a "message" event to all subscribed listeners when a chat message is received';
  }

  bindListeners() {
    const { bender } = this;

    bender.client.on('Room.timeline', (event, room, toStartOfTimeline) => {
      room.toStartOfTimeline = toStartOfTimeline;

      const sender = room.sender = event.getSender();
      const content = room.content = event.getContent();
      const reply = bender.sendTextMessage.bind(bender, room.roomId);

      this.checkRules({ bender, event, room }).then(({ result }) => {
        if (!result) return;
        this.logger.info({ sender, body: content.body }, 'Received message');
        this.emit('message', event, room, sender, content, reply);
      });
    });
  }
}

module.exports = NormalizeMessages;
