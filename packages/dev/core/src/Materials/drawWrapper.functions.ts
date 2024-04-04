import { DrawWrapper } from "./drawWrapper";
import { Effect } from "./effect";

    export function IsWrapper(effect: Effect | DrawWrapper): effect is DrawWrapper {
        return (effect as Effect).getPipelineContext === undefined;
    }