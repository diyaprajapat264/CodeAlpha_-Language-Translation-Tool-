/**
 * Lumina Translate - Core Application Logic
 * Implements Google Free Client API, Google Cloud V2 API, and LibreTranslate integration,
 * along with voice typing, text-to-speech, local storage history, and custom UI components.
 */

// 1. Language Database (50+ popular languages)
const LANGUAGES = {
  "en": "English",
  "es": "Spanish",
  "fr": "French",
  "de": "German",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  "ja": "Japanese",
  "ko": "Korean",
  "ru": "Russian",
  "pt": "Portuguese",
  "it": "Italian",
  "ar": "Arabic",
  "hi": "Hindi",
  "bn": "Bengali",
  "pa": "Punjabi",
  "mr": "Marathi",
  "gu": "Gujarati",
  "ta": "Tamil",
  "te": "Telugu",
  "kn": "Kannada",
  "ml": "Malayalam",
  "ur": "Urdu",
  "tr": "Turkish",
  "vi": "Vietnamese",
  "th": "Thai",
  "id": "Indonesian",
  "ms": "Malay",
  "nl": "Dutch",
  "pl": "Polish",
  "sv": "Swedish",
  "no": "Norwegian",
  "da": "Danish",
  "fi": "Finnish",
  "he": "Hebrew",
  "fa": "Persian",
  "el": "Greek",
  "ro": "Romanian",
  "cs": "Czech",
  "hu": "Hungarian",
  "uk": "Ukrainian",
  "bg": "Bulgarian",
  "hr": "Croatian",
  "sr": "Serbian",
  "sk": "Slovak",
  "sl": "Slovenian",
  "et": "Estonian",
  "lv": "Latvian",
  "lt": "Lithuanian",
  "sw": "Swahili",
  "tl": "Tagalog (Filipino)",
  "ga": "Irish",
  "cy": "Welsh",
  "is": "Icelandic",
  "la": "Latin"
};

// 2. DOM Elements Cache
const sourceLangSelect = document.getElementById('sourceLangSelect');
const targetLangSelect = document.getElementById('targetLangSelect');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const charCount = document.getElementById('charCount');
const clearBtn = document.getElementById('clearBtn');
const speechInputBtn = document.getElementById('speechInputBtn');
const swapBtn = document.getElementById('swapBtn');
const translateBtn = document.getElementById('translateBtn');
const copyBtn = document.getElementById('copyBtn');
const speakBtn = document.getElementById('speakBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const statusMessage = document.getElementById('statusMessage');
const errorBanner = document.getElementById('errorBanner');
const errorMessage = document.getElementById('errorMessage');
const closeErrorBtn = document.getElementById('closeErrorBtn');
const toastContainer = document.getElementById('toastContainer');

// History Elements
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Settings Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const apiEngineSelect = document.getElementById('apiEngineSelect');
const googleConfigGroup = document.getElementById('googleConfigGroup');
const libreConfigGroup = document.getElementById('libreConfigGroup');
const googleApiKeyInput = document.getElementById('googleApiKey');
const libreUrlInput = document.getElementById('libreUrl');
const libreApiKeyInput = document.getElementById('libreApiKey');

// 3. Application State & Settings
let appSettings = {
  engine: 'google-free',
  googleApiKey: '',
  libreUrl: 'https://libretranslate.de',
  libreApiKey: ''
};

let translationHistory = [];
let speechRecognition = null;
let isListening = false;

// 4. Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  populateLanguageDropdowns();
  loadHistory();
  setupSpeechRecognition();
  setupEventListeners();
  updateCharCounter();
  checkButtonState();
});

// Load Settings from LocalStorage
function loadSettings() {
  const savedSettings = localStorage.getItem('lumina_translate_settings');
  if (savedSettings) {
    try {
      appSettings = { ...appSettings, ...JSON.parse(savedSettings) };
    } catch (e) {
      console.error('Error parsing settings, using defaults.', e);
    }
  }
  
  // Apply settings to Modal UI
  apiEngineSelect.value = appSettings.engine;
  googleApiKeyInput.value = appSettings.googleApiKey;
  libreUrlInput.value = appSettings.libreUrl || 'https://libretranslate.de';
  libreApiKeyInput.value = appSettings.libreApiKey;
  
  toggleEngineInputs(appSettings.engine);
}

// Save Settings to LocalStorage
function saveSettings() {
  appSettings.engine = apiEngineSelect.value;
  appSettings.googleApiKey = googleApiKeyInput.value.trim();
  appSettings.libreUrl = libreUrlInput.value.trim();
  appSettings.libreApiKey = libreApiKeyInput.value.trim();
  
  localStorage.setItem('lumina_translate_settings', JSON.stringify(appSettings));
  showToast('Settings saved successfully!');
  closeModal();
}

// Reset Settings to Defaults
function resetSettings() {
  appSettings = {
    engine: 'google-free',
    googleApiKey: '',
    libreUrl: 'https://libretranslate.de',
    libreApiKey: ''
  };
  
  apiEngineSelect.value = appSettings.engine;
  googleApiKeyInput.value = '';
  libreUrlInput.value = 'https://libretranslate.de';
  libreApiKeyInput.value = '';
  
  toggleEngineInputs(appSettings.engine);
  localStorage.setItem('lumina_translate_settings', JSON.stringify(appSettings));
  showToast('Settings reset to defaults');
}

// Populate Dropdown Select Fields
function populateLanguageDropdowns() {
  // Source Dropdown includes 'Auto Detect'
  let sourceOptions = '<option value="auto">Auto Detect Language</option>';
  let targetOptions = '';
  
  Object.entries(LANGUAGES).forEach(([code, name]) => {
    sourceOptions += `<option value="${code}">${name}</option>`;
    targetOptions += `<option value="${code}">${name}</option>`;
  });
  
  sourceLangSelect.innerHTML = sourceOptions;
  targetLangSelect.innerHTML = targetOptions;
  
  // Set default values (Source: English, Target: Spanish)
  sourceLangSelect.value = 'en';
  targetLangSelect.value = 'es';
}

// Setup Event Listeners
function setupEventListeners() {
  // Text area interaction
  inputText.addEventListener('input', () => {
    updateCharCounter();
    checkButtonState();
    clearError();
  });
  
  // Clear button
  clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputText.value = '';
    updateCharCounter();
    checkButtonState();
    clearError();
    statusMessage.textContent = 'Cleared';
    showToast('Input text cleared');
  });
  
  // Swap languages button
  swapBtn.addEventListener('click', () => {
    const srcVal = sourceLangSelect.value;
    const tgtVal = targetLangSelect.value;
    
    // Rotate animation trigger
    const swapIcon = swapBtn.querySelector('i');
    swapIcon.style.transform = 'rotate(180deg)';
    setTimeout(() => {
      swapIcon.style.transform = '';
    }, 300);

    if (srcVal === 'auto') {
      // Cannot set target to auto, so we swap target language to source, and set target to english/spanish depending
      sourceLangSelect.value = tgtVal;
      targetLangSelect.value = tgtVal === 'en' ? 'es' : 'en';
    } else {
      sourceLangSelect.value = tgtVal;
      targetLangSelect.value = srcVal;
    }
    
    // Swap text values
    const inText = inputText.value;
    const outText = outputText.value;
    
    inputText.value = outText;
    outputText.value = inText;
    
    updateCharCounter();
    checkButtonState();
    clearError();
    
    if (inputText.value.trim() !== '') {
      performTranslation();
    }
  });
  
  // Translate trigger
  translateBtn.addEventListener('click', performTranslation);
  
  // Copy to clipboard
  copyBtn.addEventListener('click', () => {
    if (outputText.value) {
      navigator.clipboard.writeText(outputText.value)
        .then(() => {
          showToast('<i class="fa-solid fa-circle-check" style="color: #10b981"></i> Copied to clipboard!');
        })
        .catch(err => {
          showError('Failed to copy text: ' + err);
        });
    }
  });
  
  // Text to Speech
  speakBtn.addEventListener('click', () => {
    const text = outputText.value;
    const targetLang = targetLangSelect.value;
    
    if (text) {
      // Stop ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLang;
      
      utterance.onstart = () => {
        speakBtn.classList.add('speaking');
        speakBtn.querySelector('i').className = 'fa-solid fa-volume-high fa-beat-fade';
      };
      
      utterance.onend = () => {
        speakBtn.classList.remove('speaking');
        speakBtn.querySelector('i').className = 'fa-solid fa-volume-high';
      };
      
      utterance.onerror = (e) => {
        console.error('Speech error', e);
        speakBtn.classList.remove('speaking');
        speakBtn.querySelector('i').className = 'fa-solid fa-volume-high';
        showToast('TTS playback failed for this language');
      };
      
      window.speechSynthesis.speak(utterance);
    }
  });
  
  // Settings Modal controls
  settingsBtn.addEventListener('click', openModal);
  closeSettingsBtn.addEventListener('click', closeModal);
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal();
  });
  
  apiEngineSelect.addEventListener('change', (e) => {
    toggleEngineInputs(e.target.value);
  });
  
  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', resetSettings);
  
  // Toggle password eye icon buttons
  document.querySelectorAll('.btn-toggle-visibility').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const input = btn.previousElementSibling;
      const icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye';
      }
    });
  });
  
  // History interaction
  clearHistoryBtn.addEventListener('click', clearAllHistory);
  
  // Error banner close
  closeErrorBtn.addEventListener('click', clearError);
}

// Show/Hide specific config fields in Modal depending on engine selection
function toggleEngineInputs(engine) {
  googleConfigGroup.classList.add('hidden');
  libreConfigGroup.classList.add('hidden');
  
  if (engine === 'google-cloud') {
    googleConfigGroup.classList.remove('hidden');
  } else if (engine === 'libre-translate') {
    libreConfigGroup.classList.remove('hidden');
  }
}

// Modal open/close actions
function openModal() {
  settingsModal.classList.remove('hidden');
}

function closeModal() {
  settingsModal.classList.add('hidden');
}

// Character counter updating
function updateCharCounter() {
  const currentLength = inputText.value.length;
  charCount.textContent = `${currentLength} / 5000`;
  
  if (currentLength >= 5000) {
    charCount.style.color = 'var(--accent-error)';
  } else if (currentLength >= 4500) {
    charCount.style.color = 'orange';
  } else {
    charCount.style.color = 'var(--text-dim)';
  }
}

// Check if buttons should be disabled or enabled
function checkButtonState() {
  const hasInput = inputText.value.trim() !== '';
  const hasOutput = outputText.value.trim() !== '';
  
  copyBtn.disabled = !hasOutput;
  speakBtn.disabled = !hasOutput;
  clearBtn.style.opacity = hasInput ? '1' : '0.4';
}

// 5. Translation Logic Core
async function performTranslation() {
  const text = inputText.value.trim();
  const sourceLang = sourceLangSelect.value;
  const targetLang = targetLangSelect.value;
  
  if (!text) {
    showError('Please enter some text to translate.');
    return;
  }
  
  clearError();
  showLoading(true);
  statusMessage.textContent = 'Translating...';
  
  try {
    let result = '';
    
    switch (appSettings.engine) {
      case 'google-cloud':
        result = await translateWithGoogleCloud(text, sourceLang, targetLang);
        break;
      case 'libre-translate':
        result = await translateWithLibreTranslate(text, sourceLang, targetLang);
        break;
      case 'google-free':
      default:
        result = await translateWithGoogleFree(text, sourceLang, targetLang);
        break;
    }
    
    outputText.value = result;
    statusMessage.textContent = 'Translation complete';
    checkButtonState();
    
    // Add translation to history
    saveToHistory(text, result, sourceLang, targetLang);
    
  } catch (err) {
    console.error('Translation error:', err);
    showError(err.message || 'Translation request failed. Please check your API settings or network connection.');
    outputText.value = '';
    statusMessage.textContent = 'Translation failed';
    checkButtonState();
  } finally {
    showLoading(false);
  }
}

// Google Free Client Translation API Call
async function translateWithGoogleFree(text, source, target) {
  // Use client google single API. Supports auto.
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${source}&tl=${target}&q=${encodeURIComponent(text)}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Google Translate Service returned an error status.');
  }
  
  const data = await response.json();
  
  if (data && data[0]) {
    // Merge all translated sentence chunks
    return data[0].map(chunk => chunk[0]).join('');
  } else {
    throw new Error('Invalid translation data structure received.');
  }
}

// Google Cloud Translate API Call (Key required)
async function translateWithGoogleCloud(text, source, target) {
  if (!appSettings.googleApiKey) {
    throw new Error('Google Cloud API Key is missing. Please enter it in Settings.');
  }
  
  const url = `https://translation.googleapis.com/language/translate/v2?key=${appSettings.googleApiKey}`;
  
  // Format parameters. If source language is 'auto', we exclude it so google auto-detects.
  const body = {
    q: text,
    target: target
  };
  
  if (source !== 'auto') {
    body.source = source;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const errorDetails = data.error ? data.error.message : 'Unknown Cloud Translation error';
    throw new Error(`Google Cloud Translation API error: ${errorDetails}`);
  }
  
  if (data && data.data && data.data.translations && data.data.translations[0]) {
    // Decoding html entities in case response returns entities like &#39;
    return decodeHtmlEntities(data.data.translations[0].translatedText);
  } else {
    throw new Error('Unexpected Google Cloud API response structure.');
  }
}

// LibreTranslate API Call (Server URL + Key optional)
async function translateWithLibreTranslate(text, source, target) {
  let url = appSettings.libreUrl || 'https://libretranslate.de';
  
  // Normalize trailing slash
  if (!url.endsWith('/')) {
    url += '/';
  }
  url += 'translate';
  
  const body = {
    q: text,
    source: source === 'auto' ? 'auto' : source,
    target: target,
    format: 'text'
  };
  
  if (appSettings.libreApiKey) {
    body.api_key = appSettings.libreApiKey;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const errorDetails = data.error || 'Server error';
    throw new Error(`LibreTranslate API error: ${errorDetails}`);
  }
  
  if (data && data.translatedText) {
    return data.translatedText;
  } else {
    throw new Error('Unexpected LibreTranslate response structure.');
  }
}

// Helper to decode HTML entities returned by cloud endpoints
function decodeHtmlEntities(text) {
  const txt = document.createElement('textarea');
  txt.innerHTML = text;
  return txt.value;
}

// 6. Translation History Functions
function loadHistory() {
  const savedHistory = localStorage.getItem('lumina_translate_history');
  if (savedHistory) {
    try {
      translationHistory = JSON.parse(savedHistory);
    } catch (e) {
      console.error('History load failed', e);
      translationHistory = [];
    }
  }
  renderHistory();
}

function saveToHistory(inputTextVal, outputTextVal, sourceLang, targetLang) {
  // Prevent duplicate entries of the same input/output consecutively
  if (translationHistory.length > 0 && translationHistory[0].inputText === inputTextVal && translationHistory[0].targetLang === targetLang) {
    return;
  }
  
  const historyItem = {
    id: Date.now(),
    inputText: inputTextVal,
    outputText: outputTextVal,
    sourceLang,
    targetLang
  };
  
  // Push to front
  translationHistory.unshift(historyItem);
  
  // Retain only last 5 items
  if (translationHistory.length > 5) {
    translationHistory.pop();
  }
  
  localStorage.setItem('lumina_translate_history', JSON.stringify(translationHistory));
  renderHistory();
}

function renderHistory() {
  if (translationHistory.length === 0) {
    historyList.innerHTML = `
      <div class="history-empty">
        <i class="fa-solid fa-folder-open"></i>
        <p>Your recent translations will be saved here.</p>
      </div>
    `;
    return;
  }
  
  let historyHtml = '';
  translationHistory.forEach(item => {
    const srcName = LANGUAGES[item.sourceLang] || 'Auto Detect';
    const tgtName = LANGUAGES[item.targetLang] || 'Target Language';
    
    historyHtml += `
      <div class="history-item" data-id="${item.id}">
        <div class="history-content" onclick="loadHistoryItem(${item.id})">
          <div class="history-languages">
            <span>${srcName}</span>
            <i class="fa-solid fa-arrow-right"></i>
            <span>${tgtName}</span>
          </div>
          <div class="history-texts">
            <div class="history-input-text">${escapeHtml(item.inputText)}</div>
            <div class="history-output-text">${escapeHtml(item.outputText)}</div>
          </div>
        </div>
        <div class="history-actions">
          <button class="btn-icon-subtle" onclick="deleteHistoryItem(${item.id})" title="Remove from history" aria-label="Delete history item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  });
  
  historyList.innerHTML = historyHtml;
}

// Global functions for inline click events in history template
window.loadHistoryItem = function(id) {
  const item = translationHistory.find(h => h.id === id);
  if (item) {
    sourceLangSelect.value = item.sourceLang;
    targetLangSelect.value = item.targetLang;
    inputText.value = item.inputText;
    outputText.value = item.outputText;
    
    updateCharCounter();
    checkButtonState();
    clearError();
    showToast('Loaded translation from history');
  }
};

window.deleteHistoryItem = function(id) {
  translationHistory = translationHistory.filter(h => h.id !== id);
  localStorage.setItem('lumina_translate_history', JSON.stringify(translationHistory));
  renderHistory();
  showToast('Item removed from history');
};

function clearAllHistory() {
  if (translationHistory.length === 0) return;
  
  if (confirm('Are you sure you want to clear your translation history?')) {
    translationHistory = [];
    localStorage.removeItem('lumina_translate_history');
    renderHistory();
    showToast('Translation history cleared');
  }
}

// Escape HTML utility to prevent XSS in history rendering
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 7. Voice Input (Web Speech Recognition)
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    speechInputBtn.style.display = 'none'; // Hide if not supported
    console.log('Web Speech Recognition API is not supported in this browser.');
    return;
  }
  
  speechRecognition = new SpeechRecognition();
  speechRecognition.continuous = false;
  speechRecognition.interimResults = false;
  speechRecognition.lang = 'en-US'; // Default to English voice recognition
  
  speechRecognition.onstart = () => {
    isListening = true;
    speechInputBtn.classList.add('listening');
    speechInputBtn.style.color = 'var(--accent-error)';
    speechInputBtn.querySelector('i').className = 'fa-solid fa-microphone-lines fa-beat';
    statusMessage.textContent = 'Listening...';
    showToast('Listening... Speak now');
  };
  
  speechRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    
    if (inputText.value.trim() !== '') {
      inputText.value += ' ' + transcript;
    } else {
      inputText.value = transcript;
    }
    
    updateCharCounter();
    checkButtonState();
    showToast('Voice text input added');
  };
  
  speechRecognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      showError('Microphone permission denied. Enable microphone access in settings.');
    } else {
      showError('Speech recognition failed: ' + event.error);
    }
  };
  
  speechRecognition.onend = () => {
    isListening = false;
    speechInputBtn.classList.remove('listening');
    speechInputBtn.style.color = 'var(--text-muted)';
    speechInputBtn.querySelector('i').className = 'fa-solid fa-microphone';
    statusMessage.textContent = 'Ready';
  };
  
  // Microphone button click handler
  speechInputBtn.addEventListener('click', () => {
    if (isListening) {
      speechRecognition.stop();
    } else {
      // Sync recognition language with the selected source language if it's not 'auto'
      const selectedSource = sourceLangSelect.value;
      if (selectedSource !== 'auto') {
        speechRecognition.lang = selectedSource;
      } else {
        speechRecognition.lang = 'en-US';
      }
      speechRecognition.start();
    }
  });
}

// 8. Custom Notification System (Toasts & Error Banner)
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = message;
  
  toastContainer.appendChild(toast);
  
  // Auto remove after animation completes (3 seconds)
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function showLoading(isLoading) {
  if (isLoading) {
    loadingOverlay.classList.remove('hidden');
    translateBtn.disabled = true;
    translateBtn.style.opacity = '0.7';
  } else {
    loadingOverlay.classList.add('hidden');
    translateBtn.disabled = false;
    translateBtn.style.opacity = '1';
  }
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorBanner.classList.remove('hidden');
  
  // Scroll to error banner if on mobile
  errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearError() {
  errorBanner.classList.add('hidden');
}
