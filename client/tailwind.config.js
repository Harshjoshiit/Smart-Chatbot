/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scan all React files in src
  ],
  theme: {
    extend: {
      colors: {
        'cimba-primary': '#4f46e5', // Indigo-600 for branding
        'cimba-bg': '#f9fafb',      // Light gray background
      }
    },
  },
  plugins: [],
}