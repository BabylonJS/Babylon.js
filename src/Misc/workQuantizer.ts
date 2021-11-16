/**
 * The type of an object that assists in quantizing long running work.
 */
export type WorkQuantizer = {
    readonly shouldYield: false,
} | {
    readonly shouldYield: true,
    yield: () => Promise<void>,
};

/**
 * Creates a quantizer that never quantizes work.
 * @param quantizeWork Always false and indicates that no quantization should occur.
 * @returns An instance of a work quantizer that can be querried to determine when to yield.
 */
export function createWorkQuantizer(quantizeWork: false): WorkQuantizer;

/**
 * Creates a quantizer that requests yielding after the specified unit of work is executed.
 * @param yieldAfterMS The number of milliseconds of work that should be performed before yielding.
 * @returns An instance of a work quantizer that can be querried to determine when to yield.
 */
export function createWorkQuantizer(yieldAfterMS?: number): WorkQuantizer

/**
 * Creates a quantizer from the specified configuration.
 * @param config The configuration of the quantizer.
 * @returns An instance of a work quantizer that can be querried to determine when to yield.
 */
export function createWorkQuantizer(config: number | false | undefined): WorkQuantizer {
    if (config === false) {
        return {
            shouldYield: false,
        };
    }

    if(config === undefined) {
        config = 25;
    }

    const yieldAfterMS = config;
    let start = performance.now();

    const quantizer = {
        get shouldYield() {
            const end = performance.now();
            if (end - start > yieldAfterMS) {
                start = end;
                return true;
            }
            return false;
        },
        yield() {
            return new Promise<void>(resolve => setTimeout(resolve, 0));
        },
    };

    return quantizer;
}