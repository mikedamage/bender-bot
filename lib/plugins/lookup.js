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
          params: {
            format: 'json',
            pretty: 0,
          },
        },
        wikipedia: {
          aliases: [ 'wiki' ],
          baseUrl: 'https://en.wikipedia.org/search-redirect.php',
          queryParam: 'search',
          method: 'GET',
        },
      },
      defaultEngine: 'duckduckgo',
    };
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
    const {
      baseUrl,
      method,
      queryParam,
      params = {},
    } = this.lookupSearchEngine(nameOrAlias);
    const parsedUrl = url.parse(baseUrl);
    const searchQuery = Object.assign({}, params, { [queryParam]: query });
    const encodedQuery = queryString.stringify(searchQuery);
    parsedUrl.search = encodedQuery;

    // TODO: Execute fetch request and return promise
  }

  bindListeners() {
    this.on('message', (event, room, sender, content, reply) => {

    });
  }
}

module.exports = Lookup;
