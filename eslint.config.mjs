import js from "eslint-plugin-n";

export default [
  {
    plugins: {
      n: js,
    },
  },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
    }
  },
];
