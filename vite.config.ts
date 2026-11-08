import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

/**
 * Lists public/assets/music as assets/music/index.json so the game can pick tracks by file
 * name (src/game/logic/music.ts). Live in dev (new files work after a page reload), written
 * once into the build.
 */
function musicIndex(): Plugin {
  const dir = path.resolve(__dirname, 'public/assets/music');
  const list = () => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.(mp3|ogg|wav|m4a)$/i.test(f)).sort() : []);
  return {
    name: 'music-index',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.split('?')[0].endsWith('/assets/music/index.json')) return next();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(list()));
      });
    },
    generateBundle() {
      this.emitFile({type: 'asset', fileName: 'assets/music/index.json', source: JSON.stringify(list())});
    },
  };
}

/**
 * Lists every game asset under public/assets with its size as assets/index.json, so the
 * loading screen can preload them and report progress by real bytes
 * (src/game/loading/preloader.ts). Live in dev, written once into the build.
 */
function assetIndex(): Plugin {
  const root = path.resolve(__dirname, 'public');
  const dir = path.join(root, 'assets');
  const list = () => {
    const out: {path: string; bytes: number}[] = [];
    const walk = (d: string) => {
      if (!fs.existsSync(d)) return;
      for (const e of fs.readdirSync(d, {withFileTypes: true})) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.(png|jpe?g|webp|gif|mp3|ogg|wav|m4a)$/i.test(e.name))
          out.push({path: path.relative(root, full).split(path.sep).join('/'), bytes: fs.statSync(full).size});
      }
    };
    walk(dir);
    return out.sort((a, b) => a.path.localeCompare(b.path));
  };
  return {
    name: 'asset-index',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.split('?')[0].endsWith('/assets/index.json')) return next();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(list()));
      });
    },
    generateBundle() {
      this.emitFile({type: 'asset', fileName: 'assets/index.json', source: JSON.stringify(list())});
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), musicIndex(), assetIndex()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
