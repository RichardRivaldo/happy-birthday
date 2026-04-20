import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^@app/(.*)$": "<rootDir>/app/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@domains/(.*)$": "<rootDir>/src/domains/$1",
    "^@outbounds/(.*)$": "<rootDir>/src/outbounds/$1",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "app/**/*.ts",
    "!**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
};

export default config;
