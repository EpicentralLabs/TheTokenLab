import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'p-black': ['p-black', 'sans-serif'],
        'p-blackitalic': ['p-blackitalic', 'sans-serif'],
        'p-bold': ['p-bold', 'sans-serif'],
        'p-bolditalic': ['p-bolditalic', 'sans-serif'],
        'p-extrabold': ['p-extrabold', 'sans-serif'],
        'p-extrabolditalic': ['p-extrabolditalic', 'sans-serif'],
        'p-extralight': ['p-extralight', 'sans-serif'],
        'p-extralightitalic': ['p-extralightitalic', 'sans-serif'],
        'p-italic': ['p-italic', 'sans-serif'],
        'p-light': ['p-light', 'sans-serif'],
        'p-lightitalic': ['p-lightitalic', 'sans-serif'],
        'p-medium': ['p-medium', 'sans-serif'],
        'p-mediumitalic': ['p-mediumitalic', 'sans-serif'],
        'p-regular': ['p-regular', 'sans-serif'],
        'p-semibold': ['p-semibold', 'sans-serif'],
        'p-semibolditalic': ['p-semibolditalic', 'sans-serif'],
        'p-thin': ['p-thin', 'sans-serif'],
        'p-thinitalic': ['p-thinitalic', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
