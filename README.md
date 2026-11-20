# 🏋️ Workout & Run Logger

A simple, fast, and offline-first personal workout and running logger mobile application built with **React Native**, **Expo SDK 58**, and **Expo Router**.

Designed with **zero login**, **zero cloud dependencies**, and **100% local persistence**. Includes an automated **AI Coach Report Generator** formatted for WhatsApp and LLM agents (ChatGPT, Claude, Gemini).

---

## ✨ Features

### 📅 1. Daily Workout Logger
- **Simple & Frictionless**: No accounts, passwords, or logins required. Data is stored directly on your device.
- **Strength Exercises & Sets**:
  - Track **Weight**, **Reps**, **RPE (1–10)**, and set types (**Normal**, **Warmup**, **Drop**, **Failure**).
  - **Previous Set Memory**: Automatically displays your last lifted weight & reps (e.g., `80 kg × 10`) right in the set row for effortless progressive overload.
  - **Fast Logging**: Quick "+ Add Set" button pre-fills the next set with previous values.
  - **Completion Checkboxes**: Mark sets done with a single tap.
- **Built-in Rest Interval Timer**:
  - Quick presets: **30s**, **60s**, **90s**, **2m**, **3m**, plus a custom `+30s` button.
  - Haptic vibration and audio feedback upon completion.
- **Session Notes & Energy Rating**:
  - 1–5 star readiness rating.
  - Session notes to capture fatigue, soreness, and workout feedback.
- **Unit Toggle**: Instant toggle between **KG** and **LBS**.

---

### 🏃 2. Running & Cardio Tracker
- Dedicated cardio logger seamlessly integrated alongside weight training.
- Tracks:
  - **Distance** (`km` or `miles`).
  - **Duration** (minutes and seconds).
  - **Live Calculated Pace** (e.g. `5'12" /km` automatically computed).
  - **Average Heart Rate** (`bpm`) & **Calories** (`kcal`).
  - **Run Notes**: Terrain, weather, morning road run, intervals, etc.

---

### 📂 3. Dynamic Categories & Custom Exercises
- **Ready Out-of-the-Box**: Pre-loaded with popular exercises:
  - *Chest*: Barbell Bench Press, Incline Barbell Press, Incline Dumbbell Press, Dips, Flyes, Cable Crossover.
  - *Back*: Barbell Deadlift, Bent Over Row, Pull-ups, Lat Pulldown, Seated Cable Row.
  - *Legs*: Barbell Squat, Front Squat, Leg Press, Romanian Deadlift (RDL), Leg Extension, Hamstring Curl.
  - *Shoulders*: Overhead Press (OHP), Dumbbell Shoulder Press, Lateral Raise, Rear Delt Fly.
  - *Arms*: Barbell Bicep Curl, Hammer Curl, Tricep Rope Pushdown, Skullcrushers.
  - *Cardio*: Outdoor Run, Treadmill Run, Interval Sprints, Cycling, Rowing.
- **Create on the Fly**: Add custom categories or exercises directly from the logger dropdown or via the dedicated **Categories** tab. Custom movements immediately appear in your dropdown.

---

### 📊 4. Past Workouts History & Filtering
- **Time Filters**: Filter your logs by:
  - **1 Day** (selected single-day detail)
  - **1 Week** (last 7 days)
  - **1 Month** (last 30 days)
  - **All Time** (entire training history)
- **Analytics Dashboard**:
  - Total workouts completed.
  - Total volume tonnage lifted (`kg` / `lbs`).
  - Total sets and reps.
  - Total running distance (`km` / `mi`) and running duration.
  - Muscle group volume distribution chips (`Chest: 18 sets`, `Back: 15 sets`, etc.).
- **Exercise Progression Filter**: Filter the entire history to a single movement (e.g. "Bench Press") to inspect strength trends over time.
- **Expandable Workout Cards**: Inspect previous sets, reps, and run paces, or jump directly back to that date to edit.

---

### 🤖 5. AI Coach Report & WhatsApp Sharing
Generate formatted performance reviews designed specifically for AI Agents (ChatGPT, Claude, Gemini, or a WhatsApp AI bot) to analyze your training:

- **AI Prompt Framing**: Structures your workout logs with instructions asking your AI Coach to:
  1. *Critique progressive overload and volume on compound lifts.*
  2. *Assess muscle balance, cardio integration, and recovery.*
  3. *Recommend specific target weights, reps, and running goals for the upcoming week.*
- **Multiple Export Options**:
  - 🟢 **Share to WhatsApp**: One-tap native share directly to WhatsApp contacts or AI bots.
  - 📋 **Copy for AI Agent**: One-tap clipboard copy formatted with clean markdown tables and emojis.
  - 📄 **Export PDF Report**: Generates a styled fitness report PDF via `expo-print` and shares it through the system share sheet (`expo-sharing`).
  - 📁 **Export .txt File**: Generates and shares a plain text file report via `expo-file-system`.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 58](https://expo.dev/) (React Native 0.88)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Language**: TypeScript (Strict typing)
- **Local Storage**: `@react-native-async-storage/async-storage`
- **Sharing & PDF**: `expo-print`, `expo-sharing`, `expo-file-system`, `expo-clipboard`
- **Icons**: `@expo/vector-icons` (Ionicons)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/MohibUllahKhanSherwani/workout-logger.git
cd workout-logger
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the application
```bash
npx expo start
```

- Press `w` to run in your web browser.
- Press `a` for Android emulator, or scan the QR code using the **Expo Go** app on your physical mobile device.

---

## 📱 Building the Standalone Android APK

To permanently install the app on your Android phone as a standalone `.apk` that runs 100% offline without needing your computer:

```bash
# 1. Log in to your free Expo account
npx eas-cli login

# 2. Build the standalone APK in the cloud
npx eas-cli build -p android --profile preview
```

When the build finishes (~3–5 minutes), EAS will output a download link and a QR code in your terminal. Open the link on your phone, download the `.apk`, and tap **Install**.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
