global.Olm = require('olm');

const _                = require('lodash');
const EventEmitter     = require('events');
const replify          = require('replify');
const matrix           = require('matrix-js-sdk');
const bunyan           = require('bunyan');
const { BenderPlugin } = require('./bender-plugin');

/**
 * Bender Matrix chatbot core class
 * @extends EventEmitter
 */
class Bender extends EventEmitter {
  /**
   * Default configuration values for new `Bender` instances
   * @type {Object.<string,*>}
   */
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

  /**
   * Generate a random value to use as the Matrix client's device identifier
   * @returns {string} A randomly generated deviceId value
   */
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

  /**
   * An array containing the names of all registered plugins
   * @type {string[]}
   */
  get pluginNames() {
    return this.plugins.map((p) => p.name);
  }

  /**
   * Get a list of all registered plugins
   * @param {boolean} [verbose=false] - Pass `true` to include the options object used to instantiate each plugin
   * @returns {Object[]}
   */
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

  /**
   * Connect to the configured Matrix.org server
   * @emits Bender#connect
   * @returns {undefined} nothing
   */
  connect() {
    this.client.startClient();

    /**
     * Fired when the client connects to the chat server
     * @event Bender#connect
     */
    this.emit('connect');
  }

  /**
   * Disconnect from the server
   * @emits Bender#disconnect
   * @returns {undefined} nothing
   */
  disconnect() {
    this.client.stopClient();

    /**
     * Fired when the client disconnects from the chat server
     * @event Bender#disconnect
     */
    this.emit('disconnect');
  }

  /**
   * Tell Bender to use the specified plugin instance(s)
   * @param {...BenderPlugin} plugin - An instance of a subclass of `BenderPlugin`
   * @emits Bender#plugin
   * @throws {TypeError} Argument must be a descendant of the `BenderPlugin` class
   * @returns {undefined} nothing
   * @example <caption>Instantiate and add an instance of the `NormalizeMessages` plugin</caption>
   * const bender = new Bender({ baseUrl: 'https://foo.com:8448', ... });
   * const normalize = new NormalizeMessages(bender);
   * bender.use(normalize);
   */
  use(...plugin) {
    for (const pluginInstance of plugin) {
      if (!(pluginInstance instanceof BenderPlugin)) {
        const error = new TypeError('Plugins must inherit from BenderPlugin base class');
        this.emit('pluginError', error, pluginInstance);
        this.logger.error({ error }, 'Plugin registration failed');
        throw error;
      }

      this.plugins.push(pluginInstance);

      /**
       * Fired when a new plugin is added to the bot's runtime
       * @event Bender#plugin
       * @param {BenderPlugin} pluginInstance - A reference to the plugin instance that was added
       */
      this.emit('plugin', pluginInstance);
    }
  }

  /**
   * Join the specified room by ID
   * @param {string} roomId - The ID of the room to join
   * @returns {Promise} A Promise that resolves when the room has been joined
   */
  joinRoom(roomId) {
    return this.client.joinRoom(roomId).then(() => {
      this.emit('joinRoom', roomId);
    });
  }

  /**
   * Send a text chat message to the specified room
   * @param {string} roomId - The room's ID
   * @param {string} body - The message body
   * @param {Object.<string,*>} [options={}] - Optional configuration
   * @example <caption>Send a message to a room</caption>
   * bender.sendMessage('abc123', 'Test!').then(console.log);
   * @example <caption>Automatically mention a user in a message</caption>
   * bender.on('message', (event, room, sender, content) => {
   *   bender.sendTextMessage(room.roomId, `You said: ${content}`, { mention: sender });
   * });
   * @returns {Promise} A promise that resolves when the message has been sent
   */
  sendTextMessage(roomId, body, options = {}) {
    const { mention = false } = options;

    if (mention) {
      body = `${mention.name}: ${body}`;
    }

    return this.client.sendTextMessage(roomId, body);
  }
}

module.exports = Bender;
