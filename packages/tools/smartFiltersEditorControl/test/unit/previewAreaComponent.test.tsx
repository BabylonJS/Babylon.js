/**
 * @vitest-environment jsdom
 */

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Observable } from "core/Misc/observable.js";
import { PreviewAreaComponent } from "../../src/components/preview/previewAreaComponent.js";
import { FixedMode } from "../../src/previewSizeManager.js";
import { type GlobalState } from "../../src/globalState.js";

describe("PreviewAreaComponent", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);

        vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
        vi.stubGlobal(
            "ResizeObserver",
            class {
                public observe() {}
                public unobserve() {}
            }
        );
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    it.each(["black", "white"])("replaces the %s preview background with the grid outside the WebGL canvas", (solidBackground) => {
        const onPreviewResetRequiredObservable = new Observable<void>();
        const globalState = {
            previewBackground: solidBackground,
            previewSizeManager: {
                mode: { value: FixedMode, onChangedObservable: new Observable<string>() },
                fixedWidth: { value: 400, onChangedObservable: new Observable<number>() },
                fixedHeight: { value: 300, onChangedObservable: new Observable<number>() },
                aspectRatio: { value: "1.33333", onChangedObservable: new Observable<string>() },
            },
            onResetRequiredObservable: new Observable<boolean>(),
            onPreviewResetRequiredObservable,
            smartFilter: {},
            engine: null,
        } as unknown as GlobalState;

        act(() => root.render(<PreviewAreaComponent globalState={globalState} allowPreviewFillMode={false} />));

        const canvas = container.querySelector("#sfe-preview-canvas");
        const background = container.querySelector("#sfe-preview-background");

        expect(background).not.toBeNull();
        expect(background?.classList.contains(`preview-background-${solidBackground}`)).toBe(true);
        expect((background as HTMLElement).style.width).toBe("400px");
        expect((background as HTMLElement).style.height).toBe("300px");
        expect(canvas?.parentElement).toBe(background);
        expect(canvas?.className).not.toContain("preview-background-");
        expect((canvas as HTMLElement).style.display).toBe("block");
        expect((canvas as HTMLElement).style.width).toBe("100%");
        expect((canvas as HTMLElement).style.height).toBe("100%");

        act(() => {
            globalState.previewBackground = "grid";
            onPreviewResetRequiredObservable.notifyObservers();
        });

        expect(background?.classList.contains("preview-background-grid")).toBe(true);
    });
});
