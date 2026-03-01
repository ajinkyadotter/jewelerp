/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { 900: "#0f1f3d", 800: "#1a2f5a", 700: "#1e3a6e", 600: "#2563eb" },
        brand: { DEFAULT: "#1e3a5f", light: "#2a4f80" }
      },
      fontFamily: { sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"] }
    }
  },
  plugins: [],
}
