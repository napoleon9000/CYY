# 💊 CYY - Medication Reminder App

A beautiful, modern Progressive Web App (PWA) to help you remember to take your medications on time.

![CYY](https://img.shields.io/badge/CYY-v1.0.0-e236ff?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

- 📱 **Progressive Web App** - Install on any device like a native app
- 🔔 **Smart Reminders** - Choose between notifications, sounds, or vibrations
- 📸 **Photo Evidence** - Take photos to confirm medication intake
- 📊 **History Tracking** - View your medication compliance over time
- 🌈 **Beautiful UI** - Modern, colorful interface with smooth animations
- 💾 **Offline Support** - All data stored locally on your device
- 🔒 **100% Private** - No data leaves your device

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/medication-reminder.git
cd medication-reminder
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

The optimized production build will be in the `build` folder.

## 📱 Installing as a PWA

### On Mobile (iOS/Android):
1. Open the app in your mobile browser
2. Tap the share button
3. Select "Add to Home Screen"
4. The app will now appear on your home screen like a native app

### On Desktop (Chrome/Edge):
1. Look for the install icon in the address bar
2. Click "Install"
3. The app will open in its own window

## 🎨 Features in Detail

### Medication Management
- Add medications with custom names and dosages
- Set specific reminder times
- Choose which days of the week to be reminded
- Assign colors to easily identify medications
- Toggle medications on/off without deleting

### Reminder Options
- **Push Notifications**: Get system notifications (requires permission)
- **Sound Alerts**: Gentle chime sounds
- **Vibration**: Discrete vibration alerts (mobile only)

### Tracking & History
- View medication history by date
- See compliance statistics
- Add notes to each dose
- Track skipped doses
- Photo evidence of medication intake

## 🛠️ Technologies Used

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Dexie.js** - IndexedDB wrapper
- **Web APIs** - Notifications, Camera, Vibration

## 🔐 Privacy

CYY is designed with privacy in mind:
- All data is stored locally using IndexedDB
- No servers or external APIs
- No tracking or analytics
- Photos are stored as base64 in your browser
- You can clear all data at any time from Settings

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 💖 Acknowledgments

Made with love for better health management.
