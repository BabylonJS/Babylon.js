/**
 * @vitest-environment jsdom
 */

import { GetFontOffset } from "core/Engines/engine.common";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("GetFontOffset", () => {
    const originalOffscreenCanvas = globalThis.OffscreenCanvas;

    afterEach(() => {
        vi.restoreAllMocks();
        Object.defineProperty(globalThis, "OffscreenCanvas", {
            configurable: true,
            writable: true,
            value: originalOffscreenCanvas,
        });
    });

    it("falls back to canvas text metrics when DOM layout reports zero font bounds", () => {
        Object.defineProperty(globalThis, "OffscreenCanvas", {
            configurable: true,
            writable: true,
            value: undefined,
        });

        const createElement = document.createElement.bind(document);
        vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
            if (tagName.toLowerCase() === "canvas") {
                return {
                    width: 0,
                    height: 0,
                    getContext: () => ({
                        font: "",
                        measureText: () => ({
                            fontBoundingBoxAscent: 17,
                            fontBoundingBoxDescent: 5,
                        }),
                    }),
                } as unknown as HTMLElement;
            }

            const element = createElement(tagName);
            vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
                x: 0,
                y: 0,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: 0,
                height: 0,
                toJSON: () => ({}),
            });
            return element;
        }) as typeof document.createElement);

        expect(GetFontOffset("24px droidsans")).toEqual({
            ascent: 17,
            height: 22,
            descent: 5,
        });
    });
});
