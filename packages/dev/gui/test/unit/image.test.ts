/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tools } from "core/Misc/tools.pure";
import { Image } from "../../src/2D/controls/image";

describe("Image SVG sources", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        document.body.innerHTML = "";
    });

    it("measures SVG sprite sheets in a script-disabled frame after sanitizing them", async () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10 10" width="10" height="10" onload="alert(1)">' +
            '<script>alert(2)</script><s:script xmlns:s="http://www.w3.org/2000/svg">alert(4)</s:script><symbol id="shape"><rect width="1" height="1"/></symbol>' +
            '<use id="logo" href="#shape"/><a xlink:href="javascript:alert(3)"><rect id="link"/></a><image href="data:text/html,x"/></svg>';
        vi.spyOn(Tools, "LoadFile").mockImplementation((_url, onSuccess) => {
            onSuccess(svg);
            return {} as any;
        });
        let sanitizedBlob: Blob | undefined;
        vi.stubGlobal("URL", {
            createObjectURL: (blob: Blob) => {
                sanitizedBlob = blob;
                return "blob:sanitized";
            },
            revokeObjectURL: () => {},
        });

        const image = new Image("image");
        image.source = "/icons.svg#logo";

        expect(Tools.LoadFile).toHaveBeenCalledWith("/icons.svg", expect.any(Function), undefined, undefined, false, expect.any(Function));
        const svgFrame = document.body.querySelector("iframe")!;
        expect(svgFrame.getAttribute("sandbox")?.split(" ")).not.toContain("allow-scripts");
        expect(svgFrame.getAttribute("src")).toBe("blob:sanitized");

        const sanitized = await sanitizedBlob!.text();
        expect(sanitized).not.toContain("onload");
        expect(sanitized).not.toContain("script");
        expect(sanitized).not.toContain("javascript:");
        expect(sanitized).not.toContain("data:text/html");
        expect(sanitized).toContain('href="#shape"');
    });
});
