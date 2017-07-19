const { BenderPlugin, BenderPluginError } = require('../bender-plugin');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

class Avatar extends BenderPlugin {
  static get defaults() {
    return {
      avatarFile: null,
      name: null,
      force: false,
    };
  }

  constructor(bender, options = {}) {
    super(bender, options);

    this.bender.on('connect', () => {
      if (this._hasAvatar()) return;
      this._setAvatar();
    });
  }

  _hasAvatar() {
    const user = this.bender.client.getUser(this.bender.options.userId);
    return user && user.avatarUrl !== null;
  }

  _setAvatar() {
    if (!this.options.avatarFile || !fs.existsSync(this.options.avatarFile)) {
      throw new BenderPluginError('Invalid or nonexistent avatarFile option');
    }

    this.logger.info({ options: this.options }, 'Setting user avatar');

    const mimeType = mime.lookup(this.options.avatarFile);
    const avatarFile = fs.readFileSync(this.options.avatarFile);

    return this.bender.client.uploadContent(avatarFile, {
      onlyContentUri: true,
      rawResponse: false,
      type: mimeType,
    }).then((uri) => {
      this.logger.info({ uri }, 'Uploaded avatar image');
      return this.bender.client.setAvatarUrl(uri);
    });
  }
}

module.exports = Avatar;
