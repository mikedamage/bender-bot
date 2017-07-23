const nlp = require('compromise');
const { BenderPlugin, BenderPluginError } = require('../bender-plugin');

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
    this.bender.on('message', (event, data, sender, content) => {
      const args = [
        event,
        data,
        sender,
        nlp(content),
      ];
      this.emit('message.nlp', ...args);
    });
  }
}

module.exports = NLP;
