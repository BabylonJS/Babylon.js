import { PerfCounter } from "core/Misc/perfCounter";

/**
 * Class used to define a GPU performance counter
 */
export class GPUPerfCounter {
    /**
     * The GPU time in nanoseconds spent in the last frame
     */
    public counter: PerfCounter;

    /**
     * Creates a new GPU performance counter
     */
    constructor() {
        this.counter = new PerfCounter();
    }
}
