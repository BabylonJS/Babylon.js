/** This file must only contain pure code and pure imports */

/**
 * Prefix used by the default event-reference format.
 *
 * A host that maps behavior graphs onto its own object model (for example the glTF
 * `KHR_interactivity` loader) supplies its own format through {@link IFlowGraphHostResolver}.
 */
export const FlowGraphDefaultEventReferencePrefix = "flowgraph://events/";

/**
 * Builds the default reference for an event source key.
 * @param key the event source key (e.g. `"sceneReady"`, `"sceneTick"`, or a custom event id)
 * @returns the event reference
 */
export function GetDefaultEventReference(key: string): string {
    return FlowGraphDefaultEventReferencePrefix + key;
}

/**
 * Extracts the event source key from a default-format event reference.
 * @param reference the value to decode
 * @returns the event source key, or `undefined` when the value is not an event reference
 */
export function GetDefaultEventReferenceKey(reference: string): string | undefined {
    return reference.startsWith(FlowGraphDefaultEventReferencePrefix) ? reference.substring(FlowGraphDefaultEventReferencePrefix.length) : undefined;
}

/**
 * Lets the environment hosting a flow graph decide how runtime entities are represented as opaque
 * reference values, so the graph engine itself stays agnostic of the host's object model.
 *
 * A host (e.g. a glTF loader extension) provides an implementation through
 * {@link IFlowGraphCoordinatorConfiguration.hostResolver}. Every member is optional; the engine
 * falls back to a neutral built-in representation for anything the host does not provide.
 */
export interface IFlowGraphHostResolver {
    /**
     * Encodes an event source key as the opaque reference exposed by event blocks on their
     * `event` output.
     *
     * References must be stable: two calls with the same key must produce equal values so that
     * equality comparisons of two `event` outputs of the same source succeed.
     * @param key the event source key
     * @returns the reference representing the event source
     */
    encodeEventReference?(key: string): string;

    /**
     * Decodes an event reference produced by {@link IFlowGraphHostResolver.encodeEventReference}
     * back into its event source key. Must return `undefined` for values that are not event
     * references.
     * @param reference the reference to decode
     * @returns the event source key, or `undefined` when the value is not an event reference
     */
    decodeEventReference?(reference: string): string | undefined;

    /**
     * Maps a runtime object to the reference the host addresses it by, for example the JSON
     * Pointer of the resource a loaded object originates from.
     *
     * Used when an object value is supplied to a templated path input. Returning `undefined`
     * means the host cannot address the object, and the value is rejected.
     * @param object the runtime object to address
     * @param hint optional disambiguation hint, taken from the path segment preceding the template
     * parameter being resolved. A single object may be addressable in several ways, and the hint
     * tells the host which kind of reference the graph is asking for.
     * @returns the reference for the object, or `undefined` when it cannot be addressed
     */
    getObjectReference?(object: object, hint?: string): string | undefined;
}
