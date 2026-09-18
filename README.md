# Elite Dangerous Faction Map

A faction map tool written with Svelte, Threlte, TypeScript, TailwindCSS, and Font Awesome.

## Setup

In order to use Valkey for caching, make sure Valkey is installed and enable it before building by creating a file called `.env.local` and putting in the line:

```
VITE_USE_VALKEY=true
```

(You can also set `VITE_VALKEY_HOST` and `VITE_VALKEY_PORT` to use non-default connection information.)

To run the EDDN listener for Powerplay alerts, also put in:

```
VITE_RUN_LISTENER=true
```

This project uses PNPM as the intended package manager. To use the codebase:

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
        PORT: 8000,
        HOST: "127.0.0.1",
        ORIGIN: "https://www.example.com",
      },
      time: true,
    },
  ],
};
```

Then, you can use:

```bash
pm2 start pm2.config.cjs # To run
pm2 restart pm2.config.cjs # To restart
```

## License

This source code is licensed under [AGPL-3.0-or-later](LICENSE).

```
Copyright (C) 2025 Mystler

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
```

The Noto Sans .ttf font files in the static folder are licensed under [OFL-1.1](https://fonts.google.com/noto/specimen/Noto+Sans/license).
