import { createDefaultPreset } from 'ts-jest'

const presetConfig = createDefaultPreset({
   tsconfig: "./tsconfig.test.json"
})

const config = {
  ...presetConfig,
  testPathIgnorePatterns: [
      "/node_modules/",
      "^.+\\.js$",
      "/demos/"
  ],
}
export default config;

    //"jest": {
    //    "preset": "ts-jest",
    //    "testPathIgnorePatterns": [
    //        "/node_modules/",
    //        "^.+\\.js$",
    //        "/demos/"
    //    ],
    //    "globals": {
    //        "ts-jest": {
    //            "tsConfig": "<rootDir>/tsconfig.test.json"
    //        }
    //    }
    //},
