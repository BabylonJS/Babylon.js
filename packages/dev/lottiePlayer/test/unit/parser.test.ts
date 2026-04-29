import { describe, it, expect, vi } from "vitest";

import { Parser } from "../../src/parsing/parser";
import { type SpritePacker, type SpriteAtlasInfo } from "../../src/parsing/spritePacker";
import { type RenderingManager } from "../../src/rendering/renderingManager";
import { SpriteNode } from "../../src/nodes/spriteNode";
import { ControlNode } from "../../src/nodes/controlNode";
import { Node } from "../../src/nodes/node";
import { type RawElement, type RawLottieAnimation, type RawShapeLayer, type RawTextLayer, type RawTransform } from "../../src/parsing/rawTypes";
import { type AnimationConfiguration } from "../../src/animationConfiguration";

// Minimal valid empty transform (all fields optional, parser fills in defaults).
function makeTransform(): RawTransform {
    return {};
}

// Minimal valid text data. Content does not matter because the SpritePacker is mocked,
// but the type requires these fields.
function makeTextData(): RawTextLayer["t"] {
    return {
        a: [],
        d: { k: [] },
        m: { a: { a: 0, k: [0, 0], l: 2 }, g: 1 },
    };
}

// Builds a SpritePacker mock that returns deterministic SpriteAtlasInfo for both
// shape and text additions.
function makeMockPacker(): SpritePacker {
    const baseInfo: SpriteAtlasInfo = {
        uOffset: 0,
        vOffset: 0,
        cellWidth: 16,
        cellHeight: 16,
        widthPx: 16,
        heightPx: 16,
        centerX: 8,
        centerY: 8,
        atlasIndex: 0,
    };

    const mock = {
        addLottieShape: () => baseInfo,
        addLottieText: () => baseInfo,
        updateAtlasTexture: () => {},
        releaseCanvas: () => {},
        get textures() {
            return [];
        },
        get unsupportedFeatures() {
            return [];
        },
        set rawFonts(_: unknown) {},
    };

    return mock as unknown as SpritePacker;
}

// Builds a minimal RenderingManager mock — only the surface called by Parser is implemented.
function makeMockRenderingManager(): RenderingManager {
    const mock = {
        addSprite: () => {},
        ready: () => {},
    };
    return mock as unknown as RenderingManager;
}

function makeConfiguration(): AnimationConfiguration {
    // Parser only uses the configuration object to forward to other components; none of its
    // own logic dereferences fields. Cast through unknown so we don't have to enumerate
    // every property of AnimationConfiguration.
    return {} as unknown as AnimationConfiguration;
}

// Recursively finds the first descendant node whose id starts with the given prefix.
function findDescendantByIdPrefix(root: Node, prefix: string): Node | undefined {
    if (root.id.startsWith(prefix)) {
        return root;
    }
    for (const child of root.children) {
        const found = findDescendantByIdPrefix(child, prefix);
        if (found) {
            return found;
        }
    }
    return undefined;
}

describe("Parser scene graph structure", () => {
    it("parses a text layer into ControlNode (TRS) -> Node (Anchor) -> SpriteNode", () => {
        const animation: RawLottieAnimation = {
            v: "5.0.0",
            fr: 30,
            ip: 0,
            op: 60,
            w: 100,
            h: 100,
            layers: [
                {
                    ty: 5,
                    ind: 1,
                    nm: "Text",
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: makeTransform(),
                    t: makeTextData(),
                } as RawTextLayer,
            ],
        };

        const parser = new Parser(makeMockPacker(), animation, makeConfiguration(), makeMockRenderingManager());
        const roots = parser.animationInfo.nodes;

        expect(roots).toHaveLength(1);
        const trs = roots[0];
        expect(trs).toBeInstanceOf(ControlNode);
        expect(trs.id).toBe("ControlNode (TRS) - Text");

        expect(trs.children).toHaveLength(1);
        const anchor = trs.children[0];
        // The anchor node is a plain Node, not a ControlNode and not a SpriteNode.
        expect(anchor).toBeInstanceOf(Node);
        expect(anchor).not.toBeInstanceOf(ControlNode);
        expect(anchor).not.toBeInstanceOf(SpriteNode);
        expect(anchor.id).toBe("Node (Anchor) - Text");

        expect(anchor.children).toHaveLength(1);
        const sprite = anchor.children[0];
        expect(sprite).toBeInstanceOf(SpriteNode);
    });

    it("parents a child shape layer under the text layer's anchor Node, not its SpriteNode", () => {
        // Regression test for the structural change that made text layers expose the
        // anchor Node as their parent handle (matching the convention used by shape layers).
        // Children parented to a text layer must follow the layer's anchor point — not the
        // rendered sprite — so their transform composes with the layer transform the same
        // way they would when parented to a shape layer.
        const animation: RawLottieAnimation = {
            v: "5.0.0",
            fr: 30,
            ip: 0,
            op: 60,
            w: 100,
            h: 100,
            layers: [
                {
                    ty: 5,
                    ind: 1,
                    nm: "TextParent",
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: makeTransform(),
                    t: makeTextData(),
                } as RawTextLayer,
                {
                    ty: 4,
                    ind: 2,
                    nm: "ShapeChild",
                    parent: 1,
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: makeTransform(),
                    shapes: [
                        {
                            ty: "rc",
                            nm: "rect",
                        } as any,
                    ],
                } as RawShapeLayer,
            ],
        };

        const parser = new Parser(makeMockPacker(), animation, makeConfiguration(), makeMockRenderingManager());
        const roots = parser.animationInfo.nodes;

        // Only the text layer is a root; the shape layer is parented under it.
        expect(roots).toHaveLength(1);
        const textTrs = roots[0];
        expect(textTrs.id).toBe("ControlNode (TRS) - TextParent");

        const textAnchor = findDescendantByIdPrefix(textTrs, "Node (Anchor) - TextParent");
        expect(textAnchor).toBeDefined();

        const shapeTrs = findDescendantByIdPrefix(textTrs, "ControlNode (TRS) - ShapeChild");
        expect(shapeTrs).toBeDefined();

        // The child shape's ControlNode must be parented to the text layer's anchor Node,
        // NOT to the SpriteNode that renders the text glyphs.
        expect(shapeTrs!.parent).toBe(textAnchor);
        expect(shapeTrs!.parent).not.toBeInstanceOf(SpriteNode);
    });

    it("parents a child shape layer under a parent shape layer's anchor Node (parity baseline)", () => {
        // Baseline: shape-layer-parented-to-shape-layer must produce the same parenting
        // structure as shape-layer-parented-to-text-layer. This guards against accidental
        // divergence between the two layer types.
        const animation: RawLottieAnimation = {
            v: "5.0.0",
            fr: 30,
            ip: 0,
            op: 60,
            w: 100,
            h: 100,
            layers: [
                {
                    ty: 4,
                    ind: 1,
                    nm: "ShapeParent",
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: makeTransform(),
                    shapes: [{ ty: "rc", nm: "rect" } as any],
                } as RawShapeLayer,
                {
                    ty: 4,
                    ind: 2,
                    nm: "ShapeChild",
                    parent: 1,
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: makeTransform(),
                    shapes: [{ ty: "rc", nm: "rect" } as any],
                } as RawShapeLayer,
            ],
        };

        const parser = new Parser(makeMockPacker(), animation, makeConfiguration(), makeMockRenderingManager());
        const roots = parser.animationInfo.nodes;

        const parentAnchor = findDescendantByIdPrefix(roots[0], "Node (Anchor) - ShapeParent");
        const childTrs = findDescendantByIdPrefix(roots[0], "ControlNode (TRS) - ShapeChild");

        expect(parentAnchor).toBeDefined();
        expect(childTrs).toBeDefined();
        expect(childTrs!.parent).toBe(parentAnchor);
    });
});

describe("Parser vector property validation (I-05)", () => {
    // Builds a minimal shape-layer animation whose layer transform sets `position` to the
    // given raw-vector property. We use this to drive the `_fromLottieVector2ToBabylonVector2`
    // path that I-05 tightens up.
    function makeAnimationWithLayerPosition(positionProperty: object): RawLottieAnimation {
        return {
            v: "5.0.0",
            fr: 30,
            ip: 0,
            op: 60,
            w: 100,
            h: 100,
            layers: [
                {
                    ty: 4,
                    ind: 1,
                    nm: "L",
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: { p: positionProperty } as unknown as RawTransform,
                    shapes: [{ ty: "rc", nm: "rect" } as any],
                } as RawShapeLayer,
            ],
        };
    }

    function captureDebugMessages(parser: Parser): string[] {
        const messages: string[] = [];
        const spy = vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
            messages.push(args.map((a) => String(a)).join(" "));
        });
        try {
            parser.debug();
        } finally {
            spy.mockRestore();
        }
        return messages;
    }

    it("logs a warning when 'l' is missing on a 3-component static vector value", () => {
        // Real-world exporters (e.g. After Effects on 2D layers) often emit `[x, y, 0]`
        // triples and omit `l`. Parser must continue to use indices 0/1 (so this animation
        // still parses) but surface a warning so we don't silently regress on unexpected
        // component counts.
        const animation = makeAnimationWithLayerPosition({ a: 0, k: [10, 20, 0] });
        const parser = new Parser(makeMockPacker(), animation, makeConfiguration(), makeMockRenderingManager());

        // Animation must still parse successfully (layer transform applied from x/y).
        expect(parser.animationInfo.nodes).toHaveLength(1);

        const messages = captureDebugMessages(parser);
        expect(messages.some((m) => m.includes("Vector2 missing 'l' with 3-component value"))).toBe(true);
        expect(messages.some((m) => m.includes("Layer: L"))).toBe(true);
    });

    it("logs a warning when 'l' is missing on a 3-component animated vector value", () => {
        const ease = { x: [0, 0], y: [1, 1] };
        const animation = makeAnimationWithLayerPosition({
            a: 1,
            k: [
                { t: 0, s: [0, 0, 0], i: ease, o: ease },
                { t: 30, s: [10, 20, 0], i: ease, o: ease },
            ],
        });
        const parser = new Parser(makeMockPacker(), animation, makeConfiguration(), makeMockRenderingManager());
        const messages = captureDebugMessages(parser);
        expect(messages.some((m) => m.includes("Vector2 missing 'l' with 3-component value"))).toBe(true);
    });

    it("does not log when 'l' is missing on a 2-component value", () => {
        const animation = makeAnimationWithLayerPosition({ a: 0, k: [10, 20] });
        const parser = new Parser(makeMockPacker(), animation, makeConfiguration(), makeMockRenderingManager());
        const messages = captureDebugMessages(parser);
        expect(messages.some((m) => m.includes("Vector2 missing 'l'"))).toBe(false);
    });

    it("does not log when 'l' is explicitly 2", () => {
        const animation = makeAnimationWithLayerPosition({ a: 0, k: [10, 20], l: 2 });
        const parser = new Parser(makeMockPacker(), animation, makeConfiguration(), makeMockRenderingManager());
        const messages = captureDebugMessages(parser);
        expect(messages.some((m) => m.includes("Vector2 missing 'l'"))).toBe(false);
    });

    it("dedupes the missing-'l' warning across many properties of the same shape", () => {
        // Three properties on the same layer (anchor, position, scale) all triggered
        // by the same omission pattern would otherwise spam the log three times.
        const animation: RawLottieAnimation = {
            v: "5.0.0",
            fr: 30,
            ip: 0,
            op: 60,
            w: 100,
            h: 100,
            layers: [
                {
                    ty: 4,
                    ind: 1,
                    nm: "L",
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: {
                        a: { a: 0, k: [0, 0, 0] },
                        p: { a: 0, k: [10, 20, 0] },
                        s: { a: 0, k: [100, 100, 100] },
                    } as unknown as RawTransform,
                    shapes: [{ ty: "rc", nm: "rect" } as any],
                } as RawShapeLayer,
            ],
        };
        const parser = new Parser(makeMockPacker(), animation, makeConfiguration(), makeMockRenderingManager());
        const messages = captureDebugMessages(parser);
        // Each (layer, vectorType) pair gets its own message — but each message only once.
        const matches = messages.filter((m) => m.includes("Vector2 missing 'l' with 3-component value"));
        // AnchorPoint, Position, Scale all distinct VectorType values → 3 unique messages.
        expect(matches).toHaveLength(3);
    });
});

describe("Parser per-axis easing on Vector2 keyframes (I-06)", () => {
    // When a vector keyframe carries per-axis tangent arrays (`o.x`/`o.y`/`i.x`/`i.y` are
    // arrays), index `[0]` belongs to the X axis and `[1]` to the Y axis. The runtime
    // (`Node._interpolateVector2Property`) applies `easeFunction1` to X and `easeFunction2`
    // to Y, so the parser must split the array entries the same way. This test pins down
    // the X/Y component split with an asymmetric fixture (different curve per axis) so a
    // future swap of `[0]`/`[1]` would be caught immediately.
    it("splits asymmetric per-axis tangent arrays so easeFunction1=X (index 0) and easeFunction2=Y (index 1)", () => {
        const animation: RawLottieAnimation = {
            v: "5.0.0",
            fr: 30,
            ip: 0,
            op: 60,
            w: 100,
            h: 100,
            layers: [
                {
                    ty: 4,
                    ind: 1,
                    nm: "L",
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: {
                        p: {
                            a: 1,
                            l: 2,
                            k: [
                                {
                                    t: 0,
                                    s: [0, 0],
                                    // Asymmetric per-axis tangents: X uses (0.1,0.2)→(0.3,0.4),
                                    // Y uses (0.5,0.6)→(0.7,0.8). All four numbers in each
                                    // array differ across axes so swapping [0]/[1] anywhere
                                    // would alter at least one BezierCurve coordinate.
                                    o: { x: [0.1, 0.5], y: [0.2, 0.6] },
                                    i: { x: [0.3, 0.7], y: [0.4, 0.8] },
                                },
                                { t: 30, s: [10, 20] },
                            ],
                        },
                    } as unknown as RawTransform,
                    shapes: [{ ty: "rc", nm: "rect" } as any],
                } as RawShapeLayer,
            ],
        };

        const parser = new Parser(makeMockPacker(), animation, makeConfiguration(), makeMockRenderingManager());

        // Reach into the parsed ControlNode to inspect the Vector2Property keyframes.
        // Surface API doesn't expose them directly, so go through the private field — same
        // approach used elsewhere in this file when validating parser internals.
        const controlNode = parser.animationInfo.nodes[0] as unknown as { _position: { keyframes?: Array<{ easeFunction1: any; easeFunction2: any }> } };
        const keyframes = controlNode._position.keyframes;
        expect(keyframes).toBeDefined();
        expect(keyframes!.length).toBeGreaterThan(0);

        const ease1 = keyframes![0].easeFunction1;
        const ease2 = keyframes![0].easeFunction2;

        // X-axis curve must be built from index [0] of every per-axis array.
        expect(ease1.x1).toBe(0.1);
        expect(ease1.y1).toBe(0.2);
        expect(ease1.x2).toBe(0.3);
        expect(ease1.y2).toBe(0.4);

        // Y-axis curve must be built from index [1] of every per-axis array.
        expect(ease2.x1).toBe(0.5);
        expect(ease2.y1).toBe(0.6);
        expect(ease2.x2).toBe(0.7);
        expect(ease2.y2).toBe(0.8);
    });
});

describe("Parser layer-level shape decorators", () => {
    // Builds a SpritePacker mock that records every addLottieShape invocation so tests can
    // assert which raw elements were rasterized into each sprite.
    function makeRecordingPacker(): { packer: SpritePacker; calls: RawElement[][] } {
        const calls: RawElement[][] = [];
        const baseInfo: SpriteAtlasInfo = {
            uOffset: 0,
            vOffset: 0,
            cellWidth: 16,
            cellHeight: 16,
            widthPx: 16,
            heightPx: 16,
            centerX: 8,
            centerY: 8,
            atlasIndex: 0,
        };

        const mock = {
            addLottieShape: (rawElements: RawElement[]) => {
                // Snapshot the array contents at call time; the parser may mutate sources later.
                calls.push(rawElements.slice());
                return baseInfo;
            },
            addLottieText: () => baseInfo,
            updateAtlasTexture: () => {},
            releaseCanvas: () => {},
            get textures() {
                return [];
            },
            get unsupportedFeatures() {
                return [];
            },
            set rawFonts(_: unknown) {},
        };

        return { packer: mock as unknown as SpritePacker, calls };
    }

    // Mirrors the real-world structure that surfaced this bug (Lottie EDU_V2_07 "Search" layer):
    // two sibling groups followed by a layer-level fill that should color both. Group 1 has its
    // own fill (white inner circle); Group 2 has no fill of its own (the dark gray magnifying-glass
    // body and handle); the layer-level dark-gray Fill 1 is supposed to fill Group 2 (and would also
    // be drawn behind Group 1's white circle, where it is invisible).
    it("propagates a layer-level fill to every sibling group's rasterized shape", () => {
        const innerCirclePath = { ind: 0, ty: "sh", nm: "Path 1", ks: { a: 0, k: { i: [], o: [], v: [], c: true } } };
        const lensPath = { ind: 0, ty: "sh", nm: "Path 2", ks: { a: 0, k: { i: [], o: [], v: [], c: true } } };
        const whiteFill = { ty: "fl", nm: "Fill 1 (white)", c: { a: 0, k: [1, 1, 1, 1] }, o: { a: 0, k: 100 } };
        const grayLayerFill = { ty: "fl", nm: "Fill 1 (gray)", c: { a: 0, k: [0.25, 0.25, 0.25, 1] }, o: { a: 0, k: 100 } };
        const groupTransform = { ty: "tr", nm: "Transform" };

        const animation: RawLottieAnimation = {
            v: "5.0.0",
            fr: 30,
            ip: 0,
            op: 60,
            w: 100,
            h: 100,
            layers: [
                {
                    ty: 4,
                    ind: 1,
                    nm: "Search",
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: makeTransform(),
                    shapes: [
                        { ty: "gr", nm: "Group 1", it: [innerCirclePath, whiteFill, groupTransform] },
                        { ty: "gr", nm: "Group 2", it: [lensPath, groupTransform] },
                        grayLayerFill,
                    ] as any,
                } as RawShapeLayer,
            ],
        };

        const { packer, calls } = makeRecordingPacker();
        new Parser(packer, animation, makeConfiguration(), makeMockRenderingManager());

        // Both groups must produce a sprite call.
        expect(calls).toHaveLength(2);

        // Group 1's call must include both the original white fill (so the inner circle stays
        // white on top) AND the layer-level gray fill (drawn behind it).
        const group1Items = calls[0];
        const group1Fills = group1Items.filter((el) => el.ty === "fl");
        expect(group1Fills).toHaveLength(2);
        expect(group1Fills.map((f) => f.nm)).toContain("Fill 1 (white)");
        expect(group1Fills.map((f) => f.nm)).toContain("Fill 1 (gray)");
        // Transform must remain the last item; Lottie/AE require it and the parser's bounding box
        // / fill code rely on it being terminal.
        expect(group1Items[group1Items.length - 1].ty).toBe("tr");

        // Group 2's call must inherit the layer-level gray fill (otherwise the magnifying glass
        // outline rasterizes to nothing — the original bug from EDU_V2_07).
        const group2Items = calls[1];
        const group2Fills = group2Items.filter((el) => el.ty === "fl");
        expect(group2Fills).toHaveLength(1);
        expect(group2Fills[0].nm).toBe("Fill 1 (gray)");
        expect(group2Items[group2Items.length - 1].ty).toBe("tr");
    });

    // A layer-level stroke (`st`) follows the same Lottie semantics as a layer-level fill: it
    // applies to all sibling shapes/groups above it. Cover it here too so a future tweak to the
    // decorator-detection list does not silently drop strokes.
    it("propagates a layer-level stroke to every sibling group's rasterized shape", () => {
        const path = { ind: 0, ty: "sh", nm: "Path 1", ks: { a: 0, k: { i: [], o: [], v: [], c: true } } };
        const layerStroke = {
            ty: "st",
            nm: "Stroke 1",
            c: { a: 0, k: [0, 0, 0, 1] },
            o: { a: 0, k: 100 },
            w: { a: 0, k: 2 },
        };
        const groupTransform = { ty: "tr", nm: "Transform" };

        const animation: RawLottieAnimation = {
            v: "5.0.0",
            fr: 30,
            ip: 0,
            op: 60,
            w: 100,
            h: 100,
            layers: [
                {
                    ty: 4,
                    ind: 1,
                    nm: "Outlined",
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: makeTransform(),
                    shapes: [{ ty: "gr", nm: "Group 1", it: [path, groupTransform] }, layerStroke] as any,
                } as RawShapeLayer,
            ],
        };

        const { packer, calls } = makeRecordingPacker();
        new Parser(packer, animation, makeConfiguration(), makeMockRenderingManager());

        expect(calls).toHaveLength(1);
        const group1Items = calls[0];
        const group1Strokes = group1Items.filter((el) => el.ty === "st");
        expect(group1Strokes).toHaveLength(1);
        expect(group1Strokes[0].nm).toBe("Stroke 1");
    });
});

describe("Parser solid layer (ty:1)", () => {
    // Same recording packer pattern as the layer-level decorator suite above. Defined inline so each
    // describe block is self-contained.
    function makeRecordingPacker(): { packer: SpritePacker; calls: RawElement[][] } {
        const calls: RawElement[][] = [];
        const baseInfo: SpriteAtlasInfo = {
            uOffset: 0,
            vOffset: 0,
            cellWidth: 16,
            cellHeight: 16,
            widthPx: 16,
            heightPx: 16,
            centerX: 8,
            centerY: 8,
            atlasIndex: 0,
        };

        const mock = {
            addLottieShape: (rawElements: RawElement[]) => {
                calls.push(rawElements.slice());
                return baseInfo;
            },
            addLottieText: () => baseInfo,
            updateAtlasTexture: () => {},
            releaseCanvas: () => {},
            get textures() {
                return [];
            },
            get unsupportedFeatures() {
                return [];
            },
            set rawFonts(_: unknown) {},
        };

        return { packer: mock as unknown as SpritePacker, calls };
    }

    // Recording rendering manager so tests can assert the on-screen sprite dimensions handed to the
    // sprite renderer. Solid layers stretch a 1x1 atlas cell to full sw*sh, so the on-screen size
    // is the meaningful surface — distinct from `widthPx` reported by the packer.
    function makeRecordingRenderingManager(): { rm: RenderingManager; sprites: { width: number; height: number }[] } {
        const sprites: { width: number; height: number }[] = [];
        const mock = {
            addSprite: (sprite: { width: number; height: number }) => {
                // Snapshot at call time — the parser may continue mutating the sprite afterwards.
                sprites.push({ width: sprite.width, height: sprite.height });
            },
            ready: () => {},
        };
        return { rm: mock as unknown as RenderingManager, sprites };
    }

    it("rasterizes a ty:1 solid layer using a 1x1 atlas cell stretched to full sw*sh on screen", () => {
        // Mirrors the "Grey" backplate in EDU/Pages.json: a 960x540 #f0f0f0 solid layer that the
        // official Lottie player draws as a flat backplate. Solid layers are by definition a single
        // flat color (Lottie schema only allows `sc` as a CSS color string), so we rasterize a 1x1
        // cell into the atlas and let the sprite renderer stretch it. Otherwise a 960x540 backplate
        // at devicePixelRatio=2 would consume ~90% of a 2048-pixel atlas page.
        const animation: RawLottieAnimation = {
            v: "5.0.0",
            fr: 30,
            ip: 0,
            op: 60,
            w: 960,
            h: 540,
            layers: [
                {
                    ty: 1,
                    ind: 1,
                    nm: "Grey",
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: makeTransform(),
                    sw: 960,
                    sh: 540,
                    sc: "#f0f0f0",
                } as any,
            ],
        };

        const { packer, calls } = makeRecordingPacker();
        const { rm, sprites } = makeRecordingRenderingManager();
        new Parser(packer, animation, makeConfiguration(), rm);

        // Solid layer must produce exactly one rasterization call containing a rectangle and a fill
        // (in that order, mirroring the [shape, decorator] convention used by Lottie shape layers).
        expect(calls).toHaveLength(1);
        const items = calls[0];
        expect(items).toHaveLength(2);

        const rect = items[0] as any;
        const fill = items[1] as any;
        expect(rect.ty).toBe("rc");
        expect(fill.ty).toBe("fl");

        // Atlas cell geometry: 1x1 lottie pixel centered at (0.5, 0.5). Independent of sw/sh — that
        // sizing happens on the sprite (below), not in the atlas.
        expect(rect.s.k).toEqual([1, 1]);
        expect(rect.p.k).toEqual([0.5, 0.5]);

        // Fill color: #f0f0f0 -> 240/255 on each channel, alpha 1.
        const expectedChannel = 240 / 255;
        expect(fill.c.k[0]).toBeCloseTo(expectedChannel, 6);
        expect(fill.c.k[1]).toBeCloseTo(expectedChannel, 6);
        expect(fill.c.k[2]).toBeCloseTo(expectedChannel, 6);
        expect(fill.c.k[3]).toBe(1);

        // On-screen sprite size must reflect the layer's full sw/sh — that's the dimension the GPU
        // stretches the 1x1 cell to. Pages.json's "Grey" layer is the regression case: dropping
        // these dimensions or wiring sw/sh into the atlas instead would either lose the backplate
        // or eat the atlas.
        expect(sprites).toHaveLength(1);
        expect(sprites[0].width).toBe(960);
        expect(sprites[0].height).toBe(540);
    });

    it("handles short #RGB hex form for solid layer color", () => {
        // After Effects normally exports the long form, but the CSS spec also allows #RGB. Cover it
        // explicitly so the helper's two-branch path doesn't regress on shorter strings (e.g.
        // hand-edited animations or third-party exporters).
        const animation: RawLottieAnimation = {
            v: "5.0.0",
            fr: 30,
            ip: 0,
            op: 60,
            w: 100,
            h: 100,
            layers: [
                {
                    ty: 1,
                    ind: 1,
                    nm: "Short",
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: makeTransform(),
                    sw: 100,
                    sh: 100,
                    sc: "#f00",
                } as any,
            ],
        };

        const { packer, calls } = makeRecordingPacker();
        new Parser(packer, animation, makeConfiguration(), makeMockRenderingManager());

        expect(calls).toHaveLength(1);
        const fill = calls[0][1] as any;
        expect(fill.c.k[0]).toBe(1);
        expect(fill.c.k[1]).toBe(0);
        expect(fill.c.k[2]).toBe(0);
    });

    it("skips rasterization but still registers the anchor node when sw/sh are zero", () => {
        // Defensive: malformed solid layer with no usable rectangle. We must not call addLottieShape
        // with zero-size geometry (which produces zero-area sprites and risks divide-by-zero in
        // bounding-box code), but we still need a valid anchor slot so child layers parented via
        // `ind` resolve correctly.
        const animation: RawLottieAnimation = {
            v: "5.0.0",
            fr: 30,
            ip: 0,
            op: 60,
            w: 100,
            h: 100,
            layers: [
                {
                    ty: 1,
                    ind: 1,
                    nm: "Empty",
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: makeTransform(),
                    sw: 0,
                    sh: 0,
                    sc: "#000000",
                } as any,
                {
                    ty: 4,
                    ind: 2,
                    nm: "Child",
                    parent: 1,
                    ip: 0,
                    op: 60,
                    st: 0,
                    ks: makeTransform(),
                    shapes: [{ ty: "rc", nm: "rect" } as any],
                } as RawShapeLayer,
            ],
        };

        const { packer, calls } = makeRecordingPacker();
        const parser = new Parser(packer, animation, makeConfiguration(), makeMockRenderingManager());

        // Only the child shape rasterizes; the malformed solid layer is skipped.
        expect(calls).toHaveLength(1);

        // Solid layer's anchor was still created so the child resolves its parent and ends up as a
        // descendant of the solid layer's ControlNode (not a stray root).
        const roots = parser.animationInfo.nodes;
        expect(roots).toHaveLength(1);
        expect(roots[0].id).toBe("ControlNode (TRS) - Empty");
    });
});
