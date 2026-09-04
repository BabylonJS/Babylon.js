import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlexPanel } from "../../src/2D/controls/flexPanel";
import { Control } from "../../src/2D/controls/control";
import { Container } from "../../src/2D/controls/container";
import { Measure } from "../../src/2D/measure";
import { InputText } from "../../src/2D/controls/inputText";
import { InputTextArea } from "../../src/2D/controls/inputTextArea";
import { MultiLine } from "../../src/2D/controls/multiLine";
import { TextBlock } from "../../src/2D/controls/textBlock";
import { StackPanel } from "../../src/2D/controls/stackPanel";
import { ValueAndUnit } from "../../src/2D/valueAndUnit";
import { type AdvancedDynamicTexture } from "../../src/2D/advancedDynamicTexture";
import { type ICanvasRenderingContext } from "core/Engines/ICanvas";

const context = {
    save() {},
    restore() {},
    measureText(text: string) {
        return { width: text.length * 10 };
    },
} as ICanvasRenderingContext;
function setup(width = 300, height = 100) {
    const root = new Container("root");
    let id = 0;
    const host = {
        rootContainer: root,
        _canvas: { width, height },
        _linkedControls: [],
        _cleanControlAfterRemoval() {},
        idealRatio: 1,
        idealWidth: 0,
        idealHeight: 0,
        getSize: () => ({ width, height }),
        getScene: () => ({ getUniqueId: () => ++id, getEngine: () => undefined }),
        markAsDirty() {},
        _numLayoutCalls: 0,
    } as unknown as AdvancedDynamicTexture;
    root._link(host);
    const panel = new FlexPanel("panel");
    root.addControl(panel);
    const layout = (w = width, h = height) => root._layout(new Measure(0, 0, w, h), context);
    return { root, panel, host, layout };
}
function item(width: string | number = "100px", height: string | number = "20px") {
    const child = new Control();
    child.width = width;
    child.height = height;
    return child;
}
beforeEach(() => {
    vi.spyOn(Control, "_GetFontOffset").mockReturnValue({ ascent: 14, height: 18, descent: 4 });
});

describe("FlexPanel", () => {
    it("distributes free space without changing declared dimensions", () => {
        const { panel, layout } = setup();
        const a = item(),
            b = item();
        a.flexGrow = 1;
        b.flexGrow = 2;
        panel.addControl(a).addControl(b);
        layout();
        expect(a._currentMeasure.width).toBeCloseTo(400 / 3);
        expect(b._currentMeasure.width).toBeCloseTo(500 / 3);
        expect(b._currentMeasure.left).toBeCloseTo(400 / 3);
        expect(a.width).toBe("100px");
        layout(600);
        expect(a._currentMeasure.width).toBeCloseTo(700 / 3);
        expect(b._currentMeasure.width).toBeCloseTo(1100 / 3);
    });
    it("shrinks according to the declared basis and shrink factor", () => {
        const { panel, layout } = setup(150);
        const a = item("100px"),
            b = item("200px");
        panel.addControl(a).addControl(b);
        layout();
        expect(a._currentMeasure.width).toBeCloseTo(50);
        expect(b._currentMeasure.width).toBeCloseTo(100);
    });
    it("wraps at the available width, with gaps and hidden children excluded", () => {
        const { panel, layout } = setup(220, 100);
        panel.flexWrap = "wrap";
        panel.gap = "10px";
        panel.alignContent = "flex-start";
        const a = item(),
            hidden = item(),
            b = item(),
            c = item();
        hidden.isVisible = false;
        panel.addControl(a).addControl(hidden).addControl(b).addControl(c);
        layout();
        expect(b._currentMeasure.left).toBe(110);
        expect(c._currentMeasure.top).toBe(30);
        layout(330);
        expect(c._currentMeasure.top).toBe(0);
        expect(c._currentMeasure.left).toBe(220);
    });
    it("supports reversed columns and cross-axis alignment", () => {
        const { panel, layout } = setup(300, 100);
        panel.flexDirection = "column-reverse";
        panel.alignItems = "center";
        panel.justifyContent = "space-between";
        const a = item(),
            b = item();
        panel.addControl(a).addControl(b);
        layout();
        expect(a._currentMeasure.top).toBe(80);
        expect(b._currentMeasure.top).toBe(0);
        expect(a._currentMeasure.left).toBe(100);
    });
    it("reflows after a child changes and restores normal layout when reparented", () => {
        const { root, panel, layout } = setup();
        const a = item(),
            b = item();
        panel.addControl(a).addControl(b);
        layout();
        a.width = "150px";
        layout();
        expect(b._currentMeasure.left).toBe(150);
        panel.removeControl(b);
        root.addControl(b);
        layout();
        expect(b._currentMeasure.left).toBe(100);
    });
    it("lays out nested panels using allocated space", () => {
        const { panel, layout } = setup(300, 100);
        const nested = new FlexPanel();
        nested.width = "100px";
        nested.flexGrow = 1;
        nested.alignItems = "stretch";
        const a = item("50%"),
            b = item("50%");
        nested.addControl(a).addControl(b);
        panel.addControl(item()).addControl(nested);
        layout();
        expect(nested._currentMeasure.width).toBe(200);
        expect(a._currentMeasure.left).toBe(100);
        expect(b._currentMeasure.left).toBe(200);
        expect(a._currentMeasure.height).toBe(100);
        layout(500);
        expect(b._currentMeasure.left).toBe(300);
    });
    it("uses the allocated width when wrapping text", () => {
        const { panel, layout } = setup(100);
        const text = new TextBlock("text", "aaaa bbbb");
        text.width = "200px";
        text.height = "60px";
        text.fontSize = "18px";
        text.textWrapping = true;
        panel.addControl(item("50px")).addControl(text);
        layout();
        expect(text._currentMeasure.width).toBeCloseTo(80);
        expect(text.lines).toHaveLength(2);
    });
    it("uses allocated text-input dimensions for clipping and line wrapping", () => {
        const { panel, layout } = setup(100, 80);
        const area = new InputTextArea("area", "aaaa bbbb");
        area.width = "200px";
        area.height = "60px";
        area.margin = "0px";
        area.fontSize = "18px";
        area.autoStretchHeight = false;
        panel.addControl(item("50px")).addControl(area);
        layout();
        const areaInternals = area as unknown as { _availableWidth: number; _lines: unknown[] };
        expect(areaInternals._availableWidth).toBeCloseTo(80);
        expect(areaInternals._lines).toHaveLength(2);

        panel.removeControl(area);
        const input = new InputText("input", "hello");
        input.width = "200px";
        input.height = "30px";
        input.margin = "0px";
        input.fontSize = "18px";
        panel.addControl(input);
        layout();
        const rect = vi.fn();
        const drawContext = { ...context, rect, beginPath() {}, clip() {}, fillText() {}, fillRect() {}, strokeRect() {} } as unknown as ICanvasRenderingContext;
        input._draw(drawContext);
        expect(rect.mock.calls[0][2]).toBeCloseTo(82);
    });
    it("honors descendant padding without scaling allocated boxes twice", () => {
        const { panel, layout } = setup(300, 100);
        panel.descendantsOnlyPadding = true;
        panel.paddingLeft = "10px";
        panel.paddingRight = "20px";
        panel.paddingTop = "5px";
        const a = item("50%"),
            b = item("50%");
        panel.addControl(a).addControl(b);
        layout();
        expect(a._currentMeasure.left).toBe(10);
        expect(a._currentMeasure.width).toBe(135);
        expect(b._currentMeasure.left).toBe(145);
        expect(b._currentMeasure.top).toBe(5);
    });
    it("supports reversed wrap lines and stretch", () => {
        const { panel, layout } = setup(100, 100);
        panel.flexWrap = "wrap-reverse";
        panel.alignItems = "stretch";
        const a = item(),
            b = item();
        panel.addControl(a).addControl(b);
        layout();
        expect(a._currentMeasure.top).toBe(50);
        expect(b._currentMeasure.top).toBe(0);
        expect(a._currentMeasure.height).toBe(50);
    });
    it("keeps overflow intentional when shrink is disabled", () => {
        const { panel, layout } = setup(50);
        const a = item();
        a.flexShrink = 0;
        panel.addControl(a);
        layout();
        expect(a._currentMeasure.width).toBe(100);
        expect(() => {
            a.flexGrow = NaN;
        }).toThrow(RangeError);
        expect(() => {
            a.flexShrink = -1;
        }).toThrow(RangeError);
    });
    it("handles an empty panel and single-item space distribution", () => {
        const { panel, layout } = setup(300);
        layout();
        panel.justifyContent = "space-evenly";
        const a = item();
        panel.addControl(a);
        layout();
        expect(a._currentMeasure.left).toBe(100);
    });
    it("serializes layout settings and declared child sizes", () => {
        const { panel, layout } = setup();
        panel.flexDirection = "column";
        panel.gap = "1rem";
        const a = item("2em");
        a.flexGrow = 1;
        panel.addControl(a);
        layout();
        const json: any = {};
        panel.serialize(json, false, false);
        expect(json.className).toBe("FlexPanel");
        expect(json.flexDirection).toBe("column");
        expect(json.gap).toBe("1rem");
        expect(json.children[0].width).toBe("2em");
        expect(json.children[0].flexGrow).toBe(1);
    });
});

describe("font-relative GUI units", () => {
    it("resolves em from the control font and rem from the GUI root", () => {
        const { root, panel, layout } = setup();
        root.fontSize = "20px";
        panel.fontSize = "1.5em";
        const a = item("2em", "1rem");
        a.fontSize = "2em";
        panel.addControl(a);
        layout();
        expect(a.fontSizeInPixels).toBe(60);
        expect(a._currentMeasure.width).toBe(120);
        expect(a._currentMeasure.height).toBe(20);
        root.fontSize = "30px";
        layout();
        expect(a._currentMeasure.width).toBe(180);
        expect(a._currentMeasure.height).toBe(30);
    });
    it("scales relative units once with the ideal resolution", () => {
        const { root, panel, host, layout } = setup();
        host.idealWidth = 150;
        root.fontSize = "20px";
        const a = item("2rem", "1em");
        a.fontSize = "10px";
        panel.addControl(a);
        layout();
        expect(a._currentMeasure.width).toBe(80);
        expect(a._currentMeasure.height).toBe(20);
    });
    it("resolves offsets and padding outside a flex panel", () => {
        const { root, layout } = setup(300);
        root.fontSize = "20px";
        const a = item("5em", "3em");
        a.fontSize = "10px";
        a.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        a.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        a.left = "1rem";
        a.top = "2em";
        a.paddingLeft = "1em";
        root.addControl(a);
        layout();
        expect(a._currentMeasure.left).toBe(30);
        expect(a._currentMeasure.top).toBe(20);
        expect(a._currentMeasure.width).toBe(40);
    });
    it("treats relative dimensions as defined when sizing a StackPanel", () => {
        const { root, layout } = setup();
        root.fontSize = "20px";
        const stack = new StackPanel();
        stack.addControl(item("2rem", "1rem"));
        stack.addControl(item("2rem", "2rem"));
        root.addControl(stack);
        layout();
        expect(stack._currentMeasure.height).toBe(60);
    });
    it("resolves em dimensions from percentage fonts on the current parent height", () => {
        const { panel, layout } = setup(300, 100);
        const child = item("2em", "1em");
        child.fontSize = "10%";
        panel.addControl(child);
        layout();
        expect(child._currentMeasure.width).toBe(20);
        layout(300, 200);
        expect(child._currentMeasure.width).toBe(40);
        expect(child._currentMeasure.height).toBe(20);
    });
    it("uses the default font for root-relative font declarations without recursion", () => {
        const { root } = setup();
        root.fontSize = "2rem";
        expect(root.fontSizeInPixels).toBe(36);
    });
    it("resolves multiline point em units against the multiline control", () => {
        const { root } = setup();
        const line = new MultiLine();
        line.fontSize = "30px";
        root.addControl(line);
        const point = line.push({ x: "2em", y: "1rem" });
        expect(point.translate().x).toBe(60);
        expect(point.translate().y).toBe(18);
    });
    it("keeps pixel, percentage, decimal and scientific numeric inputs usable", () => {
        const { host } = setup();
        const value = new ValueAndUnit(0);
        value.fromString("25%");
        expect(value.getValueInPixel(host, 200)).toBe(50);
        value.fromString(" 12px ");
        expect(value.getValueInPixel(host, 200)).toBe(12);
        value.fromString(1e-7);
        expect(value.getValueInPixel(host, 200)).toBe(1e-7);
        value.fromString(".5em");
        expect(value.getValueInPixel(host, 200, 20, 18)).toBe(10);
        expect(value.fromString(Infinity)).toBe(false);
    });
    it("parses, preserves and validates relative unit strings", () => {
        const { host } = setup();
        const value = new ValueAndUnit(0);
        expect(value.fromString("1.5rem")).toBe(true);
        expect(value.toString(host)).toBe("1.5rem");
        expect(value.getValueInPixel(host, 100, 10, 20)).toBe(30);
        expect(value.fromString("2emjunk")).toBe(false);
        expect(value.fromString("rem")).toBe(false);
        expect(value.toString(host)).toBe("1.5rem");
    });
});
