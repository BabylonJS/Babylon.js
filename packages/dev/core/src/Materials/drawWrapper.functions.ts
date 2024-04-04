import type { DrawWrapper } from "./drawWrapper";
import type { Effect } from "./effect";

/**
 * Detect if the effect is a DrawWrapper
 * @param effect defines the entity to test
 * @returns if the entity is a DrawWrapper
 */
export function IsWrapper(effect: Effect | DrawWrapper): effect is DrawWrapper {
    return (effect as Effect).getPipelineContext === undefined;
}
