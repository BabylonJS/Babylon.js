/**
 * GUI MCP Server – GuiManager Validation Tests
 *
 * Creates GUI layouts via GuiManager, exports them to JSON,
 * validates the JSON structure, and exercises core operations.
 */

import { GuiManager } from "../../src/guiManager";
import { ControlRegistry, BaseControlProperties } from "../../src/catalog";

// ─── Test Helpers ─────────────────────────────────────────────────────────

function validateGuiJSON(json: string, label: string): any {
    let parsed: any;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new Error(`${label}: invalid JSON`);
    }

    expect(parsed.root).toBeDefined();
    expect(parsed.root.name).toBe("root");
    expect(parsed.root.className).toBe("Container");
    expect(Array.isArray(parsed.root.children)).toBe(true);
    expect(typeof parsed.width).toBe("number");
    expect(typeof parsed.height).toBe("number");

    return parsed;
}

function getCtrlName(result: ReturnType<GuiManager["addControl"]>): string {
    if (typeof result === "string") {
        throw new Error(result);
    }
    return result.name;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("GUI MCP Server – GuiManager Validation", () => {
    // ── Test 1: Basic lifecycle ─────────────────────────────────────────

    it("supports create, list, delete lifecycle", () => {
        const mgr = new GuiManager();
        mgr.createTexture("a");
        mgr.createTexture("b");

        const list = mgr.listTextures();
        expect(list).toContain("a");
        expect(list).toContain("b");

        expect(mgr.deleteTexture("a")).toBe(true);
        expect(mgr.listTextures()).not.toContain("a");
        expect(mgr.deleteTexture("nonexistent")).toBe(false);
    });

    // ── Test 2: Create with options ─────────────────────────────────────

    it("creates texture with custom dimensions and fullscreen", () => {
        const mgr = new GuiManager();
        mgr.createTexture("custom", { width: 800, height: 600, isFullscreen: false, idealWidth: 1024 });

        const tex = mgr.getTexture("custom");
        expect(tex).toBeDefined();
        expect(tex!.width).toBe(800);
        expect(tex!.height).toBe(600);
        expect(tex!.isFullscreen).toBe(false);
        expect(tex!.idealWidth).toBe(1024);
    });

    // ── Test 3: Add simple controls ─────────────────────────────────────

    it("adds controls to root and exports valid JSON", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        const textName = getCtrlName(
            mgr.addControl("gui", "TextBlock", "title", "root", {
                text: "Hello World",
                fontSize: "32px",
                color: "white",
            })
        );
        expect(textName).toBe("title");

        const rectName = getCtrlName(
            mgr.addControl("gui", "Rectangle", "panel", "root", {
                background: "#333",
                thickness: 2,
                cornerRadius: 10,
                width: "400px",
                height: "200px",
            })
        );
        expect(rectName).toBe("panel");

        const json = mgr.exportJSON("gui");
        expect(json).not.toBeNull();
        const parsed = validateGuiJSON(json!, "basic controls");
        expect(parsed.root.children.length).toBe(2);

        const textCtrl = parsed.root.children.find((c: any) => c.name === "title");
        expect(textCtrl).toBeDefined();
        expect(textCtrl.className).toBe("TextBlock");
        expect(textCtrl.text).toBe("Hello World");
        expect(textCtrl.fontSize).toBe("32px");
    });

    // ── Test 4: Nested containers ───────────────────────────────────────

    it("supports nested container hierarchy", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "Rectangle", "outer"));
        getCtrlName(mgr.addControl("gui", "StackPanel", "inner", "outer", { isVertical: true }));
        getCtrlName(mgr.addControl("gui", "TextBlock", "label", "inner", { text: "Nested!" }));

        const json = mgr.exportJSON("gui")!;
        const parsed = JSON.parse(json);

        const outer = parsed.root.children[0];
        expect(outer.name).toBe("outer");
        expect(outer.children.length).toBe(1);

        const inner = outer.children[0];
        expect(inner.name).toBe("inner");
        expect(inner.children.length).toBe(1);
        expect(inner.children[0].name).toBe("label");
        expect(inner.children[0].text).toBe("Nested!");
    });

    // ── Test 5: Non-container rejection ─────────────────────────────────

    it("rejects adding children to non-container controls", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "TextBlock", "text"));
        const result = mgr.addControl("gui", "TextBlock", "child", "text");
        expect(typeof result).toBe("string");
        expect(result).toContain("not a container");
    });

    // ── Test 6: Button auto-children ────────────────────────────────────

    it("creates Button with auto-generated TextBlock child", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        const btnName = getCtrlName(
            mgr.addControl("gui", "Button", "myBtn", "root", {
                buttonText: "Click Me",
                background: "#4CAF50",
            })
        );
        expect(btnName).toBe("myBtn");

        const json = mgr.exportJSON("gui")!;
        const parsed = JSON.parse(json);
        const btn = parsed.root.children[0];

        expect(btn.className).toBe("Button");
        expect(btn.background).toBe("#4CAF50");
        expect(btn.children).toBeDefined();
        expect(btn.children.length).toBe(1);
        expect(btn.children[0].className).toBe("TextBlock");
        expect(btn.children[0].text).toBe("Click Me");
    });

    // ── Test 7: Button with image ───────────────────────────────────────

    it("creates Button with both TextBlock and Image children", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(
            mgr.addControl("gui", "Button", "imgBtn", "root", {
                buttonText: "Icon Button",
                buttonImage: "icon.png",
            })
        );

        const json = mgr.exportJSON("gui")!;
        const parsed = JSON.parse(json);
        const btn = parsed.root.children[0];

        expect(btn.children.length).toBe(2);
        const textChild = btn.children.find((c: any) => c.className === "TextBlock");
        const imgChild = btn.children.find((c: any) => c.className === "Image");
        expect(textChild).toBeDefined();
        expect(textChild.text).toBe("Icon Button");
        expect(imgChild).toBeDefined();
        expect(imgChild.source).toBe("icon.png");
    });

    // ── Test 8: Update button text via setControlProperties ─────────────

    it("updates Button text through setControlProperties", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "Button", "btn", "root", { buttonText: "Old" }));
        const result = mgr.setControlProperties("gui", "btn", { buttonText: "New" });
        expect(result).toBe("OK");

        const json = mgr.exportJSON("gui")!;
        const parsed = JSON.parse(json);
        const btn = parsed.root.children[0];
        const textChild = btn.children.find((c: any) => c.className === "TextBlock");
        expect(textChild.text).toBe("New");
    });

    // ── Test 9: Grid with rows, columns, and children ───────────────────

    it("creates a Grid with rows, columns, and placed children", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "Grid", "grid"));
        expect(mgr.addGridRow("gui", "grid", 0.5, false)).toBe("OK");
        expect(mgr.addGridRow("gui", "grid", 0.5, false)).toBe("OK");
        expect(mgr.addGridColumn("gui", "grid", 0.3, false)).toBe("OK");
        expect(mgr.addGridColumn("gui", "grid", 0.7, false)).toBe("OK");

        getCtrlName(mgr.addControl("gui", "TextBlock", "topLeft", "grid", { text: "TL" }, 0, 0));
        getCtrlName(mgr.addControl("gui", "TextBlock", "bottomRight", "grid", { text: "BR" }, 1, 1));

        const json = mgr.exportJSON("gui")!;
        const parsed = JSON.parse(json);
        const grid = parsed.root.children[0];

        expect(grid.className).toBe("Grid");
        expect(grid.rows.length).toBe(2);
        expect(grid.columns.length).toBe(2);
        expect(grid.children.length).toBe(2);

        // Verify tags for cell placement
        expect(grid.tags).toBeDefined();
        expect(grid.tags).toContain("0:0");
        expect(grid.tags).toContain("1:1");
    });

    // ── Test 10: Grid row/column operations ─────────────────────────────

    it("supports set and remove grid row/column operations", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "Grid", "grid"));
        mgr.addGridRow("gui", "grid", 100, true);
        mgr.addGridRow("gui", "grid", 0.5, false);
        mgr.addGridColumn("gui", "grid", 200, true);

        // Set (update) row
        expect(mgr.setGridRow("gui", "grid", 0, 150, true)).toBe("OK");
        const tex = mgr.getTexture("gui")!;
        const grid = tex._controlIndex.get("grid")!;
        expect(grid.rows![0]).toEqual({ value: 150, unit: 1 });

        // Remove column
        expect(mgr.removeGridColumn("gui", "grid", 0)).toBe("OK");
        expect(grid.columns!.length).toBe(0);

        // Out-of-range errors
        expect(mgr.setGridRow("gui", "grid", 99, 1, false)).toContain("out of range");
        expect(mgr.removeGridRow("gui", "grid", 99)).toContain("out of range");
    });

    // ── Test 11: Grid operations on non-Grid ────────────────────────────

    it("rejects grid operations on non-Grid controls", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "Rectangle", "rect"));
        expect(mgr.addGridRow("gui", "rect", 0.5, false)).toContain("not a Grid");
        expect(mgr.addGridColumn("gui", "rect", 0.5, false)).toContain("not a Grid");
    });

    // ── Test 12: Remove control ─────────────────────────────────────────

    it("removes control and cleans up indices", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "Rectangle", "panel"));
        getCtrlName(mgr.addControl("gui", "TextBlock", "label", "panel"));

        expect(mgr.removeControl("gui", "panel")).toBe("OK");

        // Both panel and its child should be gone
        const tex = mgr.getTexture("gui")!;
        expect(tex._controlIndex.has("panel")).toBe(false);
        expect(tex._controlIndex.has("label")).toBe(false);
        expect(tex.root.children!.length).toBe(0);
    });

    // ── Test 13: Cannot remove root ─────────────────────────────────────

    it("prevents removing the root container", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        expect(mgr.removeControl("gui", "root")).toContain("Cannot remove");
    });

    // ── Test 14: Reparent control ───────────────────────────────────────

    it("reparents control between containers", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "Rectangle", "panelA"));
        getCtrlName(mgr.addControl("gui", "Rectangle", "panelB"));
        getCtrlName(mgr.addControl("gui", "TextBlock", "text", "panelA", { text: "hello" }));

        // Move text from panelA to panelB
        expect(mgr.reparentControl("gui", "text", "panelB")).toBe("OK");

        const tex = mgr.getTexture("gui")!;
        const panelA = tex._controlIndex.get("panelA")!;
        const panelB = tex._controlIndex.get("panelB")!;
        expect(panelA.children!.length).toBe(0);
        expect(panelB.children!.length).toBe(1);
        expect(panelB.children![0].name).toBe("text");
    });

    // ── Test 15: Circular reparent detection ────────────────────────────

    it("detects circular reparenting", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "Rectangle", "outer"));
        getCtrlName(mgr.addControl("gui", "Rectangle", "inner", "outer"));

        // Try to move outer inside inner (circular)
        const result = mgr.reparentControl("gui", "outer", "inner");
        expect(typeof result).toBe("string");
        expect(result).toContain("Cannot reparent");
    });

    // ── Test 16: Reparent into Grid with cell placement ─────────────────

    it("reparents control into Grid with cell assignment", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "Grid", "grid"));
        mgr.addGridRow("gui", "grid", 1, false);
        mgr.addGridColumn("gui", "grid", 1, false);
        getCtrlName(mgr.addControl("gui", "TextBlock", "label", "root", { text: "hi" }));

        expect(mgr.reparentControl("gui", "label", "grid", 0, 0)).toBe("OK");

        const tex = mgr.getTexture("gui")!;
        expect(tex._gridCellIndex.get("label")).toBe("0:0");
    });

    // ── Test 17: Duplicate name rejection ───────────────────────────────

    it("rejects duplicate control names", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "TextBlock", "title"));
        const result = mgr.addControl("gui", "TextBlock", "title");
        expect(typeof result).toBe("string");
        expect(result).toContain("already exists");
    });

    // ── Test 18: Auto-generated names ───────────────────────────────────

    it("auto-generates unique control names", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        const name1 = getCtrlName(mgr.addControl("gui", "TextBlock"));
        const name2 = getCtrlName(mgr.addControl("gui", "TextBlock"));
        expect(name1).not.toBe(name2);
        expect(name1).toContain("textblock");
    });

    // ── Test 19: Validation catches issues ──────────────────────────────

    it("validation detects empty GUI warning", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        // Empty GUI
        const issues = mgr.validateTexture("gui");
        expect(issues.some((i) => i.includes("empty"))).toBe(true);
    });

    // ── Test 19b: addControl warns about Button without buttonText ──────

    it("addControl warns when Button created without buttonText", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        const result = mgr.addControl("gui", "Button", "btn");
        expect(typeof result).not.toBe("string");
        const warnings = (result as any).warnings;
        expect(warnings).toBeDefined();
        expect(warnings.some((w: string) => w.includes("no buttonText"))).toBe(true);
    });

    // ── Test 20: Validation passes on good GUI ──────────────────────────

    it("validation passes on a well-formed GUI", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "TextBlock", "title", "root", { text: "Hello" }));
        getCtrlName(mgr.addControl("gui", "Button", "btn", "root", { buttonText: "OK" }));

        const issues = mgr.validateTexture("gui");
        expect(issues.some((i) => i.includes("No issues found"))).toBe(true);
    });

    // ── Test 21: Grid validation warnings ───────────────────────────────

    it("warns about Grid children without row/column definitions", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "Grid", "grid"));
        // Add child without defining rows/columns first
        const result = mgr.addControl("gui", "TextBlock", "label", "grid", { text: "oops" });
        expect(typeof result).not.toBe("string");
        const warnings = (result as any).warnings;
        expect(warnings).toBeDefined();
        expect(warnings.some((w: string) => w.includes("no row definitions"))).toBe(true);
    });

    // ── Test 22: Import/export round-trip ───────────────────────────────

    it("round-trips through import and export", () => {
        const mgr = new GuiManager();
        mgr.createTexture("original");

        getCtrlName(
            mgr.addControl("original", "Rectangle", "panel", "root", {
                background: "#333",
                width: "400px",
            })
        );
        getCtrlName(
            mgr.addControl("original", "TextBlock", "label", "panel", {
                text: "imported",
            })
        );

        const json1 = mgr.exportJSON("original")!;
        expect(mgr.importJSON("copy", json1)).toBe("OK");
        const json2 = mgr.exportJSON("copy")!;

        const parsed1 = JSON.parse(json1);
        const parsed2 = JSON.parse(json2);

        expect(parsed2.root.children.length).toBe(parsed1.root.children.length);
        expect(parsed2.root.children[0].name).toBe("panel");
        expect(parsed2.root.children[0].children[0].text).toBe("imported");
    });

    it("rejects invalid GUI JSON on import", () => {
        const mgr = new GuiManager();

        expect(mgr.importJSON("bad", '{"width":512}')).toContain("Invalid GUI JSON");
        expect(mgr.importJSON("bad", "not json")).toContain("Invalid GUI JSON: parse error.");
    });

    // ── Test 23: Export strips internal properties ──────────────────────

    it("export strips internal _nextId, _controlIndex, etc.", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "TextBlock", "t", "root", { text: "hi" }));
        const json = mgr.exportJSON("gui")!;

        expect(json).not.toContain("_nextId");
        expect(json).not.toContain("_controlIndex");
        expect(json).not.toContain("_parentIndex");
        expect(json).not.toContain("_gridCellIndex");
    });

    // ── Test 24: Control registry completeness ──────────────────────────

    it("control registry has all expected control types", () => {
        const expectedControls = [
            // Containers
            "Container",
            "Rectangle",
            "Ellipse",
            // Layout
            "StackPanel",
            "Grid",
            "ScrollViewer",
            // Text
            "TextBlock",
            // Input
            "InputText",
            "InputPassword",
            "InputTextArea",
            "Slider",
            "ImageBasedSlider",
            // Button
            "Button",
            "FocusableButton",
            "ToggleButton",
            // Indicator
            "Checkbox",
            "RadioButton",
            "ColorPicker",
            // Image
            "Image",
            // Shape
            "Line",
            // Misc
            "DisplayGrid",
            "VirtualKeyboard",
        ];

        for (const controlType of expectedControls) {
            expect(ControlRegistry[controlType]).toBeDefined();
            expect(ControlRegistry[controlType].className).toBe(controlType);
        }
    });

    // ── Test 25: Base properties are documented ─────────────────────────

    it("base properties cover essential control attributes", () => {
        const essentialProps = [
            "width",
            "height",
            "left",
            "top",
            "horizontalAlignment",
            "verticalAlignment",
            "color",
            "alpha",
            "isVisible",
            "fontSize",
            "fontFamily",
            "isEnabled",
            "rotation",
        ];

        for (const prop of essentialProps) {
            expect(BaseControlProperties[prop]).toBeDefined();
        }
    });

    // ── Test 26: Unknown control type rejection ─────────────────────────

    it("rejects unknown control types", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        const result = mgr.addControl("gui", "FancyWidget", "w");
        expect(typeof result).toBe("string");
        expect(result).toContain("Unknown control type");
    });

    // ── Test 27: Missing texture error ──────────────────────────────────

    it("returns errors when texture not found", () => {
        const mgr = new GuiManager();

        expect(typeof mgr.addControl("nope", "TextBlock")).toBe("string");
        expect(mgr.setControlProperties("nope", "x", {})).toContain("not found");
        expect(mgr.removeControl("nope", "x")).toContain("not found");
        expect(mgr.addGridRow("nope", "g", 1, false)).toContain("not found");
        expect(mgr.exportJSON("nope")).toBeNull();
        expect(mgr.validateTexture("nope")[0]).toContain("not found");
    });

    // ── Test 28: Describe functions ─────────────────────────────────────

    it("describe functions return useful information", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "Rectangle", "panel", "root", { background: "blue" }));
        getCtrlName(mgr.addControl("gui", "TextBlock", "label", "panel", { text: "hi" }));

        const texDesc = mgr.describeTexture("gui");
        expect(texDesc).toContain("panel");
        expect(texDesc).toContain("label");
        expect(texDesc).toContain("1920"); // Default width

        const ctrlDesc = mgr.describeControl("gui", "panel");
        expect(ctrlDesc).toContain("Rectangle");
        expect(ctrlDesc).toContain("blue");
        expect(ctrlDesc).toContain("label"); // Child listed
    });

    // ── Test 29: StackPanel isVertical ──────────────────────────────────

    it("StackPanel correctly stores isVertical property", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "StackPanel", "stack", "root", { isVertical: true }));
        getCtrlName(mgr.addControl("gui", "TextBlock", "a", "stack", { text: "A" }));
        getCtrlName(mgr.addControl("gui", "TextBlock", "b", "stack", { text: "B" }));

        const json = mgr.exportJSON("gui")!;
        const parsed = JSON.parse(json);
        const stack = parsed.root.children[0];
        expect(stack.isVertical).toBe(true);
        expect(stack.children.length).toBe(2);
    });

    // ── Test 30: Slider properties ──────────────────────────────────────

    it("Slider stores min/max/value/step correctly", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(
            mgr.addControl("gui", "Slider", "vol", "root", {
                minimum: 0,
                maximum: 100,
                value: 75,
                step: 1,
                width: "300px",
                height: "30px",
            })
        );

        const json = mgr.exportJSON("gui")!;
        const parsed = JSON.parse(json);
        const slider = parsed.root.children[0];
        expect(slider.minimum).toBe(0);
        expect(slider.maximum).toBe(100);
        expect(slider.value).toBe(75);
        expect(slider.step).toBe(1);
    });

    // ── Test 31: Checkbox and RadioButton ────────────────────────────────

    it("Checkbox and RadioButton store isChecked properly", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(
            mgr.addControl("gui", "Checkbox", "cb", "root", {
                isChecked: true,
                checkSizeRatio: 0.7,
                width: "20px",
                height: "20px",
            })
        );

        getCtrlName(
            mgr.addControl("gui", "RadioButton", "rb", "root", {
                isChecked: false,
                group: "options",
                width: "20px",
                height: "20px",
            })
        );

        const json = mgr.exportJSON("gui")!;
        const parsed = JSON.parse(json);
        const cb = parsed.root.children.find((c: any) => c.name === "cb");
        const rb = parsed.root.children.find((c: any) => c.name === "rb");

        expect(cb.isChecked).toBe(true);
        expect(cb.checkSizeRatio).toBe(0.7);
        expect(rb.isChecked).toBe(false);
        expect(rb.group).toBe("options");
    });

    // ── Test 32: Image control ──────────────────────────────────────────

    it("Image stores source and stretch properties", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(
            mgr.addControl("gui", "Image", "img", "root", {
                source: "https://example.com/logo.png",
                stretch: 2, // STRETCH_UNIFORM
                width: "200px",
                height: "200px",
            })
        );

        const json = mgr.exportJSON("gui")!;
        const parsed = JSON.parse(json);
        const img = parsed.root.children[0];
        expect(img.source).toBe("https://example.com/logo.png");
        expect(img.stretch).toBe(2);
    });

    // ── Test 33: InputText properties ───────────────────────────────────

    it("InputText stores placeholder and text properties", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(
            mgr.addControl("gui", "InputText", "nameField", "root", {
                text: "",
                placeholderText: "Enter name...",
                placeholderColor: "#999",
                maxWidth: "300px",
                width: "300px",
                height: "40px",
            })
        );

        const json = mgr.exportJSON("gui")!;
        const parsed = JSON.parse(json);
        const input = parsed.root.children[0];
        expect(input.placeholderText).toBe("Enter name...");
        expect(input.placeholderColor).toBe("#999");
    });

    // ── Test 34: ScrollViewer is a container ────────────────────────────

    it("ScrollViewer acts as a container", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gui");

        getCtrlName(mgr.addControl("gui", "ScrollViewer", "scroller", "root"));
        getCtrlName(mgr.addControl("gui", "TextBlock", "content", "scroller", { text: "scroll me" }));

        const json = mgr.exportJSON("gui")!;
        const parsed = JSON.parse(json);
        const sv = parsed.root.children[0];
        expect(sv.className).toBe("ScrollViewer");
        expect(sv.children.length).toBe(1);
    });

    // ── Test 35: Complex GUI export structure ───────────────────────────

    it("complex GUI with Grid, StackPanel, buttons exports correctly", () => {
        const mgr = new GuiManager();
        mgr.createTexture("hud");

        // Grid-based layout
        getCtrlName(mgr.addControl("hud", "Grid", "mainGrid"));
        mgr.addGridRow("hud", "mainGrid", 50, true); // header
        mgr.addGridRow("hud", "mainGrid", 1, false); // body
        mgr.addGridRow("hud", "mainGrid", 40, true); // footer
        mgr.addGridColumn("hud", "mainGrid", 0.3, false);
        mgr.addGridColumn("hud", "mainGrid", 0.7, false);

        // Header
        getCtrlName(
            mgr.addControl(
                "hud",
                "TextBlock",
                "title",
                "mainGrid",
                {
                    text: "Game HUD",
                    fontSize: "24px",
                },
                0,
                0
            )
        );

        // Body - stack panel
        getCtrlName(
            mgr.addControl(
                "hud",
                "StackPanel",
                "sidebar",
                "mainGrid",
                {
                    isVertical: true,
                },
                1,
                0
            )
        );

        getCtrlName(mgr.addControl("hud", "TextBlock", "hp", "sidebar", { text: "HP: 100" }));
        getCtrlName(
            mgr.addControl("hud", "Slider", "hpBar", "sidebar", {
                minimum: 0,
                maximum: 100,
                value: 100,
                height: "20px",
            })
        );

        // Footer button
        getCtrlName(
            mgr.addControl(
                "hud",
                "Button",
                "menuBtn",
                "mainGrid",
                {
                    buttonText: "Menu",
                },
                2,
                0
            )
        );

        const json = mgr.exportJSON("hud")!;
        const parsed = validateGuiJSON(json, "complex HUD");

        const grid = parsed.root.children[0];
        expect(grid.className).toBe("Grid");
        expect(grid.rows.length).toBe(3);
        expect(grid.columns.length).toBe(2);
        expect(grid.children.length).toBe(3); // title, sidebar, menuBtn

        // Validate the issues
        const issues = mgr.validateTexture("hud");
        expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);
    });

    // ── clearAll ────────────────────────────────────────────────────────

    it("clearAll removes all textures and resets state", () => {
        const mgr = new GuiManager();
        mgr.createTexture("a");
        mgr.createTexture("b");
        expect(mgr.listTextures().length).toBe(2);

        mgr.clearAll();
        expect(mgr.listTextures()).toEqual([]);
        expect(mgr.getTexture("a")).toBeUndefined();
        expect(mgr.getTexture("b")).toBeUndefined();

        // Can create new textures after clear
        mgr.createTexture("c");
        expect(mgr.listTextures()).toEqual(["c"]);
    });

    it("clearAll on empty manager is a no-op", () => {
        const mgr = new GuiManager();
        mgr.clearAll();
        expect(mgr.listTextures()).toEqual([]);
    });
});
