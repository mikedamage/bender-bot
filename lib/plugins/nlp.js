const nlp = require('compromise');
const { BenderPlugin, BenderPluginError } = require('../bender-plugin');

/**
 * Plugin that listens for "message" events, runs their contents through
 * Compromise, and re-emits them as "message.nlp" events
 *
 * @example <caption>Initialize NLP plugin, add it to a Bender instance, and respond to events</caption>
 * const NLP = require('bender-bot/lib/plugins/nlp');
 * bender.use(new NLP());
 * bender.on('message.nlp', (event, data, sender, content, reply) => {
 *   // Respond back with the original message's nouns pluralized:
 *   const response = content.nouns().pluralize().all().out('text');
 *   reply(response, { mention: sender });
 * });
 */
class NLP extends BenderPlugin {
  static get defaults() {
    return {
      dependencies: [ 'NormalizeMessages' ],
    };
  }

  static get description() {
    return 'Allows the parsing and modification of incoming messages via Compromise API';
  }

  bindListeners() {
    this.bender.on('message', (event, data, sender, content, reply) => {
      const args = [
        event,
        data,
        sender,
        nlp(content),
        reply,
      ];
      this.emit('message.nlp', ...args);
    });
  }
}

module.exports = NLP;
