/**
 * KHR_interactivity opaque "delay reference" support.
 *
 * The KHR_interactivity spec (§4.2.4 Delay References) lets a behavior graph
 * validate a delay reference produced by `flow/setDelay` via `pointer/get` on
 * `/extensions/KHR_interactivity/delays/{}`. A delay reference is valid only
 * while it is contained in the runtime "dynamic array of delay activation
 * references" — i.e. while the corresponding delay is scheduled and has not yet
 * fired or been cancelled.
 *
 * In the Babylon FlowGraph runtime a delay reference is represented by the
 * unique integer index produced by `flow/setDelay` (its `lastDelayIndex`
 * output). This module tracks which of those indices are currently active per
 * {@link FlowGraphContext} so the `delays/{}` validity accessor can answer the
 * `pointer/get` query.
 */

import { type FlowGraphContext } from "./flowGraphContext";

/**
 * The JSON Pointer prefix shared by all KHR_interactivity delay references.
 */
export const DelayReferencePrefix = "/extensions/KHR_interactivity/delays/";

/**
 * Name of the global context variable holding the set of active delay indices.
 * @internal
 */
const ActiveDelayIndicesKey = "activeDelayIndices";

function GetActiveDelaySet(context: FlowGraphContext): Set<number> {
    let set = context._getGlobalContextVariable<Set<number> | null>(ActiveDelayIndicesKey, null);
    if (!set) {
        set = new Set<number>();
        context._setGlobalContextVariable(ActiveDelayIndicesKey, set);
    }
    return set;
}

/**
 * Marks the given delay index as active (scheduled and pending) in the context.
 * Called by `flow/setDelay` when it schedules a new delayed activation.
 * @param context the flow graph context owning the delay.
 * @param index the unique delay index produced by `flow/setDelay`.
 */
export function MarkDelayActive(context: FlowGraphContext, index: number): void {
    GetActiveDelaySet(context).add(index);
}

/**
 * Marks the given delay index as no longer active. Called when a delay fires,
 * is cancelled via the `cancel` input, or is cancelled by `flow/cancelDelay`.
 * @param context the flow graph context owning the delay.
 * @param index the unique delay index to clear.
 */
export function MarkDelayInactive(context: FlowGraphContext, index: number): void {
    context._getGlobalContextVariable<Set<number> | null>(ActiveDelayIndicesKey, null)?.delete(index);
}

/**
 * Returns whether the given delay index is currently active (scheduled and
 * pending) in the context, as required by the `delays/{}` `pointer/get`
 * validity check.
 * @param context the flow graph context to query.
 * @param index the delay index to test.
 * @returns true if the delay is currently scheduled and has not yet fired or been cancelled.
 */
export function IsDelayActive(context: FlowGraphContext, index: number): boolean {
    return context._getGlobalContextVariable<Set<number> | null>(ActiveDelayIndicesKey, null)?.has(index) ?? false;
}
