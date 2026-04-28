import { describe, it, expect } from "vitest";
import { GetTextBoundingBox } from "../../src/maths/boundingBox";
import { DrawLottieText, MeasureLottieText, ResolveLottieText } from "../../src/parsing/textLayout";
import { type RawFont, type RawTextData } from "../../src/parsing/rawTypes";

type FakeTextMetrics = {
    width: number;
    actualBoundingBoxAscent: number;
    actualBoundingBoxDescent: number;
    actualBoundingBoxLeft?: number;
    actualBoundingBoxRight?: number;
};

class FakeTextContext {
    public font = "";
    public lineWidth = 1;
    public fontKerning?: string;

    public readonly measurements: Array<{ text: string; font: string }> = [];
    public readonly draws: Array<{ op: "fill" | "stroke"; text: string; x: number; y: number }> = [];

    private readonly _stateStack: Array<{ font: string; lineWidth: number }> = [];

    public constructor(private readonly _metricsByText: Record<string, FakeTextMetrics>) {}

    public save(): void {
        this._stateStack.push({ font: this.font, lineWidth: this.lineWidth });
    }

    public restore(): void {
        const state = this._stateStack.pop();
        if (!state) {
            return;
        }

        this.font = state.font;
        this.lineWidth = state.lineWidth;
    }

    public measureText(text: string): FakeTextMetrics {
        this.measurements.push({ text, font: this.font });
        return this._metricsByText[text] ?? { width: text.length, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 };
    }

    public fillText(text: string, x: number, y: number): void {
        this.draws.push({ op: "fill", text, x, y });
    }

    public strokeText(text: string, x: number, y: number): void {
        this.draws.push({ op: "stroke", text, x, y });
    }
}

function createTextData(text: string, overrides?: Partial<RawTextData["d"]["k"][number]["s"]>): RawTextData {
    return {
        a: [],
        d: {
            k: [
                {
                    t: 0,
                    s: {
                        s: 50,
                        f: "SegoeUI-Semibold",
                        t: text,
                        ca: 0,
                        j: 0,
                        tr: 0,
                        lh: 60,
                        ls: 0,
                        fc: [0, 0, 0],
                        ...overrides,
                    },
                },
            ],
        },
        m: {
            g: 1,
            a: {
                a: 0,
                k: [0, 0],
                l: 2,
            },
        },
    };
}

function createFonts(): Map<string, RawFont> {
    return new Map<string, RawFont>([
        [
            "SegoeUI-Semibold",
            {
                fName: "SegoeUI-Semibold",
                fFamily: "Segoe UI",
                fStyle: "Semibold",
                ascent: 80,
            },
        ],
    ]);
}

describe("GetTextBoundingBox", () => {
    it("uses the Lottie font style when measuring text", () => {
        const context = new FakeTextContext({
            Hello: {
                width: 30,
                actualBoundingBoxAscent: 10,
                actualBoundingBoxDescent: 2,
            },
        });

        GetTextBoundingBox(context as unknown as CanvasRenderingContext2D, createTextData("Hello"), createFonts(), new Map());

        expect(context.measurements).toHaveLength(1);
        expect(context.measurements[0].font).toBe('700 50px "Segoe UI"');
    });

    it("accounts for line breaks, line height, tracking, and font ascent", () => {
        const context = new FakeTextContext({
            "AB\u2028\rC": {
                width: 100,
                actualBoundingBoxAscent: 10,
                actualBoundingBoxDescent: 3,
            },
            AB: {
                width: 20,
                actualBoundingBoxAscent: 10,
                actualBoundingBoxDescent: 3,
            },
            C: {
                width: 8,
                actualBoundingBoxAscent: 10,
                actualBoundingBoxDescent: 3,
            },
        });

        const box = GetTextBoundingBox(context as unknown as CanvasRenderingContext2D, createTextData("AB\u2028\rC", { j: 2, tr: 100 }), createFonts(), new Map());

        expect(box).toBeDefined();
        expect(box?.width).toBe(25);
        expect(box?.height).toBe(104);
        expect(box?.offsetX).toBe(0);
        expect(box?.baselineOffsetY).toBe(40);
        expect(box?.descent).toBe(3);
        expect(context.measurements.map((measurement) => measurement.text)).toEqual(["AB", "C"]);
    });

    it("keeps point text anchored to its authored baseline origin instead of the glyph bounds", () => {
        const context = new FakeTextContext({
            Turn: {
                width: 40,
                actualBoundingBoxLeft: 4,
                actualBoundingBoxRight: 40,
                actualBoundingBoxAscent: 10,
                actualBoundingBoxDescent: 2,
            },
        });

        const resolvedText = ResolveLottieText(createTextData("Turn"), createFonts(), new Map());

        expect(resolvedText).toBeDefined();

        const layout = MeasureLottieText(resolvedText!, (text) => context.measureText(text));
        const box = GetTextBoundingBox(context as unknown as CanvasRenderingContext2D, createTextData("Turn"), createFonts(), new Map());

        expect(layout.width).toBe(44);
        expect(layout.offsetX).toBe(18);
        expect(layout.lines[0].x).toBe(4);
        expect(box?.width).toBe(44);
        expect(box?.offsetX).toBe(18);
    });

    it("can measure point text with Babylon 8 bounds and baseline compatibility", () => {
        const context = new FakeTextContext({
            Turn: {
                width: 40,
                actualBoundingBoxLeft: 4,
                actualBoundingBoxRight: 40,
                actualBoundingBoxAscent: 10,
                actualBoundingBoxDescent: 2,
            },
        });

        const resolvedText = ResolveLottieText(createTextData("Turn"), createFonts(), new Map());

        expect(resolvedText).toBeDefined();

        const layout = MeasureLottieText(resolvedText!, (text) => context.measureText(text), "babylon8");
        const box = GetTextBoundingBox(context as unknown as CanvasRenderingContext2D, createTextData("Turn"), createFonts(), new Map(), "babylon8");

        expect(layout.width).toBe(40);
        expect(layout.height).toBe(12);
        expect(layout.offsetX).toBe(0);
        expect(layout.offsetY).toBe(0);
        expect(layout.baselineOffsetY).toBe(10);
        expect(layout.lines[0].x).toBe(0);
        expect(layout.lines[0].baselineY).toBe(10);
        expect(box?.width).toBe(40);
        expect(box?.height).toBe(12);
        expect(box?.offsetX).toBe(0);
        expect(box?.offsetY).toBe(0);
    });

    it("accounts for paragraph box position and size when measuring text", () => {
        const context = new FakeTextContext({
            Question: {
                width: 100,
                actualBoundingBoxAscent: 30,
                actualBoundingBoxDescent: 10,
            },
        });

        const box = GetTextBoundingBox(context as unknown as CanvasRenderingContext2D, createTextData("Question", { sz: [1202, 94], ps: [-601, -47] }), createFonts(), new Map());

        expect(box).toBeDefined();
        expect(box?.width).toBe(1202);
        expect(box?.height).toBe(94);
        expect(box?.offsetX).toBe(0);
        expect(box?.offsetY).toBe(0);
    });

    it("starts paragraph text at the paragraph box top using the first baseline offset", () => {
        const context = new FakeTextContext({
            Question: {
                width: 8,
                actualBoundingBoxAscent: 8,
                actualBoundingBoxDescent: 2,
            },
        });

        const resolvedText = ResolveLottieText(createTextData("Question", { s: 10, sz: [20, 20], ps: [-10, -10] }), createFonts(), new Map());

        expect(resolvedText).toBeDefined();

        const layout = MeasureLottieText(resolvedText!, (text) => context.measureText(text));

        expect(layout.lines).toHaveLength(1);
        expect(layout.lines[0].baselineY).toBe(8);
    });

    it("wraps paragraph text to the paragraph box width", () => {
        const context = new FakeTextContext({});
        const resolvedText = ResolveLottieText(
            createTextData("one two three", {
                s: 10,
                sz: [10, 40],
                ps: [-5, -20],
                lh: 12,
                tr: 0,
            }),
            createFonts(),
            new Map()
        );

        expect(resolvedText).toBeDefined();

        const layout = MeasureLottieText(resolvedText!, (text) => context.measureText(text));

        expect(layout.lines.map((line) => line.text)).toEqual(["one two", "three"]);
    });

    it("ignores trailing line-break sentinels in paragraph text", () => {
        const resolvedText = ResolveLottieText(createTextData("one two\r"), createFonts(), new Map());

        expect(resolvedText).toBeDefined();
        expect(resolvedText?.lines).toEqual(["one two"]);
    });

    it("breaks a word wider than the paragraph box across multiple lines", () => {
        const context = new FakeTextContext({});
        const resolvedText = ResolveLottieText(
            createTextData("abcdefgh", {
                s: 10,
                sz: [3, 40],
                ps: [0, 0],
                lh: 12,
                tr: 0,
            }),
            createFonts(),
            new Map()
        );

        expect(resolvedText).toBeDefined();

        const layout = MeasureLottieText(resolvedText!, (text) => context.measureText(text));

        // Each character is 1 unit wide in the fake measurer; box width 3 fits up to 3 characters per line.
        expect(layout.lines.map((line) => line.text)).toEqual(["abc", "def", "gh"]);
    });

    it("substitutes text from the variables map", () => {
        const resolved = ResolveLottieText(createTextData("greeting"), createFonts(), new Map([["greeting", "Hi"]]));
        expect(resolved?.lines).toEqual(["Hi"]);
    });

    it("draws fill only when no stroke is configured", () => {
        const context = new FakeTextContext({ Hi: { width: 20, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 2 } });
        const resolved = ResolveLottieText(createTextData("Hi"), createFonts(), new Map());
        const layout = MeasureLottieText(resolved!, (text) => context.measureText(text));

        DrawLottieText(context, resolved!, layout);

        expect(context.draws).toEqual([{ op: "fill", text: "Hi", x: layout.lines[0].x, y: layout.lines[0].baselineY }]);
    });

    it("strokes before fill by default and after fill when strokeOverFill is set", () => {
        const metrics = { Hi: { width: 20, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 2 } };

        const underContext = new FakeTextContext(metrics);
        const underResolved = ResolveLottieText(createTextData("Hi", { sc: [1, 0, 0], sw: 2 }), createFonts(), new Map());
        const underLayout = MeasureLottieText(underResolved!, (text) => underContext.measureText(text));
        DrawLottieText(underContext, underResolved!, underLayout);
        expect(underContext.draws.map((d) => d.op)).toEqual(["stroke", "fill"]);

        const overContext = new FakeTextContext(metrics);
        const overResolved = ResolveLottieText(createTextData("Hi", { sc: [1, 0, 0], sw: 2, of: true }), createFonts(), new Map());
        const overLayout = MeasureLottieText(overResolved!, (text) => overContext.measureText(text));
        DrawLottieText(overContext, overResolved!, overLayout);
        expect(overContext.draws.map((d) => d.op)).toEqual(["fill", "stroke"]);
    });

    it("draws each glyph at the accumulated advance when tracking is non-zero", () => {
        const context = new FakeTextContext({
            A: { width: 10, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 },
            B: { width: 4, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 },
            C: { width: 6, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 },
            ABC: { width: 20, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 },
        });
        const resolved = ResolveLottieText(createTextData("ABC", { tr: 20 }), createFonts(), new Map());
        const layout = MeasureLottieText(resolved!, (text) => context.measureText(text));

        DrawLottieText(context, resolved!, layout);

        const fillDraws = context.draws.filter((d) => d.op === "fill");
        expect(fillDraws.map((d) => d.text)).toEqual(["A", "B", "C"]);
        const trackingPx = (20 * 50) / 1000; // tr * s / 1000 = 1
        const baseX = layout.lines[0].x;
        expect(fillDraws[0].x).toBe(baseX + trackingPx * 0);
        expect(fillDraws[1].x).toBe(baseX + 10 + trackingPx * 1); // after A
        expect(fillDraws[2].x).toBe(baseX + 14 + trackingPx * 2); // after A+B
    });
});
