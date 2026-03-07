/* eslint-disable import/no-internal-modules */
export * from "./command/index.js";
export * from "./connection/index.js";
export * from "./blockFoundation/index.js";
export * from "./editorUtils/index.js";
export * from "./optimization/index.js";
export * from "./runtime/index.js";
export * from "./serialization/index.js";
export * from "./utils/index.js";

export { type IDisposable } from "./IDisposable.js";
export { SmartFilter, type InitializationData } from "./smartFilter.js";
export * from "./version.js";

// So that users of the Smart Filters core can easily modify the logger settings (e.g. to change the logging level)
export { Logger } from "core/Misc/logger.js";

// Upgrade build tools logging from console to Babylon's Logger when the library is imported
import { Logger as _Logger } from "core/Misc/logger.js";
import { setLogger } from "./utils/buildTools/buildToolsLogger.js";
setLogger(_Logger);
