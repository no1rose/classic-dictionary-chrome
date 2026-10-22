/* Pure query/URL logic, shared by the content script and popup. */
(() => {
  'use strict';
  const hosts = new Set([
    'www.google.com', 'google.com', 'www.google.co.uk', 'www.google.ca',
    'www.google.com.au', 'www.google.co.nz', 'www.google.co.in', 'www.google.ie',
    'www.google.co.za', 'www.google.com.sg', 'www.google.de', 'www.google.fr'
  ]);
  const patterns = [
    [/^define\s*:?\s+(.+)$/i, 'definition'],
    [/^define:(.+)$/i, 'definition'],
    [/^(?:definitions?|meanings?|dictionary)\s+(?:(?:of|for)\s+)?(.+)$/i, 'definition'],
    [/^(.+?)\s+(?:definitions?|meanings?|dictionary)$/i, 'definition'],
    [/^(?:synonyms?|similar words)\s+(?:(?:of|for|to)\s+)?(.+)$/i, 'synonym'],
    [/^(.+?)\s+synonyms?$/i, 'synonym'],
    [/^(?:antonyms?|opposite words|opposites?)\s+(?:(?:of|for|to)\s+)?(.+)$/i, 'antonym'],
    [/^(.+?)\s+(?:antonyms?|opposite)$/i, 'antonym'],
    [/^what\s+does\s+(.+?)\s+mean$/i, 'definition'],
    [/^what(?:'s| is)\s+(?:the\s+)?(?:definition|meaning)\s+of\s+(.+)$/i, 'definition'],
    [/^(?:another word|other words)\s+for\s+(.+)$/i, 'synonym'],
    [/^(.+?)\s+(?:pronunciation|in a sentence)$/i, 'definition'],
    [/^pronunciation\s+(?:of\s+)?(.+)$/i, 'definition']
  ];
  function parseQuery(query) {
    if (typeof query !== 'string') return null;
    const q = query.trim().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').replace(/[?.!]+$/, '');
    for (const [pattern, kind] of patterns) {
      const match = q.match(pattern);
      if (!match) continue;
      const word = match[1].replace(/^(?:the word|the phrase)\s+/i, '')
        .replace(/^["“”']+|["“”']+$/g, '').trim();
      if (!word || word.length > 80 || word.split(' ').length > 6 ||
          !/^[\p{L}\p{M}][\p{L}\p{M}\d '’-]*$/u.test(word)) return null;
      return {word, kind};
    }
    return null;
  }
  function lookupForURL(value) {
    let url;
    try { url = new URL(value); } catch { return null; }
    if (url.protocol !== 'https:' || !hosts.has(url.hostname) || url.pathname !== '/search') return null;
    const mode = url.searchParams.get('udm');
    if ((mode && mode !== '50') || url.searchParams.get('tbm')) return null;
    return parseQuery(url.searchParams.get('q'));
  }
  function restoreURL(value) {
    if (!lookupForURL(value)) return null;
    const url = new URL(value);
    const before = url.href;
    // Undocumented Google behavior: conventional results retaining dictionary cards.
    if (!url.searchParams.get('tbs')) url.searchParams.set('tbs', '1');
    if (url.searchParams.get('udm') === '50') url.searchParams.delete('udm');
    if (url.searchParams.has('aep')) url.searchParams.delete('aep');
    return url.href === before ? null : url.href;
  }
  function definitionURL(word, origin = 'https://www.google.com') {
    const url = new URL('/search', origin);
    url.searchParams.set('q', `define ${word}`);
    url.searchParams.set('tbs', '1');
    return url.href;
  }
  globalThis.ClassicDictionary = Object.freeze({parseQuery, lookupForURL, restoreURL, definitionURL});
})();
