global.Olm = require('olm');

const _ = require('lodash');
const EventEmitter = require('events');
const replify = require('replify');
const matrix = require('matrix-js-sdk');
const bunyan = require('bunyan');

class Bender extends EventEmitter {
  static get defaults() {
    return {
      userId: null,
      accessToken: null,
      baseUrl: null,
      repl: true,
      configFile: null,
      logging: {
        name: 'bender',
        stream: process.stdout,
        level: 'info',
      },
    };
  }

  constructor(options = {}) {
    super();

    this.options = _.merge({}, Bender.defaults, options);
    this.logger = bunyan.createLogger(this.options.logging);
    this.client = matrix.createClient({
      baseUrl: this.options.baseUrl,
      userId: this.options.userId,
      accessToken: this.options.accessToken,
    });

    if (this.options.repl) {
      replify('bender', this);
    }

    this._acceptInvitations();
    this._receiveMessages();

    this.logger.debug({ options: this.options }, 'I am Bender, please insert Liquor.');
  }

  connect() {
    this.client.startClient();
    this.emit('connect');
  }

  disconnect() {
    this.client.stopClient();
    this.emit('disconnect');
  }

  _acceptInvitations() {
    this.client.on('RoomMember.membership', (evt, member) => {
      if (!(member.membership === 'invite' && member.userId === this.options.userId)) return;
      this.logger.info({ evt, roomId: member.roomId }, 'Received room invitation');
      this.client.joinRoom(member.roomId).then(() => {
        this.logger.info({ roomId: member.roomId }, 'Joined room');
        this.emit('joinRoom', evt, member);
      });
    });
  }

  _receiveMessages() {
    this.client.on('Room.timeline', (evt, room, toStart) => {
      if (toStart || evt.getType() !== 'm.room.message') return;

      const sender = evt.getSender();
      const content = evt.getContent();

      this.logger.info({ room, sender, content: content.body }, 'Message received');
      this.emit('receiveMessage', evt, room, sender, content);
    });
  }
}

module.exports = Bender;
