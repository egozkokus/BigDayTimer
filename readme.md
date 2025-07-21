# BigDayTimer ⏳

BigDayTimer is a beautiful and personal Chrome extension that displays a floating, styled countdown timer for life's most important events. Perfect for weddings, vacations, graduations, and any other moment worth waiting for.

Turn every browser opening into an exciting reminder of your next big thing.

## 🚀 Project Status: **COMPLETED**

✅ **All major components have been built and are ready for deployment:**

- Chrome Extension (Manifest V3) with full functionality
- Cloudflare Workers backend with premium user management  
- Paddle payment integration
- Marketing website with Hebrew RTL support
- Premium features (custom backgrounds, multiple timers)
- Responsive floating timer with drag & drop
- Complete freemium model implementation

## 🚀 Quick Start

### Installation (Development)

1. **Load the Chrome Extension:**
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `extension` folder from this project
   - The extension icon will appear in your toolbar

2. **Set up Backend (Optional - for premium features):**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Deploy Website:**
   ```bash
   cd website
   # Deploy to Vercel, Netlify, or any static hosting
   ```

## 📁 Project Structure

```
BigDayTimer/
├── extension/                 # ✅ Complete Chrome extension
│   ├── manifest.json         # Manifest V3 configuration
│   ├── popup.html/js         # Settings interface
│   ├── content.js            # Floating timer display  
│   ├── background.js         # Service worker
│   ├── timer.css             # Timer styling
│   └── premium.js            # Premium features
├── backend/                  # ✅ Complete Cloudflare Workers
│   ├── src/worker.js         # API endpoints & Paddle integration
│   ├── wrangler.toml         # Deployment configuration
│   └── package.json          # Dependencies
├── website/                  # ✅ Complete marketing site
│   ├── index.html            # Hebrew RTL landing page
│   ├── styles.css            # Responsive design
│   └── script.js             # Interactive features
└── CLAUDE.md                 # Development guidance
```

## ✨ Key Features

The extension operates on a Freemium model, combining a great free experience with the option for a one-time upgrade to advanced features.

### 🎁 Free Version
- **Single Event Timer**: Set one main event and track the countdown
- **Basic Background Library**: Choose from beautiful backgrounds to match the mood
- **Clean Minimalist Design**: Simple interface focused on what matters - time remaining
- **Color Customization**: Choose text colors that perfectly match your background

### 💎 Premium Version ($4.99 one-time)
- **⭐ Custom Image Upload**: The feature that makes the timer truly personal! Upload photos of you and your partner, vacation destination, or any inspiring image
- **Multiple Timers Simultaneously**: Track your wedding, end of semester, and big trip - all at the same time
- **Premium Library**: Access to extended library of dynamic backgrounds, animations and unique designs
- **Advanced Customization**: Full control over fonts, sizes and visual effects
- **No Ads Forever**: Clean, uninterrupted experience

## 🎯 Target Audience

The extension is created for anyone who loves anticipating exciting events:

- **💍 Engaged Couples**: Count every day, hour, and minute until the wedding
- **🎓 Students**: Countdown to end of semester, big exam, or summer vacation  
- **✈️ Travel Enthusiasts**: Watch your next vacation approach before your eyes
- **🎉 Anyone Else**: Waiting for birthdays, concerts, or any other significant event

## 🏗️ Architecture & Technology

The system is built with modern, efficient, and scalable architecture based on the following technologies:

| Component | Technology | Description |
|-----------|------------|-------------|
| 🧩 **Extension (Frontend)** | JavaScript (Vanilla), Manifest V3, HTML5, CSS3 | Lightweight Chrome extension with no third-party dependencies |
| ☁️ **Backend** | Cloudflare Workers | Fast server-side code running on Cloudflare's edge network for maximum performance |
| 🗃️ **Database** | Cloudflare KV | Key-Value database for fast storage of premium user list |
| 💳 **Payment System** | Paddle | Payment provider managing all billing and global taxation (Merchant of Record) |
| 🌐 **Landing Page** | Vercel / Netlify | Fast static marketing page for showcasing and directing to purchase |

## 🚀 Future Roadmap

- [ ] **Timer Sharing**: Option to share unique timer link with friends and family
- [ ] **Calendar Integration**: Sync events from Google Calendar
- [ ] **Multi-Browser Support**: Extend support to Firefox and Edge
- [ ] **Additional Widgets**: Add useful widgets like daily quotes or weather

## ⚙️ Local Installation & Development

To run the project locally for development purposes:

### Clone Repository:
```bash
git clone https://github.com/YOUR_USERNAME/BigDayTimer.git
cd BigDayTimer
```

### Load Extension in Chrome:
1. Open `chrome://extensions` in Chrome browser
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `extension` folder from the project

### Backend Setup:
1. Install Cloudflare CLI tool: `npm install -g wrangler`
2. Configure `wrangler.toml` with your account details
3. Run local server: `wrangler dev`

## 📄 License

The code in this repository is proprietary software.
All rights reserved to the project developer. Do not copy, duplicate, distribute, or make commercial use of the source code without explicit written permission.

**© 2025 BigDayTimer. All Rights Reserved.**