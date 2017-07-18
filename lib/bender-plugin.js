const _ = require('lodash');
const RuleEngine = require('node-rules');

class BenderPluginError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BenderPluginError';
  }
}

class BenderPlugin {
  static get defaults() {
    return {
      rules: [],
    };
  }

  constructor(bender, options = {}) {
    if (!this._hasValidBender(bender)) {
      throw new BenderPluginError(`Invalid Bender instance passed to plugin "${this.constructor.name}"`)
    }

    this.bender      = bender;
    this.options     = _.merge({}, this.constructor.defaults, options);
    this.logger      = this.bender.logger.child({ plugin: this.name });
    this.rulesEngine = new RulesEngine(this.rules);

    this.bindListeners();
    this.logger.info(`Initialize Bender plugin: ${this.name}`);
  }

  on(evtName, handler) {
    this.bender.on(evtName, handler);
  }

  emit(evtName, ...args) {
    this.bender.emit(evtName, ...args);
  }

  bindListeners() {}

  checkRules(data) {
    return new Promise((resolve) => {
      this.rulesEngine.execute(data, (result) => resolve(result));
    });
  }

  get name() {
    return this.constructor.name;
  }

  get rules() {
    return this.options.rules;
  }

  _hasValidBender(bender) {
    return bender.constructor.name === 'Bender';
  }
}

module.exports = BenderPlugin;
