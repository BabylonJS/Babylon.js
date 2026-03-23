import { Observable } from "core/Misc/observable";
import { setAndStartTimer } from "core/Misc/timer";

describe("setAndStartTimer", () => {
    it("calls onEnded when timeout is reached", () => {
        vi.useFakeTimers();

        const observable = new Observable<void>();
        let endedCalled = false;
        let abortedCalled = false;

        setAndStartTimer({
            timeout: 100,
            contextObservable: observable,
            onEnded: () => {
                endedCalled = true;
            },
            onAborted: () => {
                abortedCalled = true;
            },
        });

        vi.advanceTimersByTime(150);
        observable.notifyObservers();

        expect(endedCalled).toBe(true);
        expect(abortedCalled).toBe(false);

        vi.useRealTimers();
    });

    it("calls onAborted when breakCondition is met, not onEnded", () => {
        vi.useFakeTimers();

        const observable = new Observable<void>();
        let endedCalled = false;
        let abortedCalled = false;

        setAndStartTimer({
            timeout: 100,
            contextObservable: observable,
            breakCondition: () => true,
            onEnded: () => {
                endedCalled = true;
            },
            onAborted: () => {
                abortedCalled = true;
            },
        });

        observable.notifyObservers();

        expect(abortedCalled).toBe(true);
        expect(endedCalled).toBe(false);

        vi.useRealTimers();
    });

    it("does not call onEnded when breakCondition fires at the same tick as timeout", () => {
        vi.useFakeTimers();

        const observable = new Observable<void>();
        let endedCalled = false;
        let abortedCalled = false;

        setAndStartTimer({
            timeout: 100,
            contextObservable: observable,
            breakCondition: () => true,
            onEnded: () => {
                endedCalled = true;
            },
            onAborted: () => {
                abortedCalled = true;
            },
        });

        // Advance past the timeout so both conditions would be true simultaneously
        vi.advanceTimersByTime(200);
        observable.notifyObservers();

        expect(abortedCalled).toBe(true);
        expect(endedCalled).toBe(false);

        vi.useRealTimers();
    });

    it("passes data to breakCondition", () => {
        vi.useFakeTimers();

        const observable = new Observable<void>();
        let receivedData: any = null;

        setAndStartTimer({
            timeout: 1000,
            contextObservable: observable,
            breakCondition: (data) => {
                receivedData = data;
                return true;
            },
        });

        observable.notifyObservers();

        expect(receivedData).not.toBeNull();
        expect(typeof receivedData.startTime).toBe("number");
        expect(typeof receivedData.deltaTime).toBe("number");
        expect(typeof receivedData.completeRate).toBe("number");

        vi.useRealTimers();
    });

    it("does not call onTick when timer ends", () => {
        vi.useFakeTimers();

        const observable = new Observable<void>();
        let tickCalled = false;
        let endedCalled = false;

        setAndStartTimer({
            timeout: 100,
            contextObservable: observable,
            onTick: () => {
                tickCalled = true;
            },
            onEnded: () => {
                endedCalled = true;
            },
        });

        vi.advanceTimersByTime(150);
        observable.notifyObservers();

        expect(endedCalled).toBe(true);
        expect(tickCalled).toBe(false);

        vi.useRealTimers();
    });

    it("calls onTick on intermediate ticks before timeout", () => {
        vi.useFakeTimers();

        const observable = new Observable<void>();
        let tickCount = 0;
        let endedCalled = false;

        setAndStartTimer({
            timeout: 200,
            contextObservable: observable,
            onTick: () => {
                tickCount++;
            },
            onEnded: () => {
                endedCalled = true;
            },
        });

        // First tick at 50ms - should call onTick
        vi.advanceTimersByTime(50);
        observable.notifyObservers();
        expect(tickCount).toBe(1);
        expect(endedCalled).toBe(false);

        // Second tick at 100ms - should call onTick
        vi.advanceTimersByTime(50);
        observable.notifyObservers();
        expect(tickCount).toBe(2);
        expect(endedCalled).toBe(false);

        // Third tick at 250ms - should call onEnded, not onTick
        vi.advanceTimersByTime(150);
        observable.notifyObservers();
        expect(tickCount).toBe(2);
        expect(endedCalled).toBe(true);

        vi.useRealTimers();
    });

    it("stops firing after timeout is reached", () => {
        vi.useFakeTimers();

        const observable = new Observable<void>();
        let endedCount = 0;

        setAndStartTimer({
            timeout: 100,
            contextObservable: observable,
            onEnded: () => {
                endedCount++;
            },
        });

        vi.advanceTimersByTime(150);
        observable.notifyObservers();
        observable.notifyObservers();
        observable.notifyObservers();

        expect(endedCount).toBe(1);

        vi.useRealTimers();
    });
});
