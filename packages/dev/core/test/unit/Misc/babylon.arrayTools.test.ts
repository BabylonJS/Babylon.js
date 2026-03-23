import { _ObserveArray } from "core/Misc/arrayTools";

/**
 * Describes the test suite.
 */
describe("ArrayTools", function () {
    vi.setConfig({ testTimeout: 10000 });

    describe("#observe array", () => {
        it("should be able to listen to push", () => {
            const listener = vi.fn();

            const array: number[] = [];
            array.push(1);
            expect(listener).not.toHaveBeenCalled();

            _ObserveArray(array, listener);
            array.push(2);
            expect(listener).toHaveBeenCalledWith("push", 1);

            expect(array.length).toEqual(2);
        });

        it("should have updated values in callback", () => {
            return new Promise<void>((resolve) => {
                const array: number[] = [];
                array.push(1);
                const listener = () => {
                    expect(array.length).toEqual(2);
                    resolve();
                };
                _ObserveArray(array, listener);
                array.push(2);
            });
        });

        it("should be able to listen to shift", () => {
            const listener = vi.fn();

            const array = [1, 2, 3];
            array.shift();
            expect(listener).not.toHaveBeenCalled();

            _ObserveArray(array, listener);
            array.shift();
            expect(listener).toHaveBeenCalledWith("shift", 2);

            expect(array.length).toEqual(1);
        });

        it("should be able to hook several times", () => {
            const array = [1, 2, 3];

            const listener = vi.fn();
            _ObserveArray(array, listener);
            array.push(4);
            expect(listener).toHaveBeenCalledWith("push", 3);

            const listener2 = vi.fn();
            _ObserveArray(array, listener2);
            array.push(5);
            expect(listener).toHaveBeenCalledTimes(2);
            expect(listener2).toHaveBeenCalledWith("push", 4);
            expect(listener2).toHaveBeenCalledTimes(1);

            expect(array.length).toEqual(5);
        });
    });

    describe("#unobserve array", () => {
        it("should stop listening to pop", () => {
            const listener = vi.fn();

            const array = [1, 2, 3, 4];
            array.pop();
            expect(listener).not.toHaveBeenCalled();

            const unObserve = _ObserveArray(array, listener);
            let value = array.pop();
            expect(listener).toHaveBeenCalledWith("pop", 3);
            expect(value).toEqual(3);

            unObserve();
            listener.mockReset();
            value = array.pop();
            expect(listener).not.toHaveBeenCalledWith("pop");
            expect(value).toEqual(2);

            expect(array.length).toEqual(1);
        });

        it("should stop listening to in a chain", () => {
            const array: number[] = [];

            const listener1 = vi.fn();
            const listener2 = vi.fn();
            const listener3 = vi.fn();
            const listener4 = vi.fn();

            const unObserve1 = _ObserveArray(array, listener1);
            const unObserve2 = _ObserveArray(array, listener2);
            const unObserve3 = _ObserveArray(array, listener3);
            const unObserve4 = _ObserveArray(array, listener4);

            array.push(1);
            expect(listener1).toHaveBeenCalledWith("push", 0);
            expect(listener2).toHaveBeenCalledWith("push", 0);
            expect(listener3).toHaveBeenCalledWith("push", 0);
            expect(listener4).toHaveBeenCalledWith("push", 0);

            unObserve2();
            listener1.mockReset();
            listener2.mockReset();
            listener3.mockReset();
            listener4.mockReset();

            array.push(2);
            expect(listener1).toHaveBeenCalledWith("push", 1);
            expect(listener2).not.toHaveBeenCalled();
            expect(listener3).toHaveBeenCalledWith("push", 1);
            expect(listener4).toHaveBeenCalledWith("push", 1);

            unObserve3();
            listener1.mockReset();
            listener2.mockReset();
            listener3.mockReset();
            listener4.mockReset();

            array.push(3);
            expect(listener1).toHaveBeenCalledWith("push", 2);
            expect(listener2).not.toHaveBeenCalled();
            expect(listener3).not.toHaveBeenCalled();
            expect(listener4).toHaveBeenCalledWith("push", 2);

            unObserve4();
            listener1.mockReset();
            listener2.mockReset();
            listener3.mockReset();
            listener4.mockReset();

            array.push(4);
            expect(listener1).toHaveBeenCalledWith("push", 3);
            expect(listener2).not.toHaveBeenCalled();
            expect(listener3).not.toHaveBeenCalled();
            expect(listener4).not.toHaveBeenCalled();

            unObserve1();
            listener1.mockReset();
            listener2.mockReset();
            listener3.mockReset();
            listener4.mockReset();

            array.push(5);
            expect(listener1).not.toHaveBeenCalled();
            expect(listener2).not.toHaveBeenCalled();
            expect(listener3).not.toHaveBeenCalled();
            expect(listener4).not.toHaveBeenCalled();

            expect(array.length).toEqual(5);
        });
    });
});
