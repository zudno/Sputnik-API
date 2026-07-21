/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/panels/**/*.ts"
  ],
  theme: {
    extend: {
      colors: {
        vsc: {
          background: 'var(--vscode-editor-background)',
          foreground: 'var(--vscode-editor-foreground)',
          input: {
            background: 'var(--vscode-input-background)',
            foreground: 'var(--vscode-input-foreground)',
            border: 'var(--vscode-input-border)'
          },
          focus: 'var(--vscode-focusBorder)',
          button: {
            background: 'var(--vscode-button-background)',
            foreground: 'var(--vscode-button-foreground)',
            hover: 'var(--vscode-button-hoverBackground)'
          },
          panel: {
            border: 'var(--vscode-panel-border)'
          },
          inactive: 'var(--vscode-editor-inactiveSelectionBackground)',
          error: 'var(--vscode-errorForeground)',
          success: '#4caf50' // Mismo color verde de antes
        }
      },
      fontFamily: {
        sans: ['var(--vscode-font-family)', 'sans-serif'],
        mono: ['var(--vscode-editor-font-family)', 'monospace']
      }
    },
  },
  plugins: [],
}
