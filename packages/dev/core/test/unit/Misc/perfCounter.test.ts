import { PerfCounter } from "core/Misc/perfCounter";

describe("PerfCounter", () => {
    it("tracks the minimum for positive values", () => {
        const counter = new PerfCounter();

        expect(counter.min).toBe(0);
        expect(counter.max).toBe(0);

        counter.fetchNewFrame();
        counter.addCount(20, true);
        counter.fetchNewFrame();
        counter.addCount(10, true);

        expect(counter.min).toBe(10);
        expect(counter.max).toBe(20);
    });

    it("tracks the maximum for negative values", () => {
        const counter = new PerfCounter();

        counter.fetchNewFrame();
        counter.addCount(-20, true);
        counter.fetchNewFrame();
        counter.addCount(-10, true);

        expect(counter.min).toBe(-20);
        expect(counter.max).toBe(-10);
    });

    it("initializes extrema from the first recorded value after disabled frames", () => {
        const counter = new PerfCounter();
        const enabled = PerfCounter.Enabled;

        try {
            PerfCounter.Enabled = false;
            counter.fetchNewFrame();
            counter.addCount(10, true);

            PerfCounter.Enabled = true;
            counter.fetchNewFrame();
            counter.addCount(20, true);

            expect(counter.min).toBe(20);
            expect(counter.max).toBe(20);
        } finally {
            PerfCounter.Enabled = enabled;
        }
    });

    it("ignores a disabled frame finalized before the next WebGPU frame", () => {
        const counter = new PerfCounter();
        const enabled = PerfCounter.Enabled;

        try {
            PerfCounter.Enabled = false;
            counter._fetchResult();
            counter.fetchNewFrame();
            counter.addCount(10, false);

            PerfCounter.Enabled = true;
            counter._fetchResult();
            counter.fetchNewFrame();
            counter.addCount(20, false);
            counter._fetchResult();

            expect(counter.min).toBe(20);
            expect(counter.max).toBe(20);
        } finally {
            PerfCounter.Enabled = enabled;
        }
    });
});
