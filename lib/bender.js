global.Olm = require('olm');

const _                = require('lodash');
const EventEmitter     = require('events');
const replify          = require('replify');
const matrix           = require('matrix-js-sdk');
const bunyan           = require('bunyan');
const { BenderPlugin } = require('./bender-plugin');

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

  static get description() {
    return 'The base class from which all Bender plugins inherit';
  }

  constructor(options = {}) {
    super();

    this.plugins = [];
    this.options = _.merge({}, this.constructor.defaults, options);
    this.logger = bunyan.createLogger(this.options.logging);
    this.client = matrix.createClient({
      baseUrl: this.options.baseUrl,
      userId: this.options.userId,
      accessToken: this.options.accessToken,
    });

    if (this.options.repl) {
      replify('bender', this);
    }

    this.logger.debug({ options: this.options }, 'I am Bender, please insert Liquor.');
  }

  get pluginNames() {
    return this.plugins.map((p) => p.name);
  }

  listPlugins(verbose = false) {
    return this.plugins.map((p) => {
      const entry = {
        name: p.name,
        description: p.constructor.description,
      };

      if (!verbose) return entry;

      entry.options = p.options;
    });
  }

  connect() {
    this.client.startClient();
    this.emit('connect');
  }

  disconnect() {
    this.client.stopClient();
    this.emit('disconnect');
  }

  use(pluginInstance) {
    if (!(pluginInstance instanceof BenderPlugin)) {
      const error = new TypeError('Plugins must inherit from BenderPlugin base class');
      this.emit('pluginError', error, pluginInstance);
      this.logger.error({ error }, 'Plugin registration failed');
      throw error;
    }

    this.plugins.push(pluginInstance);
    this.emit('plugin', pluginInstance);
  }

  joinRoom(roomId) {
    this.client.joinRoom(roomId).then(() => {
      this.emit('joinRoom', roomId);
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
