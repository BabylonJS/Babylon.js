import { _ObserveArray } from "core/Misc/arrayTools";

/**
 * Describes the test suite.
 */
 describe("ArrayTools", function () {
    jest.setTimeout(10000);

    describe("#observe array", () => {
        it("should be able to listen to push", () => {
            const listener = jest.fn();

            const array = new Array<number>();
            array.push(1);
            expect(listener).not.toBeCalled();

            _ObserveArray(array, listener);
            array.push(2);
            expect(listener).toBeCalledWith("push", 1);

            expect(array.length).toEqual(2);
        });

        it("should have updated values in callback", (done) => {
            const array = new Array<number>();
            array.push(1);
            const listener = () => {
                expect(array.length).toEqual(2);
                done();
            };
            _ObserveArray(array, listener);
            array.push(2);
        });

        it("should be able to listen to shift", () => {
            const listener = jest.fn();

            const array = [1, 2, 3];
            array.shift();
            expect(listener).not.toBeCalled();

            _ObserveArray(array, listener);
            array.shift();
            expect(listener).toBeCalledWith("shift", 2);

            expect(array.length).toEqual(1);
        });

        it("should be able to hook several times", () => {
            const array = [1, 2, 3];

            const listener = jest.fn();
            _ObserveArray(array, listener);
            array.push(4);
            expect(listener).toBeCalledWith("push", 3);

            const listener2 = jest.fn();
            _ObserveArray(array, listener2);
            array.push(5);
            expect(listener).toBeCalledTimes(2);
            expect(listener2).toBeCalledWith("push", 4);
            expect(listener2).toBeCalledTimes(1);

            expect(array.length).toEqual(5);
        });
    });

    describe("#unobserve array", () => {
        it("should stop listening to pop", () => {
            const listener = jest.fn();

            const array = [1, 2, 3, 4];
            array.pop();
            expect(listener).not.toBeCalled();

            const unObserve = _ObserveArray(array, listener);
            let value = array.pop();
            expect(listener).toBeCalledWith("pop", 3);
            expect(value).toEqual(3);

            unObserve();
            listener.mockReset();
            value = array.pop();
            expect(listener).not.toBeCalledWith("pop");
            expect(value).toEqual(2);

            expect(array.length).toEqual(1);
        });

        it("should stop listening to in a chain", () => {
            const array = new Array<number>();

            const listener1 = jest.fn();
            const listener2 = jest.fn();
            const listener3 = jest.fn();
            const listener4 = jest.fn();

            const unObserve1 = _ObserveArray(array, listener1);
            const unObserve2 = _ObserveArray(array, listener2);
            const unObserve3 = _ObserveArray(array, listener3);
            const unObserve4 = _ObserveArray(array, listener4);

            array.push(1);
            expect(listener1).toBeCalledWith("push", 0);
            expect(listener2).toBeCalledWith("push", 0);
            expect(listener3).toBeCalledWith("push", 0);
            expect(listener4).toBeCalledWith("push", 0);

            unObserve2();
            listener1.mockReset();
            listener2.mockReset();
            listener3.mockReset();
            listener4.mockReset();

            array.push(2);
            expect(listener1).toBeCalledWith("push", 1);
            expect(listener2).not.toBeCalled();
            expect(listener3).toBeCalledWith("push", 1);
            expect(listener4).toBeCalledWith("push", 1);

            unObserve3();
            listener1.mockReset();
            listener2.mockReset();
            listener3.mockReset();
            listener4.mockReset();

            array.push(3);
            expect(listener1).toBeCalledWith("push", 2);
            expect(listener2).not.toBeCalled();
            expect(listener3).not.toBeCalled();
            expect(listener4).toBeCalledWith("push", 2);

            unObserve4();
            listener1.mockReset();
            listener2.mockReset();
            listener3.mockReset();
            listener4.mockReset();

            array.push(4);
            expect(listener1).toBeCalledWith("push", 3);
            expect(listener2).not.toBeCalled();
            expect(listener3).not.toBeCalled();
            expect(listener4).not.toBeCalled();

            unObserve1();
            listener1.mockReset();
            listener2.mockReset();
            listener3.mockReset();
            listener4.mockReset();

            array.push(5);
            expect(listener1).not.toBeCalled();
            expect(listener2).not.toBeCalled();
            expect(listener3).not.toBeCalled();
            expect(listener4).not.toBeCalled();

            expect(array.length).toEqual(5);
        });
    });
 });