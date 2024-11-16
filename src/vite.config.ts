import { defineConfig } from 'vite';

export default defineConfig({
  ssr: {
    noExternal: ['monaco-editor'], // Exclut Monaco Editor du SSR
  },
});
