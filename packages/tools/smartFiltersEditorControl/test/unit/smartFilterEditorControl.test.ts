/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SmartFilter } from "smart-filters";
import { SmartFilterEditorControl } from "../../src/smartFilterEditorControl.js";

vi.mock("react-dom", () => ({ render: vi.fn() }));
vi.mock("../../src/graphEditor.js", () => ({ GraphEditor: () => null }));
vi.mock("../../src/graphSystem/registerToDisplayLedger.js", () => ({ RegisterToDisplayManagers: vi.fn() }));
vi.mock("../../src/graphSystem/registerToPropertyLedger.js", () => ({ RegisterToPropertyTabManagers: vi.fn() }));
vi.mock("../../src/graphSystem/registerToTypeLedger.js", () => ({ RegisterTypeLedger: vi.fn() }));

describe("SmartFilterEditorControl popup lifecycle", () => {
    let iframe: HTMLIFrameElement;
    let popupWindow: Window;
    let originalBeforeUnload: typeof window.onbeforeunload;

    beforeEach(() => {
        vi.useFakeTimers();
        originalBeforeUnload = window.onbeforeunload;
        iframe = document.createElement("iframe");
        document.body.appendChild(iframe);
        popupWindow = iframe.contentWindow!;
        vi.spyOn(window, "open").mockReturnValue(popupWindow);
        vi.spyOn(popupWindow, "close").mockImplementation(() => {
            popupWindow.dispatchEvent(new Event("beforeunload"));
        });
    });

    afterEach(() => {
        SmartFilterEditorControl.Hide();
        vi.runOnlyPendingTimers();
        window.onbeforeunload = originalBeforeUnload;
        iframe.remove();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("preserves and executes the host unload handler when opened without an engine", () => {
        const hostBeforeUnload = vi.fn();
        window.onbeforeunload = hostBeforeUnload;

        SmartFilterEditorControl.Show({ filter: new SmartFilter("Host filter") });

        expect(window.onbeforeunload).toBe(hostBeforeUnload);

        window.dispatchEvent(new Event("beforeunload"));

        expect(hostBeforeUnload).toHaveBeenCalledOnce();
        expect(popupWindow.close).toHaveBeenCalledOnce();
    });

    it("removes the host cleanup listener when the popup closes", () => {
        const removeEventListener = vi.spyOn(window, "removeEventListener");
        SmartFilterEditorControl.Show({ filter: new SmartFilter("Host filter") });

        SmartFilterEditorControl.Hide();

        expect(removeEventListener).toHaveBeenCalledWith("beforeunload", expect.any(Function));
        vi.mocked(popupWindow.close).mockClear();

        window.dispatchEvent(new Event("beforeunload"));

        expect(popupWindow.close).not.toHaveBeenCalled();
    });
});
