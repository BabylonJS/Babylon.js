/**
 * Editor-side registry of which data-input connections should be rendered as
 * editable fields in the right-hand property panel.
 *
 * Keys are the block class names returned by `getClassName()`.
 * Values are the connection names that the user can edit directly in the panel.
 *
 * This file is intentionally kept in the editor package so that core is not
 * aware of any editor concepts. When adding a new block whose inputs should be
 * configurable in the panel, just add an entry here.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const EDITABLE_INPUTS: ReadonlyMap<string, ReadonlySet<string>> = new Map([
    ["FlowGraphGetPropertyBlock", new Set(["propertyName"])],
    ["FlowGraphSetPropertyBlock", new Set(["propertyName"])],
    ["FlowGraphInterpolationBlock", new Set(["propertyName"])],
    ["FlowGraphConsoleLogBlock", new Set(["logType"])],
]);
