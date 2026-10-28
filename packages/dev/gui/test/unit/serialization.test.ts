import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type ICanvasRenderingContext } from "core/Engines/ICanvas";
import { Scene } from "core/scene";
import { SerializationHelper } from "core/Misc/decorators.serialization";
import { AdvancedDynamicTexture } from "../../src/2D/advancedDynamicTexture";
import { Control } from "../../src/2D/controls/control";
import { Rectangle } from "../../src/2D/controls/rectangle";
import { TextBlock } from "../../src/2D/controls/textBlock";

class TestRectangle extends Rectangle {
    public override _applyStates(context: ICanvasRenderingContext): void {
        super._applyStates(context);
    }
}

class TestTextBlock extends TextBlock {
    public override _applyStates(context: ICanvasRenderingContext): void {
        super._applyStates(context);
    }
}

describe("GUI Serialization test", () => {
    it("Respects the isSerializable property", () => {
        const rect = new Rectangle("rect");

        const s1 = {};
        rect.serialize(s1);

        // s1 will contain something
        expect(s1).not.toEqual({});

        rect.isSerializable = false;
        const s2 = {};
        rect.serialize(s2);

        // s2 will be empty
        expect(s2).toEqual({});

        const s3 = {};
        rect.serialize(s3, true);
        expect(s3).not.toEqual({});
    });

    describe("GUI serialization with adaptive scaling", () => {
        let engine: NullEngine;
        let texture: AdvancedDynamicTexture;

        beforeEach(() => {
            vi.stubGlobal("window", { innerWidth: 1280, innerHeight: 720 });
            engine = new NullEngine();
            vi.spyOn(engine, "createCanvas").mockImplementation((width, height) => ({
                width,
                height,
                getContext: vi.fn().mockReturnValue({ font: "", globalAlpha: 1 }),
                toDataURL: vi.fn(),
            }));
            vi.spyOn(Control, "_GetFontOffset").mockImplementation((font) => {
                const height = Number(/([\d.]+)px/.exec(font)![1]);
                return { ascent: height * 0.75, height, descent: height * 0.25 };
            });
            texture = new AdvancedDynamicTexture("gui", 1280, 720, new Scene(engine));
            texture.idealWidth = 957;
            texture.idealHeight = 828;
        });

        afterEach(() => {
            vi.unstubAllGlobals();
            engine.dispose();
            vi.restoreAllMocks();
        });

        function addRectangle() {
            const rectangle = new TestRectangle("rectangle");
            rectangle.width = "200px";
            rectangle.height = "40px";
            rectangle.left = "12px";
            rectangle.top = "-8px";
            rectangle.paddingLeft = "3px";
            rectangle.paddingRight = "4px";
            rectangle.paddingTop = "5px";
            rectangle.paddingBottom = "6px";
            rectangle.linkOffsetX = "7px";
            rectangle.linkOffsetY = "-9px";
            rectangle.fontSize = "24px";
            texture.addControl(rectangle);
            const label = new TestTextBlock("label", "test");
            label.width = "80%";
            label.fontSize = "20px";
            rectangle.addControl(label);
            rectangle._applyStates(texture.getContext());
            label._applyStates(texture.getContext());
            return { rectangle, label };
        }

        it.each([
            { useSmallestIdeal: false, portrait: false },
            { useSmallestIdeal: false, portrait: true },
            { useSmallestIdeal: true, portrait: false },
            { useSmallestIdeal: true, portrait: true },
        ])("serializes unscaled values without invalidating the GUI (%j)", ({ useSmallestIdeal, portrait }) => {
            texture.useSmallestIdeal = useSmallestIdeal;
            if (portrait) {
                vi.stubGlobal("window", { innerWidth: 720, innerHeight: 1280 });
            }
            const { rectangle, label } = addRectangle();
            const rectangleFontOffset = rectangle.fontOffset;
            const labelFontOffset = label.fontOffset;
            const dirtyRoot = vi.spyOn(texture.rootContainer, "_markAllAsDirty");
            const dirtyLabel = vi.spyOn(label, "_markAllAsDirty");
            const dirtyTexture = vi.spyOn(texture, "markAsDirty");
            const serialized: Record<string, any> = {};

            rectangle.serialize(serialized);

            expect(serialized).toMatchObject({
                width: "200px",
                height: "40px",
                left: "12px",
                top: "-8px",
                paddingLeft: "3px",
                paddingRight: "4px",
                paddingTop: "5px",
                paddingBottom: "6px",
                linkOffsetX: "7px",
                linkOffsetY: "-9px",
                fontSize: "24px",
                fontOffset: { height: 24 },
                children: [{ width: "80%", fontSize: "20px", fontOffset: { height: 20 } }],
            });
            expect(texture.idealWidth).toBe(957);
            expect(texture.idealHeight).toBe(828);
            expect(rectangle.fontOffset).toBe(rectangleFontOffset);
            expect(label.fontOffset).toBe(labelFontOffset);
            expect(dirtyRoot.mock.calls.length).toBe(0);
            expect(dirtyLabel.mock.calls.length).toBe(0);
            expect(dirtyTexture.mock.calls.length).toBe(0);
        });

        it("clones multiple controls without repeatedly invalidating the source GUI", () => {
            texture.useSmallestIdeal = true;
            for (let i = 0; i < 20; i++) {
                addRectangle();
            }
            const target = new AdvancedDynamicTexture("editor", 1280, 720, texture.getScene());
            const dirtyRoot = vi.spyOn(texture.rootContainer, "_markAllAsDirty");

            for (const rectangle of texture.rootContainer.children) {
                const cloned = rectangle.clone(target) as Rectangle;
                target.addControl(cloned);
                expect(cloned.width).toBe("200px");
                expect(cloned.height).toBe("40px");
                expect(cloned.children[0].fontSize).toBe("20px");
            }

            expect(target.rootContainer.children).toHaveLength(20);
            expect(dirtyRoot.mock.calls.length).toBe(0);
        });

        it("restores ideal dimensions and preserves font caches when serialization throws", () => {
            texture.useSmallestIdeal = true;
            const { rectangle, label } = addRectangle();
            const rectangleFontOffset = rectangle.fontOffset;
            const labelFontOffset = label.fontOffset;
            vi.spyOn(SerializationHelper, "Serialize").mockImplementationOnce(() => {
                throw new Error("Serialization failed");
            });

            expect(() => rectangle.serialize({})).toThrow("Serialization failed");

            expect(texture.idealWidth).toBe(957);
            expect(texture.idealHeight).toBe(828);
            expect(rectangle.fontOffset).toBe(rectangleFontOffset);
            expect(label.fontOffset).toBe(labelFontOffset);
        });

        it("does not measure fonts when canvas access is disabled", () => {
            texture.useSmallestIdeal = true;
            const { rectangle } = addRectangle();
            const fontOffset = vi.mocked(Control._GetFontOffset);
            fontOffset.mockClear();
            const serialized: Record<string, any> = {};

            rectangle.serialize(serialized, false, false);

            expect(serialized.width).toBe("200px");
            expect(serialized.children[0].fontSize).toBe("20px");
            expect(fontOffset.mock.calls.length).toBe(0);
            expect(texture.idealWidth).toBe(957);
            expect(texture.idealHeight).toBe(828);
        });

        it.each([
            { idealWidth: 957, idealHeight: 0 },
            { idealWidth: 0, idealHeight: 828 },
            { idealWidth: 0, idealHeight: 0 },
        ])("preserves single-axis or disabled adaptive scaling (%j)", ({ idealWidth, idealHeight }) => {
            texture.idealWidth = idealWidth;
            texture.idealHeight = idealHeight;
            texture.useSmallestIdeal = true;
            const { rectangle, label } = addRectangle();
            const fontOffset = label.fontOffset;
            const dirtyRoot = vi.spyOn(texture.rootContainer, "_markAllAsDirty");
            const serialized: Record<string, any> = {};

            rectangle.serialize(serialized);

            expect(serialized.width).toBe("200px");
            expect(serialized.children[0].fontOffset.height).toBe(20);
            expect(texture.idealWidth).toBe(idealWidth);
            expect(texture.idealHeight).toBe(idealHeight);
            expect(label.fontOffset).toBe(fontOffset);
            expect(dirtyRoot.mock.calls.length).toBe(0);
        });

        it("serializes a detached control before its first render without populating its font cache", () => {
            const rectangle = new TestRectangle("detached");
            rectangle.width = "200px";
            rectangle.fontSize = "24px";
            const serialized: Record<string, any> = {};

            rectangle.serialize(serialized);

            expect(serialized.width).toBe("200px");
            expect(serialized.fontSize).toBe("24px");
            expect(serialized.fontOffset.height).toBe(24);
            expect(rectangle.fontOffset).toBeUndefined();
        });
    });
});
