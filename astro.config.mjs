import { defineConfig } from 'astro/config';

export default defineConfig({
  // site will be set by Cloudflare Pages
  output: 'static',
  compressHTML: true,
});
