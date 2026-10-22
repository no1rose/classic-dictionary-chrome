const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '../extension');
require(path.join(base, 'core.js'));
const core = globalThis.ClassicDictionary;

test('recognizes ordinary definition, synonym and antonym phrasing', () => {
  const cases = [
    ['define serendipity','serendipity','definition'], ['define:happy','happy','definition'],
    ['happy definition','happy','definition'], ['definition of happy','happy','definition'],
    ['meaning of déjà vu','déjà vu','definition'], ['what does “ephemeral” mean?','ephemeral','definition'],
    ['what is the definition of happy?','happy','definition'], ["what’s the meaning of bliss?",'bliss','definition'],
    ['synonyms for happy','happy','synonym'], ['happy synonyms','happy','synonym'],
    ['synonym of happy','happy','synonym'], ['another word for happy','happy','synonym'],
    ['antonym for happy','happy','antonym'], ['happy antonyms','happy','antonym'],
    ['opposite of happy','happy','antonym'], ['opposite words for happy','happy','antonym'],
    ['define the word happy','happy','definition'], ['serendipity pronunciation','serendipity','definition'],
    ['good luck in a sentence','good luck','definition']
  ];
  for (const [query, word, kind] of cases) assert.deepEqual(core.parseQuery(query), {word,kind}, query);
});
test('leaves unrelated or malformed searches alone', () => {
  for (const query of ['weather tomorrow','how to bake bread','serendipity','define','definition',
    'google ai news','high definition television', 'define site:example.com','define <script>',
    'define a b c d e f g', '',null]) assert.equal(core.parseQuery(query),null,String(query));
});
test('restores once, preserves original query, and keeps filters and fragment', () => {
  const original = 'https://www.google.com/search?q=happy+synonyms&hl=en&safe=active#test';
  const restored = core.restoreURL(original);
  assert.equal(new URL(restored).searchParams.get('q'), 'happy synonyms');
  assert.equal(new URL(restored).searchParams.get('tbs'), '1');
  assert.equal(new URL(restored).searchParams.get('hl'), 'en');
  assert.equal(new URL(restored).hash, '#test');
  assert.equal(core.restoreURL(restored), null);
  assert.equal(core.restoreURL('https://www.google.com/search?q=define+test&tbs=qdr:d'),null);
});
test('exits AI mode only for word lookups; respects explicit search verticals', () => {
  const value = core.restoreURL('https://www.google.com/search?q=define+test&udm=50&aep=11');
  assert.equal(new URL(value).searchParams.has('udm'),false);
  assert.equal(new URL(value).searchParams.has('aep'),false);
  for (const extra of ['udm=2','udm=14','udm=28','udm=vids','tbm=nws','tbm=isch']) {
    assert.equal(core.restoreURL('https://www.google.com/search?q=define+test&'+extra),null);
  }
  assert.equal(core.restoreURL('https://www.google.com/search?q=plan+a+trip&udm=50'),null);
});
test('runs only on supported Google search hosts and paths', () => {
  for (const value of ['https://evilgoogle.com/search?q=define+test','https://www.google.com.evil.test/search?q=define+test',
    'https://docs.google.com/search?q=define+test','http://www.google.com/search?q=define+test',
    'https://www.google.com/maps?q=define+test','not a url']) assert.equal(core.restoreURL(value),null);
  assert.ok(core.restoreURL('https://www.google.co.uk/search?q=define+test'));
});
test('definition links encode user input as a query, never executable markup', () => {
  const url = new URL(core.definitionURL('a&b <c>'));
  assert.equal(url.hostname,'www.google.com');
  assert.equal(url.searchParams.get('q'),'define a&b <c>');
  assert.equal(url.searchParams.get('tbs'),'1');
});
test('manifest is MV3 with only storage permission and bundled assets', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(base,'manifest.json')));
  assert.equal(manifest.manifest_version,3);
  assert.deepEqual(manifest.permissions,['storage']);
  for (const script of manifest.content_scripts) {
    assert.equal(script.run_at,'document_start');
    for (const asset of [...script.js,...script.css]) assert.ok(fs.existsSync(path.join(base,asset)));
    for (const match of script.matches) assert.ok(core.lookupForURL(match.replace('*','search?q=define+test')));
  }
  assert.ok(fs.existsSync(path.join(base,manifest.action.default_popup)));
});
