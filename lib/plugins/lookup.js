const url = require('url');
const queryString = require('query-string');
const fetch = require('node-fetch');
const { BenderPlugin, BenderPluginError } = require('../bender-plugin');

class Lookup extends BenderPlugin {
  static get dependencies() {
    return [ 'NormalizeMessages' ];
  }

  static get defaults() {
    return {
      searchEngines: {
        duckduckgo: {
          aliases: [ 'duck', 'ddg' ],
          baseUrl: 'https://api.duckduckgo.com',
          queryParam: 'q',
          method: 'GET',
          responseType: 'json',
          params: {
            format: 'json',
            pretty: 0,
          },
        },
        wikipedia: {
          aliases: [ 'wiki' ],
          baseUrl: 'https://en.wikipedia.org/search-redirect.php',
          queryParam: 'search',
          responseType: 'html',
          method: 'GET',
        },
      },
      defaultEngine: 'duckduckgo',
    };
  }

  static buildQueryUrl(query, { baseUrl, method, queryParam, params }) {
    const parsedUrl = url.parsed(baseUrl);
    const search = Object.assign({}, params, { [queryParam]: query });
    const queryString = queryString.stringify(search);
    parsedUrl.search = queryString;
    return parsedUrl.format();
  }

  constructor(bender, options = {}) {
    super(bender, options);
    this.searchEngines = this.options.searchEngines;
    this.defaultSearchEngine = this.searchEngines[this.options.defaultEngine];
  }

  lookupSearchEngine(nameOrAlias) {
    if (this.searchEngines[nameOrAlias]) {
      return this.searchEngines[nameOrAlias];
    }

    for (const [ name, engine ] of Object.entries(this.searchEngines)) {
      if (engine.aliases.includes(nameOrAlias)) {
        return { name, engine };
      }
    }

    return this.defaultSearchEngine;
  }

  addSearchEngine(name, engine) {
    this.searchEngines[name] = engine;
    this.emit('searchengine.add', name, engine);
    return this.searchEngines;
  }

  removeSearchEngine(name) {
    delete this.searchEngines[name];
    this.emit('searchengine.remove', name);
    return this.searchEngines;
  }

  search(nameOrAlias, query, options = {}) {
    let requestOptions;
    const engine = this.lookupSearchEngine(nameOrAlias);
    const queryUrl = this.constructor.buildQueryUrl(query, engine);
  }

  bindListeners() {
    this.on('message', (event, room, sender, content, reply) => {

    });
  }
}

module.exports = Lookup;
