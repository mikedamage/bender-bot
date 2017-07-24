const _           = require('lodash');
const RulesEngine = require('node-rules');
const BenderValidator = require('./bender-validator');

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
      dependencies: [],
    };
  }

  static isValidBender(bender) {
    return BenderValidator(bender);
  }

  constructor(bender, options = {}) {
    if (!this.constructor.isValidBender(bender)) {
      throw new BenderPluginError(`Invalid Bender instance passed to plugin "${this.constructor.name}"`)
    }

    this.bender      = bender;
    this.options     = _.merge({}, this.constructor.defaults, options);
    this.logger      = this.bender.logger.child({ plugin: this.name });
    this.logger.debug(this.rules);
    this.rulesEngine = new RulesEngine(this.rules);

    if (!this.checkDependencies()) {
      const error = new BenderPluginError(`Plugin dependency validation for ${this.name} failed`);
      this.logger.error({ error });
      throw error;
    }

    this.bindListeners();
    this.logger.info(`Initialize Bender plugin: ${this.name}`);
  }

  on(evtName, handler) {
    this.bender.on(evtName, handler);
  }

  emit(evtName, ...args) {
    this.bender.emit(evtName, ...args);
  }

  bindListeners() {
    throw new BenderPluginError(`${this.name} must define a bindListeners method`);
  }

  checkDependencies() {
    if (!Array.isArray(this.options.dependencies) || this.options.dependencies.length < 1) {
      this.logger.debug({ result: true, plugin: this.name }, 'Plugin has no dependencies. Good to go!')
      return true;
    }

    const plugins = this.bender.pluginNames;
    const result = this.options.dependencies.reduce((valid, dep) => {
      if (!valid) return false;
      return plugins.includes(dep);
    }, true);
    this.logger.info({ name: this.name, result }, `Checked plugin dependencies`);
    return result;
  }

  checkRules(data) {
    this.logger.debug({ rules: this.rules, data }, 'Checking event for ruleset match');
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
}

module.exports = { BenderPlugin, BenderPluginError };
