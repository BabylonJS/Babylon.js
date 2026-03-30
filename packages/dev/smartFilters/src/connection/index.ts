export { ConnectionPointDirection } from "./connectionPointDirection.js";
export { ConnectionPointType, type ConnectionPointValue } from "./connectionPointType.js";
export {
    ConnectionPointCompatibilityState,
    GetCompatibilityIssueMessage,
    GetCompatibilityIssueMessage as getCompatibilityIssueMessage,
} from "./connectionPointCompatibilityState.js";
// Back compat for when camelCase was used
export { ConnectionPoint, type RuntimeData } from "./connectionPoint.js";
