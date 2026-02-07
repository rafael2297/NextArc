/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,tsx,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          bgApp: 'var(--color-bg)',
          navApp: 'var(--color-nav)',
          primary: 'var(--color-primary)',
        }
      }
    },
  },
  plugins: [],
}