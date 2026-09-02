import { type Context } from "react";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import { Observable } from "core/Misc/observable";
import { type IReactContextService, type ReactContextHandle } from "shared-ui-components/modularTool/services/reactContextService";
import { type ISettingsStore, type SettingDescriptor } from "shared-ui-components/modularTool/services/settingsStore";
import { MakeWatcherServiceDefinitions } from "../../src/services/watcherService";

vi.hoisted(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

class TestSettingsStore implements ISettingsStore {
    private readonly _onChanged = new Observable<string>();
    private readonly _values = new Map<string, unknown>();

    public get onChanged() {
        return this._onChanged;
    }

    public readSetting<T>(descriptor: SettingDescriptor<T>): T {
        return this._values.has(descriptor.key) ? (this._values.get(descriptor.key) as T) : descriptor.defaultValue;
    }

    public writeSetting<T>(descriptor: SettingDescriptor<T>, value: T): void {
        this._values.set(descriptor.key, value);
        this._onChanged.notifyObservers(descriptor.key);
    }
}

class TestReactContextService implements IReactContextService {
    public addContext<T>(_provider: Context<T>["Provider"], _initialValue: T): ReactContextHandle<T> {
        return {
            updateValue: () => {
                // No-op for service tests.
            },
            dispose: () => {
                // No-op for service tests.
            },
        };
    }
}

describe("WatcherService", () => {
    afterAll(() => {
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("watches computed values while polling", () => {
        vi.useFakeTimers();
        const definitions = MakeWatcherServiceDefinitions({
            defaultSettings: { mode: "polling", interval: 100 },
            supportedModes: ["polling", "manual"],
        });
        const watcher = definitions.watcherServiceDefinition.factory(new TestSettingsStore(), new TestReactContextService());
        let value = 0;
        const onChanged = vi.fn();
        const registration = watcher.watchValue(() => value, onChanged);

        value = 1;
        vi.advanceTimersByTime(99);
        expect(onChanged).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onChanged).toHaveBeenCalledExactlyOnceWith(1);

        registration.dispose();
        watcher.dispose?.();
    });

    it("watches computed values during manual refresh", () => {
        const definitions = MakeWatcherServiceDefinitions({
            defaultSettings: { mode: "manual" },
            supportedModes: ["polling", "manual"],
        });
        const watcher = definitions.watcherServiceDefinition.factory(new TestSettingsStore(), new TestReactContextService());
        let value = 0;
        const onChanged = vi.fn();
        const registration = watcher.watchValue(() => value, onChanged);

        value = 1;
        expect(onChanged).not.toHaveBeenCalled();

        watcher.refresh();
        expect(onChanged).toHaveBeenCalledExactlyOnceWith(1);

        registration.dispose();
        watcher.dispose?.();
    });
});
