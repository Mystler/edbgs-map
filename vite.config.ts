import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { execSync } from "child_process";

const version = execSync("git rev-list --count HEAD").toString().trim();
const commit = execSync("git rev-parse --short HEAD").toString().trim();

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
  define: {
    __VERSION__: JSON.stringify(version),
    __COMMIT__: JSON.stringify(commit),
  },
});
