const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "@csstools/postcss-oklab-function": {
      // Chrome 109 is the last version available on Windows 7 and does not
      // understand Tailwind 4's OKLCH palette. Keep modern colors and emit
      // an RGB declaration before them for those older classroom PCs.
      preserve: true,
    },
  },
};

export default config;
