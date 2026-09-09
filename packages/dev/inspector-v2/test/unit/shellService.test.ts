import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

import { Observable } from "core/Misc/observable";
import { SettingsStoreContext } from "shared-ui-components/modularTool/contexts/settingsContext";
import { type ISettingsStore, type SettingDescriptor } from "shared-ui-components/modularTool/services/settingsStore";
import { MakeShellServiceDefinition } from "shared-ui-components/modularTool/services/shellService";

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

describe("ShellService", () => {
    afterAll(() => {
        vi.unstubAllGlobals();
    });

    it("renders compact shell controls for a single pane without toolbar items", () => {
        const shellService = MakeShellServiceDefinition({ toolbarMode: "compact" }).factory();
        shellService.addSidePane({
            key: "Explorer",
            title: "Explorer",
            icon: () => null,
            content: () => null,
            horizontalLocation: "left",
            verticalLocation: "top",
        });

        const markup = renderToStaticMarkup(createElement(SettingsStoreContext.Provider, { value: new TestSettingsStore() }, createElement(shellService.rootComponent)));

        expect(markup).toContain("fui-SplitButton");
    });
});
