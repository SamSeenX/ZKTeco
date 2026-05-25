# ZKTeco Attendance Visualizer

A modular, modern web application to visualize ZKTeco fingerprint and face recognition attendance machine data.

## Features

- **Dynamic CSV Processing**: Automatically handles both traditional "Transaction" formats (one punch per row) and modern "Time Card" formats (semicolon-separated times in a single cell).
- **Smart Grouping**: Automatically identifies Check-In and Check-Out sessions with robust column mapping (handles varied headers like 'Employee ID' or 'ID').
- **Filtering**: Filter records by User or Date.
- **Export**: Download processed data as CSV or save as PDF.
- **Dark Mode**: Toggle between light and dark themes.
- **Responsive**: Mobile-friendly design.

## Tech Stack

- **Vanilla JavaScript** (ES6 Modules)
- **Vite** (Build tool)
- **CSS Variables** (Theming)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the local development server:
```bash
npm run dev
```

### Production Build

Create an optimized build for deployment:
```bash
npm run build
```
The output will be in the `dist/` directory, ready to be uploaded to Cloudflare Pages or any static hosting.

## Deployment to Cloudflare Pages

1. Create a new project on Cloudflare Pages.
2. Connect your Git repository.
3. Configure build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Add your custom domain `zkteco.samseen.dev` in the Cloudflare Pages settings.

---
made with ❤️ by [SamSeen](https://samseen.dev)
