module.exports = [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "no-console": "off",
    },
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    rules: {
      "no-unused-vars": "off",
      "no-console": "off",
    },
  },
];