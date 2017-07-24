function BenderValidator(bender) {
  return bender.constructor.name === 'Bender';
}

BenderValidator.mixin = (superclass) => class extends superclass {
  static isValidBender(bender) {
    return BenderValidator(bender);
  }
};

module.exports = BenderValidator;
