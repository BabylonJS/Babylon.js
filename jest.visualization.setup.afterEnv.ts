// import { setupJestScreenshot } from "jest-screenshot";
// setupJestScreenshot();
const { configureToMatchImageSnapshot } = require('jest-image-snapshot');

// const customConfig = { threshold: 0 };
const toMatchImageSnapshot = configureToMatchImageSnapshot({
//   customDiffConfig: customConfig,
//   noColors: true,
});
expect.extend({ toMatchImageSnapshot });
jest.setTimeout(12000000);
