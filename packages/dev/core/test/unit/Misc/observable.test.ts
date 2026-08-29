import { Observable } from "core/Misc/observable";
import { describe, expect, it, vi } from "vitest";

describe("Observable", () => {
    it("notifies late observers after being triggered without event data", () => {
        const observable = new Observable<void>(undefined, true);
        const callback = vi.fn();

        observable.notifyObservers();
        observable.add(callback);

        expect(callback).toHaveBeenCalledOnce();
        expect(callback.mock.calls[0][0]).toBeUndefined();
    });

    it("unregisters a late addOnce observer after notifying it without event data", () => {
        const observable = new Observable<void>(undefined, true);
        const callback = vi.fn();

        observable.notifyObservers();
        observable.addOnce(callback);

        expect(callback).toHaveBeenCalledOnce();
        expect(observable.hasObservers()).toBe(false);

        observable.notifyObservers();

        expect(callback).toHaveBeenCalledOnce();
    });
});
