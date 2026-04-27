/**
 * Derives a human-readable display name from a FlowGraph class name.
 * Strips the leading "FlowGraph" prefix and trailing "Block" suffix, then
 * inserts spaces between CamelCase words so that, e.g.,
 * "FlowGraphAddBlock" → "Add" and "FlowGraphSceneReadyEventBlock" → "Scene Ready Event".
 * @param className the raw class name (e.g. from block.getClassName())
 * @returns a cleaned-up, human-readable label
 */
export function FlowGraphBlockDisplayName(className: string): string {
    let name = className.replace(/^FlowGraph/, "").replace(/Block$/, "");
    // Insert a space before every uppercase letter that follows a lowercase letter or digit.
    name = name.replace(/([a-z\d])([A-Z])/g, "$1 $2");
    return name || className;
}
