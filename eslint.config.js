import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // 1️⃣ Ignora builds e pastas de saída
  {
    ignores: ['dist', 'dist-electron', 'release', 'node_modules']
  },

  // 2️⃣ CONFIGURAÇÃO REACT / FRONT (Aplica-se a todos os .ts e .tsx, exceto o main do electron)
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/main.ts'], // Mantemos o ignore aqui para não misturar regras de browser/node
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off'
    }
  },

  // 3️⃣ CONFIGURAÇÃO ELECTRON / NODE (Ajustada para entender TypeScript)
  {
    files: ['src/main.ts'],
    // Adicionamos o extends aqui também para que o ESLint saiba que este arquivo usa TS!
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended
    ],
    languageOptions: {
      ecmaVersion: 'latest', // Mudamos para latest para suportar import.meta
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.electron // Adiciona globais do Electron
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off' // Electron usa require às vezes
    }
  }
)