import { describe, it, expect } from "vitest";

import { Parser } from "../../src/parsing/parser";
import { type SpritePacker, type SpriteAtlasInfo } from "../../src/parsing/spritePacker";
import { type RenderingManager } from "../../src/rendering/renderingManager";
import { SpriteNode } from "../../src/nodes/spriteNode";
import { ControlNode } from "../../src/nodes/controlNode";
import { Node } from "../../src/nodes/node";
import { type RawLottieAnimation, type RawShapeLayer, type RawTextLayer, type RawTransform } from "../../src/parsing/rawTypes";
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
