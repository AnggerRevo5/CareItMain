This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and configured for mobile deployment with [Capacitor](https://capacitorjs.com/).

## Getting Started

### Web Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Mobile Development (Capacitor)

This project supports both web and mobile platforms:
- **Web**: Uses Next.js API routes as proxy to backend (no CORS issues)
- **Mobile**: Uses direct backend calls (static export, no API routes)

**Prerequisites:**
- Backend server must be running (default: `http://localhost:8081`)
- For production mobile app, set `NEXT_PUBLIC_API_URL` environment variable to your backend server URL

**Build for Mobile (with static export):**

**Windows:**
```powershell
# PowerShell
.\build-mobile.ps1

# Or CMD
build-mobile.bat

# Or manually set environment variable
$env:NEXT_EXPORT="true"; npm run build; npx cap sync
```

**Linux/Mac:**
```bash
# Set environment variable and build
NEXT_EXPORT=true npm run build && npx cap sync

# Or use the npm script (requires cross-env)
npm run build:mobile:export
```

**Note:** Regular `npm run build` is for web development (with API routes). Use the mobile build scripts above for Capacitor.

**Open Native Projects:**

```bash
# Android
npm run cap:open:android

# iOS (macOS only)
npm run cap:open:ios
```

**Run on Device/Emulator:**

```bash
# Android
npm run cap:run:android

# iOS
npm run cap:run:ios
```

**Other Capacitor Commands:**

```bash
# Copy web assets only (without updating dependencies)
npm run cap:copy

# Sync web assets and update native dependencies
npm run cap:sync
```

**How It Works:**
- **Web Development**: API calls go through `/api` routes (Next.js proxy) → Backend Go server
- **Mobile App**: API calls go directly to backend Go server (detected automatically via Capacitor)
- The app automatically detects the platform and uses the appropriate API endpoint

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
