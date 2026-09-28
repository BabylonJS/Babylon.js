import { describe, expect, it, vi } from "vitest";

import { ObservableCollection } from "../../../src/modularTool/misc/observableCollection";

describe("ObservableCollection", () => {
    it("owns its registrations and rejects additions after disposal", () => {
        const collection = new ObservableCollection<object>();
        const onChanged = vi.fn();
        collection.observable.add(onChanged);
        const first = {};
        const second = {};
        const firstRegistration = collection.add(first);
        const secondRegistration = collection.add(second);

        firstRegistration.dispose();
        firstRegistration.dispose();
        expect(collection.items).toEqual([second]);

        collection.dispose();
        collection.dispose();
        secondRegistration.dispose();
        expect(collection.items).toEqual([]);
        expect(onChanged).toHaveBeenCalledTimes(4);
        expect(() => collection.add({})).toThrow("Observable collection is disposed.");
    });
});
