import { describe, expect, it, vi } from "vitest";

import { InterceptProperty } from "../../src/instrumentation/propertyInstrumentation";

describe("InterceptProperty", () => {
    it("forwards `this` to the original getter and setter when intercepting an inherited accessor on a subclass instance", () => {
        // Regression for a bug where the intercepted accessor was always invoked against the prototype
        // object instead of the calling instance, so a base-class accessor that read/wrote `this._value`
        // would mutate state on the prototype (shared across instances) rather than the instance.
        class Base {
            public _value = 0;
            public get value(): number {
                return this._value;
            }
            public set value(v: number) {
                this._value = v;
            }
        }

        class Derived extends Base {}

        const a = new Derived();
        const b = new Derived();

        const afterSet = vi.fn();
        // Intercept on the prototype so both instances are affected by a single hook registration.
        const token = InterceptProperty(Derived.prototype, "value", { afterSet });

        a.value = 7;
        b.value = 42;

        // Per-instance reads must see per-instance state — confirming `this` was forwarded correctly.
        expect(a.value).toBe(7);
        expect(b.value).toBe(42);
        expect(a._value).toBe(7);
        expect(b._value).toBe(42);

        // Hook fires once per write, with the value that was set.
        expect(afterSet).toHaveBeenCalledTimes(2);
        expect(afterSet).toHaveBeenNthCalledWith(1, 7);
        expect(afterSet).toHaveBeenNthCalledWith(2, 42);

        token.dispose();
    });
});
