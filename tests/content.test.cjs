const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const base = path.resolve(__dirname,'../extension');
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
const card = '<article id="dictionary"><h2>Dictionary</h2><p>Definitions from Oxford Languages</p><button id="listen">Listen</button><button id="expand">Show more</button></article>';
const result = '<article id="ordinary"><h3>An ordinary search result about AI Overview</h3><p>Oxford Languages is mentioned in this ordinary result.</p></article>';

async function setup(t, body, {url='https://www.google.com/search?q=define+happy&tbs=1',enabled=true}={}) {
  const dom = new JSDOM(`<!doctype html><html><head><style>${fs.readFileSync(path.join(base,'content.css'),'utf8')}</style></head><body>${body}</body></html>`, {url,runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const w = dom.window;
  let changed, statusListener;
  w.chrome = {
    storage:{local:{get:async()=>({enabled})},onChanged:{addListener:fn=>{changed=fn;}}},
    runtime:{onMessage:{addListener:fn=>{statusListener=fn;}}}
  };
  const originalTimeout = w.setTimeout.bind(w);
  w.setTimeout = (fn,delay,...args)=>originalTimeout(fn,delay===7000?40:delay,...args);
  w.eval(fs.readFileSync(path.join(base,'core.js'),'utf8'));
  w.eval(fs.readFileSync(path.join(base,'content.js'),'utf8'));
  await pause(10);
  return {dom,w,doc:w.document,change:value=>changed({enabled:{newValue:value}},'local'),status:()=>{
    let response;statusListener({type:'dictionary-status'}, {},value=>response=value);return response;
  }};
}
test('promotes the original dictionary node, preserving its native event handlers', async t=>{
  const {doc,status,change}=await setup(t,`<main><div id="rso">${result}${card}</div></main>`);
  const original=doc.querySelector('#dictionary');
  let clicked=0;doc.querySelector('#expand').addEventListener('click',()=>clicked++);
  assert.equal(doc.querySelector('#rso').firstElementChild,original);
  doc.querySelector('#expand').click();assert.equal(clicked,1);
  assert.equal(status().state,'native');
  change(false);await pause(10);
  assert.equal(doc.querySelector('#rso').firstElementChild.id,'ordinary');
  assert.equal(doc.querySelector('#dictionary'),original);
  doc.querySelector('#expand').click();assert.equal(clicked,2);
});
test('hides AI modules and AI navigation, while retaining ordinary results', async t=>{
  const {doc,w,change}=await setup(t,`<a id="ai-tab" href="/search?q=define+happy&udm=50">AI Mode</a><main><div id="rso"><div id="Odp5De"><h2>AI Overview</h2><p>Generated answer</p></div>${result}${card}</div></main>`);
  assert.equal(w.getComputedStyle(doc.querySelector('#Odp5De')).display,'none');
  assert.equal(w.getComputedStyle(doc.querySelector('#ai-tab')).display,'none');
  assert.notEqual(w.getComputedStyle(doc.querySelector('#ordinary')).display,'none');
  assert.notEqual(w.getComputedStyle(doc.querySelector('main')).display,'none');
  const late=doc.createElement('ai-mode-inline-card');doc.querySelector('#rso').append(late);
  await pause(160);assert.equal(w.getComputedStyle(late).display,'none');
  change(false);await pause(10);
  assert.notEqual(w.getComputedStyle(doc.querySelector('#Odp5De')).display,'none');
  assert.notEqual(w.getComputedStyle(doc.querySelector('#ai-tab')).display,'none');
});
test('recognizes the actual synonym and antonym headings', async t=>{
  for (const heading of ['Similar words','Similar and opposite words']) {
    const html=`<div id="rso">${result}<article id="dictionary"><div role="heading" aria-level="2">${heading}</div><a>Oxford Languages</a><button>Opposite</button></article></div>`;
    const {doc,status}=await setup(t,html,{url:'https://www.google.com/search?q=happy+antonyms&tbs=1'});
    assert.equal(status().state,'native');assert.equal(doc.querySelector('#rso').firstElementChild.id,'dictionary');
  }
});
test('shows an honest unavailable state, then removes it when a native card arrives late', async t=>{
  const {doc,status}=await setup(t,`<div id="rso">${result}</div>`);
  await pause(65);assert.equal(status().state,'unavailable');
  const notice=doc.querySelector('#rso').firstElementChild;
  assert.match(notice.shadowRoot.textContent,/Dictionary unavailable/);
  assert.equal(notice.shadowRoot.querySelectorAll('a').length,2);
  doc.querySelector('#rso').insertAdjacentHTML('beforeend',card);
  await pause(170);
  assert.equal(status().state,'native');assert.equal(notice.isConnected,false);
  assert.equal(doc.querySelector('#rso').firstElementChild.id,'dictionary');
});
test('unrelated searches and disabled settings do not change Google content', async t=>{
  for (const opts of [{url:'https://www.google.com/search?q=weather'}, {enabled:false}]) {
    const {doc,w,status}=await setup(t,`<div id="rso"><div id="Odp5De">AI Overview</div>${result}${card}</div>`,opts);
    assert.equal(status().state,'idle');
    assert.equal(doc.documentElement.classList.contains('cd-lookup'),false);
    assert.notEqual(w.getComputedStyle(doc.querySelector('#Odp5De')).display,'none');
    assert.equal(doc.querySelector('#rso').firstElementChild.id,'Odp5De');
  }
});
test('same-document navigation to an unrelated search removes the scoped changes', async t=>{
  const {dom,doc,w,status}=await setup(t,`<div id="rso"><div id="Odp5De">AI Overview</div>${result}${card}</div>`);
  dom.reconfigure({url:'https://www.google.com/search?q=weather'});
  w.dispatchEvent(new w.PopStateEvent('popstate'));
  await pause(160);
  assert.equal(status().state,'idle');assert.equal(doc.documentElement.classList.contains('cd-lookup'),false);
  assert.equal(doc.querySelector('#rso').lastElementChild.id,'dictionary');
});
test('dictionary links keep the restoration filter and unrelated links remain unchanged', async t=>{
  const {doc,w}=await setup(t,'<div id="rso"><a id="word" href="/search?q=synonyms+of+happy">Similar words</a><a id="other" href="/search?q=weather">Weather</a></div>');
  for (const id of ['word','other']) doc.getElementById(id).dispatchEvent(new w.Event('pointerdown',{bubbles:true}));
  assert.equal(new URL(doc.querySelector('#word').href).searchParams.get('tbs'),'1');
  assert.equal(new URL(doc.querySelector('#other').href).searchParams.has('tbs'),false);
});
