/**
 * KHR_interactivity opaque "event reference" support.
 *
 * The latest KHR_interactivity spec gives `event/onStart`, `event/onTick`, and
 * `event/receive` a `ref event` output value socket — a runtime reference to the
 * event instance that is consumed by `event/stopPropagation` and validated via
 * `pointer/get` on `/extensions/KHR_interactivity/events/{}`.
 *
 * In the Babylon FlowGraph runtime the `ref` type is represented as a JSON
 * Pointer string (with the empty string acting as the canonical "null"
 * reference). Event references therefore use the spec object-model namespace
 * `/extensions/KHR_interactivity/events/<key>` so that:
 *  - they are non-empty (i.e. "not null"),
 *  - two references produced by the same event source compare equal via `ref/eq`
 *    (string comparison), and
 *  - they can be recognised as event references by `IsEventReference`.
 */

/**
 * The JSON Pointer prefix shared by all KHR_interactivity event references.
 */
export const EventReferencePrefix = "/extensions/KHR_interactivity/events/";

/**
 * Builds a stable event reference string for the given key.
 *
 * Lifecycle events use a constant key (`"onStart"` / `"onTick"`) so that all
 * instances of the same operation return the same reference. Custom event
 * receivers use their event id so that receivers of the same event compare equal.
 * @param key the event source key (e.g. `"onStart"`, `"onTick"`, or a custom event id).
 * @returns the event reference string.
 */
export function GetEventReference(key: string): string {
    return EventReferencePrefix + key;
}

/**
 * Returns whether the provided value is a KHR_interactivity event reference,
 * i.e. a non-empty string addressing the events object-model namespace.
 * @param value the value to test.
 * @returns true if the value was produced by an event operation as a reference.
 */
export function IsEventReference(value: unknown): value is string {
    return typeof value === "string" && value.startsWith(EventReferencePrefix);
}
