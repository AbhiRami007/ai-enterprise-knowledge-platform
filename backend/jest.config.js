export default {
  testEnvironment: "node",

  transform: {
    "^.+\\.(t|j)s$": ["@swc/jest"],
  },

  extensionsToTreatAsEsm: [".ts"],

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
