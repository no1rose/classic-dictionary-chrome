(() => {
  'use strict';
  const core = globalThis.ClassicDictionary;
  let enabled = true;
  let currentURL = '';
  let lookup = null;
  let scanTimer = null;
  let noticeTimer = null;
  let notice = null;
  let movedCard = null;
  let originalPosition = null;
  let state = 'idle';

  function nativeCard() {
    const results = document.querySelector('#rso');
    if (!results) return null;
    for (const heading of results.querySelectorAll('h2, [role="heading"]')) {
      if (!/^(Dictionary|Similar words|Similar and opposite words|Opposite words)$/i.test(heading.textContent.trim())) continue;
      let node = heading;
      while (node.parentElement && node.parentElement !== results) node = node.parentElement;
      if (node.parentElement === results && /Oxford Languages|Definitions from/i.test(node.textContent)) return node;
    }
    return null;
  }

  function cleanup() {
    clearTimeout(noticeTimer);
    notice?.remove(); notice = null;
    document.documentElement?.classList.remove('cd-lookup');
    document.querySelectorAll('[data-cd-ai-hidden]').forEach(el => el.removeAttribute('data-cd-ai-hidden'));
    if (movedCard?.isConnected && originalPosition?.isConnected) originalPosition.replaceWith(movedCard);
    else originalPosition?.remove();
    movedCard = originalPosition = null;
  }

  function hideAI() {
    const selectors = '#Odp5De, #m-x-content, [data-attrid="AIOverview"], [data-attrid="ai_overview"], ai-overview, ai-mode-inline-card';
    document.querySelectorAll(selectors).forEach(el => {
      if (!el.hasAttribute('data-cd-ai-hidden')) el.setAttribute('data-cd-ai-hidden', '');
    });
    // Bound the ancestor walk; never hide a whole results column.
    for (const heading of document.querySelectorAll('h1,h2,h3,[role="heading"]')) {
      if (!/^AI (Overview|Overviews|Mode)$/i.test(heading.textContent.trim())) continue;
      let node = heading.parentElement;
      for (let depth = 0; node && depth < 5; depth++, node = node.parentElement) {
        if (node.matches('#rso,#search,#center_col,#rcnt,main,body')) break;
        if (node.matches('[data-mcpr], [data-mcp], [data-async-type], [jsname="xBNgKe"]')) {
          if (!node.hasAttribute('data-cd-ai-hidden')) node.setAttribute('data-cd-ai-hidden', '');
          break;
        }
      }
    }
    document.querySelectorAll('a[href]').forEach(link => {
      if (link.textContent.trim() !== 'AI Mode' || link.hasAttribute('data-cd-ai-hidden')) return;
      try {
        const url = new URL(link.href);
        if (url.origin === location.origin && url.pathname === '/search' && url.searchParams.get('udm') === '50') {
          link.setAttribute('data-cd-ai-hidden', '');
        }
      } catch { /* Not a URL. */ }
    });
  }

  function scan() {
    if (!enabled || !lookup) return;
    hideAI();
    const card = nativeCard();
    if (!card) return;
    state = 'native';
    notice?.remove(); notice = null;
    clearTimeout(noticeTimer);
    // Preserve the actual node and its event handlers; restore its position on disable.
    if (!movedCard && card.parentElement.firstElementChild !== card) {
      originalPosition = document.createComment('Classic Dictionary original position');
      card.before(originalPosition);
      movedCard = card;
      card.parentElement.prepend(card);
    }
  }

  function showUnavailable() {
    if (!enabled || !lookup || nativeCard() || notice) return;
    const results = document.querySelector('#rso');
    if (!results) return;
    state = 'unavailable';
    notice = document.createElement('div');
    const shadow = notice.attachShadow({mode: 'open'});
    const style = document.createElement('style');
    style.textContent = ':host{display:block;margin:12px 0 24px;font:14px/1.5 Arial,sans-serif;color:CanvasText;color-scheme:light dark}section{border:1px solid #dadce0;border-radius:12px;padding:18px 20px;background:Canvas}strong{font-size:16px}p{margin:8px 0}a{color:LinkText;margin-right:18px}';
    const section = document.createElement('section');
    section.setAttribute('aria-label', 'Classic Dictionary');
    const title = document.createElement('strong'); title.textContent = 'Dictionary unavailable for this search';
    const description = document.createElement('p');
    description.textContent = 'Google hasn’t returned its original dictionary card. Try a definition search or open a dictionary below.';
    const retry = document.createElement('a'); retry.textContent = 'Try definition';
    retry.href = core.definitionURL(lookup.word, location.origin);
    const external = document.createElement('a'); external.textContent = 'Merriam-Webster';
    external.href = `https://www.merriam-webster.com/${lookup.kind === 'definition' ? 'dictionary' : 'thesaurus'}/${encodeURIComponent(lookup.word)}`;
    section.append(title, description, retry, external); shadow.append(style, section);
    results.prepend(notice);
  }

  function refresh() {
    if (currentURL === location.href) { scan(); return; }
    currentURL = location.href;
    cleanup();
    lookup = enabled ? core.lookupForURL(currentURL) : null;
    state = lookup ? 'looking' : 'idle';
    if (!lookup) return;
    document.documentElement?.classList.add('cd-lookup');
    const target = core.restoreURL(currentURL);
    if (target) {
      // One recent redirect per query prevents loops when Google drops the filter.
      let canRedirect = true;
      try {
        const previous = JSON.parse(sessionStorage.getItem('classicDictionaryRedirect') || 'null');
        const key = new URL(currentURL).searchParams.get('q');
        canRedirect = !previous || previous.key !== key || Date.now() - previous.time > 30000;
        if (canRedirect) sessionStorage.setItem('classicDictionaryRedirect', JSON.stringify({key, time: Date.now()}));
      } catch { canRedirect = false; }
      if (canRedirect) { location.replace(target); return; }
    }
    scan();
    noticeTimer = setTimeout(showUnavailable, 7000);
  }

  function schedule() {
    if (scanTimer !== null) return;
    scanTimer = setTimeout(() => { scanTimer = null; refresh(); }, 120);
  }

  function start() {
    if (!document.documentElement) { setTimeout(start, 0); return; }
    refresh();
    new MutationObserver(schedule).observe(document.documentElement, {subtree: true, childList: true});
    window.addEventListener('popstate', schedule);
    window.addEventListener('pageshow', schedule);
    setInterval(() => { if (location.href !== currentURL) schedule(); }, 750);
    const prepareLink = event => {
      if (!enabled) return;
      const link = event.target.closest?.('a[href]');
      if (!link) return;
      const replacement = core.restoreURL(link.href);
      if (replacement) link.href = replacement;
    };
    document.addEventListener('pointerdown', prepareLink, true);
    document.addEventListener('click', prepareLink, true);
    document.addEventListener('keydown', event => { if (event.key === 'Enter') prepareLink(event); }, true);
  }

  chrome.storage.local.get({enabled: true}).then(settings => {
    enabled = settings.enabled !== false;
    start();
  }).catch(() => start());
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.enabled) return;
    enabled = changes.enabled.newValue !== false;
    currentURL = '';
    refresh();
  });
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message?.type === 'dictionary-status') reply({state, word: lookup?.word || null});
  });
})();
