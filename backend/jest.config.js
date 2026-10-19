export default {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],

  transform: {
    "^.+\\.(t|j)s$": ["@swc/jest"],
  },

  extensionsToTreatAsEsm: [".ts"],

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
