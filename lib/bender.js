global.Olm = require('olm');

const _                = require('lodash');
const EventEmitter     = require('events');
const replify          = require('replify');
const matrix           = require('matrix-js-sdk');
const bunyan           = require('bunyan');
const { BenderPlugin } = require('./bender-plugin');

/**
 * Bender Matrix chatbot core class
 */
class Bender extends EventEmitter {
  static get defaults() {
    return {
      userId: null,
      accessToken: null,
      baseUrl: null,
      deviceId: null,
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

  static generateDeviceId() {
    return Math.floor(Math.random() * 16777215).toString(16);
  }

  /**
   * Construct a new Bender instance
   * @param {Object.<string,*>} options - Configuration object
   * @param {string} options.userId - The bot's Matrix.org user ID
   * @param {string} options.accessToken - The bot's server access token
   * @param {string} options.baseUrl - The chat server's base URL
   * @param {string} options.deviceId - This instance's device ID string
   * @param {boolean} [options.repl=true] - Creates REPL socket which can be used to interact with the bot's runtime during operation
   * @param {string} [options.configFile=null] - Path to a JSON configuration file containing Bender initialization options
   * @param {Object.<string,*>} options.logging - Configuration passed directly to Bunyan logger instance
   * @param {string} [options.logging.name="bender"] - The application name
   * @param {*} [options.logging.stream=process.stdout] - The logging output stream
   * @param {string} [options.logging.level="info"] - The minimum visibility level for logged messages
   */
  constructor(options = {}) {
    super();

    this.plugins = [];
    this.options = _.merge({}, this.constructor.defaults, options);
    this.logger = bunyan.createLogger(this.options.logging);
    this.client = matrix.createClient({
      baseUrl: this.options.baseUrl,
      userId: this.options.userId,
      accessToken: this.options.accessToken,
      deviceId: this.options.deviceId || this.constructor.generateDeviceId(),
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

      return entry;
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

  use(...plugins) {
    for (const pluginInstance of plugins) {
      if (!(pluginInstance instanceof BenderPlugin)) {
        const error = new TypeError('Plugins must inherit from BenderPlugin base class');
        this.emit('pluginError', error, pluginInstance);
        this.logger.error({ error }, 'Plugin registration failed');
        throw error;
      }

      this.plugins.push(pluginInstance);
      this.emit('plugin', pluginInstance);
    }
  }

  joinRoom(roomId) {
    this.client.joinRoom(roomId).then(() => {
      this.emit('joinRoom', roomId);
    });
  }

  sendTextMessage(roomId, body, options = {}) {
    const { mention = false } = options;

    if (mention) {
      body = `${mention.name}: ${body}`;
    }

    return this.client.sendTextMessage(roomId, body);
  }
}

module.exports = Bender;
