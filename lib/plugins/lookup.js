const _                                   = require('lodash');
const url                                 = require('url');
const queryString                         = require('query-string');
const fetch                               = require('node-fetch');
const cheerio                             = require('cheerio');
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
          baseUrl: 'https://duckduckgo.com/html/',
          queryParam: 'q',
          method: 'GET',
          responseType: 'html',
          resultsHandler($html) {
            console.log($html);
          },
        },
        wikipediaSearch: {
          aliases: [ 'wikisearch' ],
          baseUrl: 'https://en.wikipedia.org/w/api.php',
          queryParam: 'srsearch',
          method: 'GET',
          responseType: 'json',
          resultsHandler: [ 'query', 'search' ],
          params: {
            action: 'query',
            list: 'search',
            inprop: 'url',
            format: 'json',
          },
        },
        wikipedia: {
          aliases: [ 'wiki' ],
          baseUrl: 'https://en.wikipedia.org/w/api.php',
          queryParam: 'titles',
          method: 'GET',
          responseType: 'json',
          resultsHandler(results) {
            const pageIDs = Object.keys(results.query.pages);
            if (pageIDs.length < 1) return null;
            return results.query.pages[pageIDs[0]];
          },
          params: {
            action: 'query',
            prop: 'info',
            inprop: 'url',
            format: 'json',
          },
        },
      },
      defaultEngine: 'duckduckgo',
    };
  }

  static buildQueryUrl(query, { baseUrl, method = 'GET', queryParam, params = {} }) {
    const parsedUrl = url.parse(baseUrl);
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

  search(nameOrAlias, query) {
    const engine = this.lookupSearchEngine(nameOrAlias);
    const queryUrl = this.constructor.buildQueryUrl(query, engine);
    const queryOpts = { method: engine.method };

    return fetch(queryUrl, queryOpts)
      .then((response) => {
        if (engine.responseType === 'json') return response.json();
        return response.text();
      })
      .then((body) => {
        if (engine.responseType === 'html') return cheerio.load(body);
        return body;
      })
      .then((body) => {
        if (_.isFunction(engine.resultsHandler)) return engine.resultsHandler(body);
        return _.get(body, engine.resultsHandler);
      });
  }

  bindListeners() {
    this.on('message', (event, room, sender, content, reply) => {

    });
  }
}

module.exports = Lookup;
