/**
 * GUI MCP Server – Babylon.js Parse Validation
 *
 * Tests that JSON produced by the GUI MCP server can be parsed by Babylon.js's
 * AdvancedDynamicTexture.parseSerializedObject() without errors. This proves
 * the exported JSON structure is fully compatible with the Babylon.js GUI runtime.
 */

// Polyfill OffscreenCanvas for Node.js (used by AbstractEngine._CreateCanvas)
if (typeof globalThis.OffscreenCanvas === "undefined") {
    (globalThis as any).OffscreenCanvas = class OffscreenCanvas {
        width: number;
        height: number;
        constructor(w: number, h: number) {
            this.width = w;
            this.height = h;
        }
        getContext() {
            return {
                fillRect: () => {},
                clearRect: () => {},
                getImageData: () => ({ data: new Uint8Array(0) }),
                putImageData: () => {},
                measureText: () => ({ width: 0 }),
                fillText: () => {},
                strokeText: () => {},
                setTransform: () => {},
                drawImage: () => {},
                save: () => {},
                restore: () => {},
                beginPath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                closePath: () => {},
                stroke: () => {},
                fill: () => {},
                translate: () => {},
                scale: () => {},
                rotate: () => {},
                arc: () => {},
                rect: () => {},
                clip: () => {},
                canvas: { width: 256, height: 256 },
                lineWidth: 1,
                strokeStyle: "",
                fillStyle: "",
                font: "",
                textAlign: "",
                textBaseline: "",
                globalAlpha: 1,
            };
        }
        toBlob() {}
        toDataURL() {
            return "";
        }
    };
}

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";

// Side-effect imports: register ALL GUI control types via RegisterClass
import "gui/2D/controls/index";

import { GuiManager } from "../../src/guiManager";

function getCtrlName(result: ReturnType<GuiManager["addControl"]>): string {
    if (typeof result === "string") {
        throw new Error(result);
    }
    return result.name;
}

describe("GUI MCP Server – Babylon.js Parse", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // ── Helper: Build a GUI, export, and parse with Babylon.js ──────────

    function buildAndParse(name: string, builder: (mgr: GuiManager) => void): AdvancedDynamicTexture {
        const mgr = new GuiManager();
        mgr.createTexture(name);
        builder(mgr);

        const json = mgr.exportJSON(name);
        expect(json).not.toBeNull();

        const parsed = JSON.parse(json!);
        const adt = AdvancedDynamicTexture.CreateFullscreenUI(name, true, scene);
        adt.parseSerializedObject(parsed, true);
        return adt;
    }

    // ── Test 1: Simple TextBlock ────────────────────────────────────────

    it("parses a simple TextBlock layout", () => {
        const adt = buildAndParse("simple", (mgr) => {
            getCtrlName(
                mgr.addControl("simple", "TextBlock", "title", "root", {
                    text: "Hello Babylon",
                    color: "white",
                    fontSize: "32px",
                })
            );
        });

        const root = adt.getChildren()[0];
        expect(root).toBeDefined();
        expect(root.name).toBe("root");

        // root is a Container, so get its children
        const children = (root as any).children;
        expect(children.length).toBe(1);
        expect(children[0].name).toBe("title");
        expect(children[0].typeName).toBe("TextBlock");

        adt.dispose();
    });

    // ── Test 2: Nested container hierarchy ──────────────────────────────

    it("parses nested Rectangle > StackPanel > TextBlock", () => {
        const adt = buildAndParse("nested", (mgr) => {
            getCtrlName(mgr.addControl("nested", "Rectangle", "panel"));
            getCtrlName(mgr.addControl("nested", "StackPanel", "stack", "panel", { isVertical: true }));
            getCtrlName(mgr.addControl("nested", "TextBlock", "label", "stack", { text: "Nested!" }));
        });

        const root = adt.getChildren()[0] as any;
        const panel = root.children[0];
        expect(panel.name).toBe("panel");
        expect(panel.typeName).toBe("Rectangle");

        const stack = panel.children[0];
        expect(stack.name).toBe("stack");

        const label = stack.children[0];
        expect(label.name).toBe("label");
        expect(label.typeName).toBe("TextBlock");

        adt.dispose();
    });

    // ── Test 3: Button with TextBlock child ─────────────────────────────

    it("parses Button with auto-created TextBlock child", () => {
        const adt = buildAndParse("btn", (mgr) => {
            getCtrlName(
                mgr.addControl("btn", "Button", "myBtn", "root", {
                    buttonText: "Click Me",
                    background: "#4CAF50",
                })
            );
        });

        const root = adt.getChildren()[0] as any;
        const btn = root.children[0];
        expect(btn.name).toBe("myBtn");
        expect(btn.typeName).toBe("Button");

        const textChild = btn.children[0];
        expect(textChild).toBeDefined();
        expect(textChild.typeName).toBe("TextBlock");

        adt.dispose();
    });

    // ── Test 4: Grid with rows, columns, and placed controls ────────────

    it("parses Grid with rows, columns, and cell placement", () => {
        const adt = buildAndParse("grid", (mgr) => {
            getCtrlName(mgr.addControl("grid", "Grid", "mainGrid"));
            mgr.addGridRow("grid", "mainGrid", 0.5, false);
            mgr.addGridRow("grid", "mainGrid", 0.5, false);
            mgr.addGridColumn("grid", "mainGrid", 0.5, false);
            mgr.addGridColumn("grid", "mainGrid", 0.5, false);

            getCtrlName(mgr.addControl("grid", "TextBlock", "topLeft", "mainGrid", { text: "TL" }, 0, 0));
            getCtrlName(mgr.addControl("grid", "TextBlock", "bottomRight", "mainGrid", { text: "BR" }, 1, 1));
        });

        const root = adt.getChildren()[0] as any;
        const grid = root.children[0];
        expect(grid.name).toBe("mainGrid");
        expect(grid.typeName).toBe("Grid");

        // Grid should have parsed rows and columns
        expect(grid.rowCount).toBe(2);
        expect(grid.columnCount).toBe(2);

        // Controls should be in the grid
        expect(grid.children.length).toBe(2);

        adt.dispose();
    });

    // ── Test 5: Complex Settings Dialog ─────────────────────────────────

    it("parses a complex settings dialog with multiple control types", () => {
        const adt = buildAndParse("settings", (mgr) => {
            // Overlay
            getCtrlName(
                mgr.addControl("settings", "Rectangle", "overlay", "root", {
                    width: "1",
                    height: "1",
                    background: "rgba(0,0,0,0.7)",
                    thickness: 0,
                })
            );

            // Dialog panel
            getCtrlName(
                mgr.addControl("settings", "Rectangle", "dialog", "overlay", {
                    width: "500px",
                    height: "600px",
                    background: "#2D2D2D",
                    cornerRadius: 15,
                })
            );

            // Title
            getCtrlName(
                mgr.addControl("settings", "TextBlock", "title", "dialog", {
                    text: "Settings",
                    color: "white",
                    fontSize: "24px",
                })
            );

            // Stack with slider and checkbox
            getCtrlName(
                mgr.addControl("settings", "StackPanel", "options", "dialog", {
                    isVertical: true,
                    width: "400px",
                })
            );

            getCtrlName(
                mgr.addControl("settings", "Slider", "volSlider", "options", {
                    minimum: 0,
                    maximum: 100,
                    value: 75,
                    height: "30px",
                })
            );

            getCtrlName(
                mgr.addControl("settings", "Checkbox", "fsCb", "options", {
                    isChecked: false,
                    width: "20px",
                    height: "20px",
                })
            );

            // Button
            getCtrlName(
                mgr.addControl("settings", "Button", "okBtn", "dialog", {
                    buttonText: "OK",
                    width: "120px",
                    height: "40px",
                })
            );
        });

        const root = adt.getChildren()[0] as any;
        expect(root.name).toBe("root");

        // Traverse: root > overlay > dialog > [title, options, okBtn]
        const overlay = root.children[0];
        expect(overlay.typeName).toBe("Rectangle");

        const dialog = overlay.children[0];
        expect(dialog.typeName).toBe("Rectangle");
        expect(dialog.children.length).toBe(3); // title, options, okBtn

        // Verify the slider was parsed with correct value
        const options = dialog.children[1];
        const slider = options.children[0];
        expect(slider.typeName).toBe("Slider");
        expect(slider.value).toBe(75);

        const checkbox = options.children[1];
        expect(checkbox.typeName).toBe("Checkbox");

        adt.dispose();
    });
});
