import { describe, expect, it } from "vitest";

import { ParseAnimation } from "../../src/animation/parse";
import { type ILottieFile, type IShapeItem } from "../../src/animation/lottieRaw";

function Static(value: unknown) {
    return { a: 0 as const, k: value };
}

const Transform = { a: Static([0, 0]), p: Static([0, 0]), s: Static([100, 100]), r: Static(0), o: Static(100) };

function ShapeLayer(overrides: Record<string, unknown> = {}, shapes: IShapeItem[] = []): Record<string, unknown> {
    return { ty: 4, ks: Transform, ip: 0, op: 60, st: 0, shapes, ...overrides };
}

function File(layers: Record<string, unknown>[]): ILottieFile {
    return { v: "5.7.0", w: 100, h: 100, ip: 0, op: 60, fr: 30, layers } as unknown as ILottieFile;
}

const Path: IShapeItem = { ty: "sh", ks: Static({ v: [[0, 0]], i: [[0, 0]], o: [[0, 0]], c: true }) };
const Fill: IShapeItem = { ty: "fl", c: Static([1, 0, 0, 1]) };

describe("ParseAnimation - layer indices", () => {
    it("keeps explicit layer indices", () => {
        const anim = ParseAnimation(File([ShapeLayer({ ind: 7 }, [Path, Fill])]));
        expect(anim.layers[0].ind).toBe(7);
    });

    it("gives layers that omit ind unique synthetic indices", () => {
        // Without this, every ind-less layer collides in the parent lookup and the world cache.
        const anim = ParseAnimation(File([ShapeLayer({}, [Path, Fill]), ShapeLayer({}, [Path, Fill]), ShapeLayer({}, [Path, Fill])]));
        const indices = anim.layers.map((l) => l.ind);
        expect(new Set(indices).size).toBe(3);
    });

    it("does not let a synthetic index collide with an explicit one", () => {
        const anim = ParseAnimation(File([ShapeLayer({}, [Path, Fill]), ShapeLayer({ ind: 1 }, [Path, Fill])]));
        const indices = anim.layers.map((l) => l.ind);
        expect(new Set(indices).size).toBe(2);
    });
});

describe("ParseAnimation - track mattes", () => {
    it("pairs an alpha matte consumer with the preceding source layer", () => {
        // Lottie orders layers top-first, so a consumer's matte source is the entry before it.
        const anim = ParseAnimation(File([ShapeLayer({ ind: 2, td: 1 }, [Path, Fill]), ShapeLayer({ ind: 1, tt: 1 }, [Path, Fill])]));
        const consumer = anim.layers.find((l) => l.ind === 1);
        expect(consumer?.matteSource).toBe(2);
        expect(anim.layers.find((l) => l.ind === 2)?.matteOnly).toBe(true);
    });

    it("treats an explicit tt of 0 as no matte", () => {
        // tt:0 is MatteMode.Normal; the layer must still render.
        const anim = ParseAnimation(File([ShapeLayer({ ind: 1, tt: 0 }, [Path, Fill])]));
        const layer = anim.layers.find((l) => l.ind === 1);
        expect(layer?.matteSource).toBeUndefined();
        expect(layer?.matteOnly).toBe(false);
    });

    it("honors an explicit matte source reference", () => {
        const anim = ParseAnimation(File([ShapeLayer({ ind: 5 }, [Path, Fill]), ShapeLayer({ ind: 1, tt: 1, tp: 5 }, [Path, Fill])]));
        expect(anim.layers.find((l) => l.ind === 1)?.matteSource).toBe(5);
    });
});

describe("ParseAnimation - shape groups", () => {
    it("emits one op per paint in a group", () => {
        const anim = ParseAnimation(File([ShapeLayer({ ind: 1 }, [Path, Fill, { ty: "st", c: Static([0, 0, 1, 1]), w: Static(4) }])]));
        expect(anim.layers[0].ops).toHaveLength(2);
        expect(anim.layers[0].ops[0].stroke).toBeUndefined();
        expect(anim.layers[0].ops[1].stroke?.width).toBeDefined();
    });

    it("propagates a layer-level fill into sibling groups that define none", () => {
        // The fill sits after the group, which is how After Effects exports layer-level decorators.
        const anim = ParseAnimation(File([ShapeLayer({ ind: 1 }, [{ ty: "gr", it: [Path] }, Fill])]));
        expect(anim.layers[0].ops).toHaveLength(1);
        expect(anim.layers[0].ops[0].paint.kind).toBe("solid");
    });

    it("lets a nested group's own paint win over the inherited one", () => {
        const ownFill: IShapeItem = { ty: "gf", t: 1, s: Static([0, 0]), e: Static([1, 1]), g: { p: 2, k: Static([0, 1, 0, 0, 1, 0, 0, 1]) } };
        const anim = ParseAnimation(File([ShapeLayer({ ind: 1 }, [{ ty: "gr", it: [Path, ownFill] }, Fill])]));
        expect(anim.layers[0].ops).toHaveLength(1);
        expect(anim.layers[0].ops[0].paint.kind).toBe("linear");
    });

    it("composes transforms from every enclosing group, outermost first", () => {
        const outer: IShapeItem = { ty: "tr", a: Static([0, 0]), p: Static([10, 0]), s: Static([100, 100]), o: Static(100) };
        const inner: IShapeItem = { ty: "tr", a: Static([0, 0]), p: Static([5, 0]), s: Static([100, 100]), o: Static(100) };
        const anim = ParseAnimation(
            File([
                ShapeLayer({ ind: 1 }, [
                    {
                        ty: "gr",
                        it: [{ ty: "gr", it: [Path, Fill, inner] }, outer],
                    },
                ]),
            ])
        );
        expect(anim.layers[0].ops).toHaveLength(1);
        expect(anim.layers[0].ops[0].groupTransforms).toHaveLength(2);
    });

    it("skips hidden items", () => {
        const anim = ParseAnimation(File([ShapeLayer({ ind: 1 }, [Path, { ...Fill, hd: true }])]));
        expect(anim.layers[0].ops).toHaveLength(0);
    });
});

describe("ParseAnimation - layers and solids", () => {
    it("reports solid layers as shape layers with a synthesized rect", () => {
        const anim = ParseAnimation(File([{ ty: 1, ind: 1, sc: "#ff0000", sw: 40, sh: 20, ks: Transform, ip: 0, op: 60, st: 0 }]));
        expect(anim.layers[0].kind).toBe(4);
        expect(anim.layers[0].ops).toHaveLength(1);
        expect(anim.layers[0].ops[0].contours[0].rect).toBeDefined();
    });

    it("keeps null layers so children can resolve them as parents", () => {
        const anim = ParseAnimation(File([{ ty: 3, ind: 2, ks: Transform, ip: 0, op: 60, st: 0 }, ShapeLayer({ ind: 1, parent: 2 }, [Path, Fill])]));
        expect(anim.layers.map((l) => l.ind).sort()).toEqual([1, 2]);
        expect(anim.layers.find((l) => l.ind === 1)?.parent).toBe(2);
    });

    it("drops layer kinds no renderer handles", () => {
        const anim = ParseAnimation(File([{ ty: 0, ind: 1, ks: Transform, ip: 0, op: 60, st: 0 }]));
        expect(anim.layers).toHaveLength(0);
    });

    it("substitutes text variables on a whole-string match", () => {
        const textLayer = {
            ty: 5,
            ind: 1,
            ks: Transform,
            ip: 0,
            op: 60,
            st: 0,
            t: { d: { k: [{ s: { t: "PLACEHOLDER", f: "Segoe UI", s: 12, fc: [0, 0, 0] } }] } },
        };
        const anim = ParseAnimation(File([textLayer]), { PLACEHOLDER: "Hello" });
        expect(anim.layers[0].text?.text).toBe("Hello");
    });

    it("defaults a missing in/out point to the full timeline", () => {
        const anim = ParseAnimation(File([ShapeLayer({ ind: 1, ip: undefined, op: undefined }, [Path, Fill])]));
        expect(anim.layers[0].ip).toBe(0);
        expect(anim.layers[0].op).toBeGreaterThan(0);
    });
});
