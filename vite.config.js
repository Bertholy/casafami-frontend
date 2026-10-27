import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // « @/ » désigne le dossier src : c'est l'alias attendu par shadcn/ui (npx shadcn add …)
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rolldownOptions: {
      output: {
        // Les bibliothèques changent rarement : elles restent en cache dans le navigateur d'une visite à l'autre.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[/\\](react|react-dom|react-router|react-router-dom|scheduler)[/\\]/, priority: 30 },
            { name: 'icones', test: /node_modules[/\\]lucide-react[/\\]/, priority: 20 },
          ],
        },
      },
    },
  },
})
