# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
BigDayTimer is a Chrome extension that displays a floating, styled countdown timer for important life events. The project follows a freemium model with basic features available for free and advanced features requiring a premium upgrade.

## Architecture
The system uses a modern, serverless architecture:

- **Frontend**: Chrome Extension (Vanilla JavaScript, Manifest V3, HTML5, CSS3) - lightweight with no third-party dependencies
- **Backend**: Cloudflare Workers for serverless edge computing
- **Database**: Cloudflare KV for key-value storage of premium users
- **Payments**: Paddle as Merchant of Record for global payment processing
- **Landing Page**: Static site deployed on Vercel/Netlify

## Development Commands
Since this appears to be an early-stage project with only a README file present, development commands are not yet established. Based on the architecture described:

**For Chrome Extension Development:**
- Load extension in Chrome: Navigate to `chrome://extensions`, enable Developer mode, click "Load unpacked", select the `extension` folder

**For Backend Development:**
- Install Cloudflare CLI: `npm install -g wrangler` 
- Run local development server: `wrangler dev`
- Configure `wrangler.toml` with account details

## Key Features
- **Free Version**: Single timer, basic backgrounds library, color customization
- **Premium Version**: Custom image upload, multiple timers, premium backgrounds library, advanced customization, ad-free experience

## Target Audience
- Engaged couples counting down to weddings
- Students tracking semester/exam deadlines  
- Travel enthusiasts anticipating vacations
- Anyone awaiting significant life events

## Important Notes
- This is proprietary code - all rights reserved to the project developer
- No commercial use, copying, or distribution without explicit written permission
- Extension is designed to be lightweight with no external dependencies