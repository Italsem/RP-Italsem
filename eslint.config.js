import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
  },
])
