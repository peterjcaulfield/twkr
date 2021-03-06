module.exports = {
  roots: ["<rootDir>/src"],
  testMatch: ["**/?(*.)+(test).+(ts|tsx|js)"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFiles: ["./jest-setup.js"],
};
