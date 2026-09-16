/**
 * KHR_interactivity opaque reference representation.
 *
 * The specification gives `event/onStart`, `event/onTick`, and `event/receive` a `ref event`
 * output value socket — a runtime reference to the event instance that is consumed by
 * `event/stopPropagation` and validated via `pointer/get` on
 * `/extensions/KHR_interactivity/events/{}`. `flow/setDelay` likewise produces a delay reference
 * validated via `/extensions/KHR_interactivity/delays/{}`.
 *
 * A `ref` value is represented as a JSON Pointer string (the empty string acting as the canonical
 * "null" reference), so both namespaces are expressed as object-model pointers. These formats are
 * specific to this extension and are therefore owned here rather than by the FlowGraph engine.
 */

/**
 * The JSON Pointer prefix shared by all KHR_interactivity event references.
 */
export const EventReferencePrefix = "/extensions/KHR_interactivity/events/";

/**
 * The JSON Pointer prefix shared by all KHR_interactivity delay references.
 */
export const DelayReferencePrefix = "/extensions/KHR_interactivity/delays/";

/**
 * Builds the event reference for a FlowGraph event source key.
 *
 * Lifecycle events use a constant key so that all instances of the same operation return the same
 * reference; custom event receivers use their event id so that receivers of the same event compare
 * equal under `ref/eq`.
 * @param key the FlowGraph event source key
 * @returns the event reference string
 */
export function GetEventReference(key: string): string {
    return EventReferencePrefix + key;
}

/**
 * Extracts the FlowGraph event source key from an event reference.
 * @param reference the value to decode
 * @returns the event source key, or `undefined` when the value is not an event reference
 */
export function GetEventReferenceKey(reference: string): string | undefined {
    return IsEventReference(reference) ? reference.substring(EventReferencePrefix.length) : undefined;
}

/**
 * Returns whether the provided value is a KHR_interactivity event reference, i.e. a non-empty
 * string addressing the events object-model namespace.
 * @param value the value to test
 * @returns true if the value was produced by an event operation as a reference
 */
export function IsEventReference(value: unknown): value is string {
    return typeof value === "string" && value.startsWith(EventReferencePrefix);
}
