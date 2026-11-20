# 🏋️ Workout & Run Logger

A simple, fast, and offline-first personal workout and running logger mobile application built with **React Native**, **Expo SDK 58**, and **Expo Router**.

Designed with **zero login**, **zero pre-built clutter**, **100% local persistence**, and an automated **AI Coach Report Generator** formatted for WhatsApp and LLM agents (ChatGPT, Claude, Gemini).

---

## ✨ Features

### 📂 1. User-Created Categories
- **Clean Slate**: No built-in exercises. You create your own categories (e.g. `Bench Press`, `Incline Press`, `Run`, `Squat`, etc.).
- **Category Types**:
  - **Strength**: For weights, sets, and reps.
  - **Run**: For distance, duration (minutes and seconds), and auto-calculated pace.
- **Dropdown Integration**: Any category you create immediately appears in your daily log dropdown.

---

### 📅 2. Daily Workout & Run Log
- **Date Navigation**: Switch days (`< Prev`, `Next >`) or jump back to `Today`.
- **Strength Tracking**:
  - Log **Weight** and **Reps** per set.
  - **Previous Set Memory**: Shows your previous session's weight and reps (e.g., `80 kg × 10`) for that category.
  - **Done Checkboxes**: Mark sets completed with one tap.
  - **Quick Add Set**: Pre-fills with your previous set's weight & reps.
- **Run Tracking**:
  - Distance (`km` or `miles`), minutes, seconds, and live calculated pace (e.g. `5'12" /km`).
- **Unit Toggle**: Toggle between **KG** and **LBS**.
- **No Unnecessary Fluff**: No energy/feeling ratings, no notes, no accounts.

---

### 📊 3. Past Workouts & Time Filters
View your past training sessions filtered by:
- **Last 3 Days**
- **Last Week** (Last 7 Days)
- **Last Month** (Last 30 Days)
- **All Time**

Includes stats for total workouts, total volume lifted, total sets, total running distance, and expandable cards showing all sets and runs.

---

### 🤖 4. View & Share Report for AI Coach
Generate and share your training data with your AI coach:
- **Time Filters**: Filter report by **Last 3 Days**, **Last Week**, **Last Month**, or **All Time**.
- **Formatted Prompt**: Instructs your AI agent to judge your progressive overload and suggest what to do next.
- **Share Options**:
  - 🟢 **Share to WhatsApp**: One tap to send directly to your WhatsApp AI contact or chat.
  - 📋 **Copy for AI Agent**: Copies markdown prompt to clipboard ready for ChatGPT, Claude, or Gemini.
  - 📄 **Export PDF**: Generates and shares a PDF report.
  - 📁 **Export .txt File**: Generates and shares a text file report.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 58](https://expo.dev/) (React Native 0.88)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (Tabs)
- **Storage**: `@react-native-async-storage/async-storage` (100% offline)
- **Sharing & PDF**: `expo-print`, `expo-sharing`, `expo-file-system`, `expo-clipboard`

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npx expo start
```

---

## 📱 Standalone Android APK Build

To build and permanently install the standalone `.apk` on your mobile phone:

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview
```

Scan the resulting QR code or download the APK directly to your phone.
