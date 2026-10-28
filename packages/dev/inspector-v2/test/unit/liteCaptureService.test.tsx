/**
 * @vitest-environment jsdom
 */

import { type EngineContext, type SurfaceContext } from "@babylonjs/lite";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { type IShellService, type SidePaneDefinition } from "shared-ui-components/modularTool/services/shellService";
import { SettingsStoreContext } from "shared-ui-components/modularTool/contexts/settingsContext";
import { type ISettingsStore } from "shared-ui-components/modularTool/services/settingsStore";
import { Observable } from "core/Misc/observable";
import { CaptureServiceDefinition } from "../../src/lite/services/panes/captureService";
import { CaptureController } from "../../src/lite/services/panes/captureController";
import { type IWatcherService } from "../../src/services/watcherService";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    vi.stubGlobal(
        "ResizeObserver",
        class {
            public observe() {}
            public unobserve() {}
            public disconnect() {}
        }
    );
});

vi.mock("@babylonjs/lite", () => ({ captureScreenshot: vi.fn() }));

describe("Babylon Lite capture service", () => {
    it.each([false, true])("captures with the video row hidden=%s, watches surfaces, and releases registrations", (hideVideo) => {
        const hiddenKey = "Babylon/Accordion/Hidden/Lite Tools";
        if (hideVideo) {
            localStorage.setItem(hiddenKey, JSON.stringify(["Lite Tools/Capture/Record Video"]));
        }
        const screenshot = vi.spyOn(CaptureController.prototype, "screenshotAsync").mockResolvedValue();
        let pane!: SidePaneDefinition;
        const unregister = vi.fn();
        const unregisterWatcher = vi.fn();
        const engine = { canvas: document.createElement("canvas") } as EngineContext;
        const surfaces = [engine] as SurfaceContext[];
        Object.assign(engine, { surfaces });
        let snapshot!: () => readonly SurfaceContext[];
        let refresh!: () => void;
        let equal!: (left: readonly SurfaceContext[], right: readonly SurfaceContext[]) => boolean;
        const watcher = {
            watchValue: (get: typeof snapshot, changed: () => void, equals: typeof equal) => {
                snapshot = get;
                refresh = changed;
                equal = equals;
                return { dispose: unregisterWatcher };
            },
        } as IWatcherService;
        const shell = {
            addSidePane: (definition: SidePaneDefinition) => {
                pane = definition;
                return { dispose: unregister };
            },
        } as IShellService;
        const service = CaptureServiceDefinition.factory({ engine }, shell, watcher);
        expect(pane.key).toBe("Tools");
        const initial = snapshot();
        const container = document.createElement("div");
        document.body.appendChild(container);
        const root = createRoot(container);
        const Pane = pane.content;
        const settings: ISettingsStore = {
            readSetting: (descriptor) => descriptor.defaultValue,
            writeSetting: vi.fn(),
            onChanged: new Observable<string>(),
        };
        try {
            act(() =>
                root.render(
                    <FluentProvider theme={webLightTheme}>
                        <SettingsStoreContext.Provider value={settings}>
                            <Pane />
                        </SettingsStoreContext.Provider>
                    </FluentProvider>
                )
            );
            expect(container.textContent).toContain("Primary Surface");
            const record = container.querySelector<HTMLButtonElement>('button[aria-label="Record Video"]');
            if (hideVideo) {
                expect(record).toBeNull();
            } else {
                expect(record?.disabled).toBe(true);
            }
            const capture = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Capture Screenshot")!;
            act(() => capture.click());
            expect(screenshot).toHaveBeenCalledWith(capture.ownerDocument);
            const surface = { canvas: document.createElement("canvas") } as SurfaceContext;
            surfaces.push(surface);
            expect(initial).toHaveLength(1);
            expect(equal(initial, snapshot())).toBe(false);
            act(() => refresh());
        } finally {
            act(() => root.unmount());
            service?.dispose?.();
            container.remove();
            screenshot.mockRestore();
            localStorage.removeItem(hiddenKey);
        }
        expect(unregister).toHaveBeenCalledTimes(1);
        expect(unregisterWatcher).toHaveBeenCalledTimes(1);
    });
});
