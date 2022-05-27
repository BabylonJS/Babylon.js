import { NullEngine } from "core/Engines";
import { DeviceType, DeviceSource, DeviceSourceManager } from "core/DeviceInput";

class TestEventTarget {
    private _events: Map<string, Array<(event) => void>> = new Map();

    public addEventListener(type: string, listener: (event) => void): void {
        if (!this._events.has(type)) {
            this._events.set(type, []);
        }
        const evtType = this._events.get(type);
        evtType.push(listener);
        this._events.set(type, evtType);
    }

    public dispatchEvent(event: any): void {
        const evtType = event.type;
        const callbacks = this._events.get(evtType);

        if (callbacks) {
            for (let i = 0; i < callbacks.length; i++) {
                callbacks[i](event);
            }
        }
    }

    public removeEventListener(type: string, listener: (event) => void): void {
        let callbacks = this._events.get(type);
        const callbackIdx = callbacks ? callbacks.findIndex((value) => {
            return value === listener;
        }) : -1;

        if (callbackIdx !== -1) {
            callbacks = callbacks.splice(callbackIdx, 1);
            this._events.set(type, callbacks);
        }
    }

    public dispose() {
        this._events.clear();
    }
}

class TestDocument extends TestEventTarget{
    private _elements: Array<TestEventTarget>;

    constructor() {
        super();
        this._elements = new Array();
    }

    public createElement(tagName) {
        const element: any = new TestEventTarget();
        if (tagName == "div") {
            element.onwheel = "wheel";
        }
        if (tagName == "window") {
            element.PointerEvent = true;
        }

        this._elements.push(element);
        return element;
    }

    public dispose() {
        for (const element of this._elements) {
            element.dispose();
        }
    }
}

describe("DeviceSourceManager", () => {
    let doc = new TestDocument();
    let win = doc.createElement("window");
    let canvas = doc.createElement("canvas");
    let engine = new NullEngine();
    let dsm;

    beforeAll(function () {
        NullEngine.prototype.getInputElement = () => {
            return canvas;
        };
    
        Object.defineProperty(globalThis, "document", {
            configurable: true,
            value: doc,
        });
    
        Object.defineProperty(globalThis, "window", {
            configurable: true,
            value: win,
        });
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: {
                maxTouchPoints: 10,
                userAgent: "chrome",
                getGamePads: () => {
                    return [];
                },
            },
        });
        Object.defineProperty(globalThis, 'matchMedia', {
            configurable: true,
            value: () => {
                return {
                    matches: false,
                    addListener: () => { },
                    removeListener: () => { }
                };
            }
        });
    });

    beforeEach(function () {
        doc = new TestDocument();
        win = doc.createElement("window");
        canvas = doc.createElement("canvas");
        engine = new NullEngine();
        dsm = new DeviceSourceManager(engine);
    });

    afterEach(function () {
        doc.dispose();
        engine.dispose();
    });
;
    describe("DeviceSourceManager", () => {
        it("should exist", () => {
            expect(dsm).not.toBeUndefined();
        });

        it("getDeviceSources has entries", () => {
            // While our value for maxTouchPoints is 10, we want to make sure that the overflow gets ignored
            for (let i = 1; i <= 12; i++) {
                const evt = {pointerId: i, type: "pointerdown", pointerType: "touch", clientX: 1, clientY: 1};
                canvas.dispatchEvent(evt);
            }

            expect(dsm.getDeviceSources(DeviceType.Touch).length).toBe(10);
        });

        it("getDeviceSource has no entries", () => {
            expect(dsm.getDeviceSources(DeviceType.Mouse).length).toBe(0);
        });
    });
});