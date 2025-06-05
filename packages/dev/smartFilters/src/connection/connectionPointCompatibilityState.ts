/**
 * Defines how compatible connection points are.
 */
export enum ConnectionPointCompatibilityState {
    /** Points are compatibles */
    Compatible,
    /** Points are incompatible because of their types */
    TypeIncompatible,
    /** Points are incompatible because of their directions */
    DirectionIncompatible,
    /** Points are incompatible because they are in the same hierarchy **/
    HierarchyIssue,
}

/**
 * Gets a user friendly message for the given compatibility state.
 * @param state - Defines the compatibility state
 * @returns the message associated with a compatibility state.
 */
export function getCompatibilityIssueMessage(state: ConnectionPointCompatibilityState): string {
    switch (state) {
        case ConnectionPointCompatibilityState.TypeIncompatible:
            return "Cannot connect two different connection types";
        case ConnectionPointCompatibilityState.DirectionIncompatible:
            return "Cannot connect with the same direction";
        case ConnectionPointCompatibilityState.HierarchyIssue:
            return "Source block cannot be connected with one of its ancestors";
        default:
            return "";
    }
}
