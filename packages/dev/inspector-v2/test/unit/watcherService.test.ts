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

    it("updates existing property watchers when the watch mode changes", () => {
        vi.useFakeTimers();
        const settingsStore = new TestSettingsStore();
        const definitions = MakeWatcherServiceDefinitions({
            defaultSettings: { mode: "manual" },
        });
        const watcher = definitions.watcherServiceDefinition.factory(settingsStore, new TestReactContextService());
        const settingsDescriptor: SettingDescriptor<{ mode: "intercept" } | { mode: "polling"; interval: number } | { mode: "manual" }> = {
            key: "WatcherSettings",
            defaultValue: { mode: "manual" },
        };
        const target = { value: 0 };
        const onChanged = vi.fn();
        const secondOnChanged = vi.fn();
        const registration = watcher.watchProperty(target, "value", onChanged);
        const secondRegistration = watcher.watchProperty(target, "value", secondOnChanged);

        target.value = 1;
        expect(onChanged).not.toHaveBeenCalled();
        expect(secondOnChanged).not.toHaveBeenCalled();
        watcher.refresh();
        expect(onChanged).toHaveBeenLastCalledWith(1);
        expect(secondOnChanged).toHaveBeenLastCalledWith(1);

        settingsStore.writeSetting(settingsDescriptor, { mode: "polling", interval: 100 });
        target.value = 2;
        vi.advanceTimersByTime(99);
        expect(onChanged).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(1);
        expect(onChanged).toHaveBeenLastCalledWith(2);
        expect(secondOnChanged).toHaveBeenLastCalledWith(2);

        settingsStore.writeSetting(settingsDescriptor, { mode: "intercept" });
        target.value = 3;
        expect(onChanged).toHaveBeenLastCalledWith(3);
        expect(secondOnChanged).toHaveBeenLastCalledWith(3);
        expect(vi.getTimerCount()).toBe(0);

        settingsStore.writeSetting(settingsDescriptor, { mode: "manual" });
        target.value = 4;
        expect(onChanged).toHaveBeenCalledTimes(3);
        expect(secondOnChanged).toHaveBeenCalledTimes(3);
        watcher.refresh();
        expect(onChanged).toHaveBeenLastCalledWith(4);
        expect(secondOnChanged).toHaveBeenLastCalledWith(4);

        watcher.dispose?.();
        target.value = 5;
        expect(onChanged).toHaveBeenCalledTimes(4);
        expect(secondOnChanged).toHaveBeenCalledTimes(4);
        registration.dispose();
        secondRegistration.dispose();
    });
});
