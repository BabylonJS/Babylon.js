import type { Nullable } from "core/types";
import type { Particle } from "../particle";
import type { ThinParticleSystem } from "../thinParticleSystem";

/** @internal */
export interface _IExecutionQueueItem {
    /** @internal */
    process: (particle: Particle, system: ThinParticleSystem) => void;
    /** @internal */
    previousItem: Nullable<_IExecutionQueueItem>;
    /** @internal */
    nextItem: Nullable<_IExecutionQueueItem>;
}

/** @internal */
export function _ConnectBefore(newOne: _IExecutionQueueItem, activeOne: _IExecutionQueueItem) {
    newOne.previousItem = activeOne.previousItem;
    newOne.nextItem = activeOne;
    if (activeOne.previousItem) {
        activeOne.previousItem.nextItem = newOne;
    }
    activeOne.previousItem = newOne;
}

/** @internal */
export function _ConnectAfter(newOne: _IExecutionQueueItem, activeOne: _IExecutionQueueItem) {
    newOne.previousItem = activeOne;
    newOne.nextItem = activeOne.nextItem;
    if (activeOne.nextItem) {
        activeOne.nextItem.previousItem = newOne;
    }
    activeOne.nextItem = newOne;
}

/** @internal */
export function _ConnectAtTheEnd(newOne: _IExecutionQueueItem, root: _IExecutionQueueItem) {
    let activeOne = root;
    while (activeOne.nextItem) {
        activeOne = activeOne.nextItem;
    }
    newOne.previousItem = activeOne;
    newOne.nextItem = activeOne.nextItem;
    activeOne.nextItem = newOne;
}

/** @internal */
export function _RemoveFromQueue(item: _IExecutionQueueItem) {
    if (item.previousItem) {
        item.previousItem.nextItem = item.nextItem;
    }
    if (item.nextItem) {
        item.nextItem.previousItem = item.previousItem;
    }
}
