'use strict';
const toggle = document.querySelector('#enabled');
const status = document.querySelector('#status');
const messages = {
  native: 'Google’s original dictionary card is on this page.',
  looking: 'Looking for Google’s original dictionary card…',
  unavailable: 'Google didn’t return its dictionary for this lookup.',
  idle: 'Ready for definition, synonym, and antonym searches.'
};
async function updateStatus() {
  if (!toggle.checked) { status.textContent = 'Paused. Turn on to restore word lookups.'; return; }
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const response = await chrome.tabs.sendMessage(tab.id, {type: 'dictionary-status'});
    status.textContent = messages[response.state] || messages.idle;
  } catch { status.textContent = messages.idle; }
}
chrome.storage.local.get({enabled: true}).then(settings => {
  toggle.checked = settings.enabled !== false;
  void updateStatus();
});
toggle.addEventListener('change', async () => {
  await chrome.storage.local.set({enabled: toggle.checked});
  await updateStatus();
  if (!toggle.checked) status.textContent += ' Refresh the Google page to remove the search filter.';
});
document.querySelector('#lookup').addEventListener('submit', async event => {
  event.preventDefault();
  const word = document.querySelector('#word').value.trim();
  if (!word) return;
  await chrome.tabs.create({url: ClassicDictionary.definitionURL(word)});
  window.close();
});
