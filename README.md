# Lumina Translate

Lumina Translate is a premium, fully responsive Language Translation Tool web application built with HTML, CSS, JavaScript, and Web APIs. It features a modern, dark glassmorphic UI, voice dictation, text-to-speech feedback, translation history, and integrates with multiple translation engines.

---

## 🌟 Key Features

- **Premium Responsive UI**: Designed with a futuristic dark-mode theme, sleek animations, glow gradients, glassmorphism card panels, and custom-styled dropdown selections. Fully optimized for Mobile, Tablet, and Desktop.
- **50+ Languages**: Populated with 54 popular languages plus an "Auto Detect" capability.
- **No-Key Out of the Box Default**: Uses a free, client-based translation service so that you can open the app and translate immediately.
- **Advanced API Customization**:
  - **Google Cloud Translation API (V2)** integration.
  - **LibreTranslate API** (Self-hosted or public instances) integration.
- **Voice Typing (Speech-to-Text)**: Speak directly into the translator using browser Speech Recognition APIs.
- **Voice Output (Text-to-Speech)**: Read translated texts aloud using the browser's Web Speech Synthesis.
- **Swap Languages**: Swap source and target languages and their respective texts with a single click.
- **Translation History**: Automatically remembers your last 5 translations in browser Local Storage. Load them back or clear items instantly.
- **Character Counter**: Limits and counts input text up to 5,000 characters with visual indicators.
- **One-Click Operations**: Copy translations with dynamic feedback alerts and clear inputs in one click.

---

## 📂 Project Structure

- `index.html` — The structural layout, forms, icons, modal configurations, and notifications container.
- `style.css` — Modern styling featuring glassmorphism, background radial gradients, typography, and responsive media query blocks.
- `script.js` — App logic including language data lists, translation engine fetches, speech input/output engines, and history management.
- `README.md` — Setup, engine configuration instructions, and overview guide.

---

## 🚀 How to Run the App in Visual Studio Code

1. **Clone or Download** this project folder to your local computer.
2. Open **Visual Studio Code**.
3. Go to `File > Open Folder...` and select the directory containing these files (`index.html`, `style.css`, `script.js`, etc.).
4. **Recommended extension**: Install the **Live Server** extension (by Ritwick Dey) in VS Code.
5. Click **Go Live** at the bottom-right status bar in VS Code, or right-click `index.html` and select **Open with Live Server**.
6. Alternatively, you can double-click `index.html` in your file explorer to open it directly in any modern web browser.

---

## ⚙️ How to Configure API Engines & Obtain Keys

Lumina Translate features an in-app settings modal. You can access it by clicking the **Settings icon** (sliders gear) in the upper-right corner of the web page.

### Option 1: Google Translate (Free Client API) — *Default*
- **Required Key**: None.
- **Setup**: This is selected by default. It utilizes public client translation interfaces and works immediately out of the box.

### Option 2: Google Cloud Translation API
- **Required Key**: Google Cloud API Key.
- **Setup Instructions**:
  1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
  2. Create a new project (or select an existing one).
  3. Navigate to **APIs & Services > Library**, search for **Cloud Translation API**, and click **Enable**.
  4. Go to **APIs & Services > Credentials**.
  5. Click **+ Create Credentials** at the top and select **API Key**.
  6. Copy your newly created API key.
  7. *(Optional but Recommended)* Click **Edit API Key** and set restrictions (API restrictions > select "Cloud Translation API") to prevent unauthorized usage.
  8. Open Lumina Translate, click the Settings button, select **Google Cloud Translation API** under Translation Engine, paste your API Key, and click **Save Configuration**.

### Option 3: LibreTranslate API
- **Required Key**: API Key (Optional depending on instance rules).
- **Setup Instructions**:
  - LibreTranslate is an open-source machine translation engine that you can self-host or access through public servers.
  - To host your own instance, follow instructions on [LibreTranslate GitHub](https://github.com/LibreTranslate/LibreTranslate) (can be run with Docker: `docker run -ti --rm -p 5000:5000 libretranslate/libretranslate`).
  - Open the settings modal in the web app, select **LibreTranslate API**, set your Instance URL (e.g. `http://localhost:5000` or a public address like `https://translate.discuss.online`), enter your API key if the instance requires registration, and click **Save Configuration**.

---

## 🛠️ Browser & Feature Compatibility Notes

- **Speech Recognition (Voice Typing)** is supported natively in modern browsers like Google Chrome, MS Edge, and Safari. Ensure you grant microphone access when prompted.
- **Text to Speech (Voice Output)** utilizes standard browser speech voices. Different systems (Windows, macOS, Android, iOS) may offer different speech engine qualities.
- **Local Storage** must be enabled in the browser settings for Translation History and settings caching to function properly.
