/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  testMatch: ["<rootDir>/src/**/*.{test,spec}.{ts,tsx}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|sass|scss)$": "<rootDir>/src/test/styleMock.ts",
    "\\.(gif|jpg|jpeg|png|svg|webp)$": "<rootDir>/src/test/fileMock.ts",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },
  collectCoverageFrom: [
    "src/app/providers/**/*.{ts,tsx}",
    "src/components/auth/ProtectedRoute.tsx",
    "src/shared/http/apiError.ts",
    "src/shared/lib/**/*.{ts,tsx}",
    "src/shared/ui/**/*.{ts,tsx}",
    "src/features/**/infrastructure/*Mapper.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 81,
      branches: 81,
      functions: 81,
      lines: 81,
    },
  },
};
