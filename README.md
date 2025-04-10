# Elite Dangerous Faction Map

A faction map tool written with Svelte, Threlte, TypeScript, TailwindCSS, and Font Awesome.

## Setup

In order to use Redis for caching, enable it before building by creating a file called `.env.local` and put in the line:

```
VITE_USE_REDIS=true
```

This uses PNPM as the intended package manager. To use the codebase:

```bash
pnpm i # Install dependencies
pnpm dev # Run dev server

pnpm build # Build for production
node build # Run production build
```

### Running with PM2

Create `pm2.config.cjs`, e.g.:

```js
module.exports = {
  apps: [
    {
      name: "edbgs-map",
      script: "build/index.js",
      env: {
        PORT: 8001,
        HOST: "127.0.0.1",
        ORIGIN: "https://www.prismatic-imperium.com",
      },
    },
  ],
};
```

Then, you can use:

```bash
pm2 start pm2.config.cjs # To run
pm2 restart pm2.config.cjs # To restart
```
