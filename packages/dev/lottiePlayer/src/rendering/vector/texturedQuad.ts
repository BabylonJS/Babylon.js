// Shared textured-quad renderer — the common body of the text (ty 5) and image (ty 2) renderers,
// which are identical except for where their texture comes from. Both draw one premultiplied,
// alpha-blended quad per layer (a layer-local rect mapped through the layer's world matrix) using
// the same interleaved pos.xy / uv.xy / alpha layout, the same shader, and a growable vertex buffer.
//
// The caller supplies an ITexturedQuadSource: the layer kind, how to find a layer's quad rect and
// texture, an optional extra readiness check (image decode is async), and texture teardown.

import "core/Engines/Extensions/engine.alpha";
import "core/Engines/Extensions/engine.dynamicBuffer";

import { Constants } from "core/Engines/constants";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type Nullable } from "core/types";
import { type ThinEngine } from "core/Engines/thinEngine";
import { type ThinTexture } from "core/Materials/Textures/thinTexture";

import { type ILayerRenderContext, type ILayerRenderer } from "./layerRenderer";
import { type IParsedLayer } from "../../animation/parse";
import { TransformPoint, type Mat2D } from "../../animation/matrix2D";

const FloatsPerVert = 5; // pos.xy, uv.xy, alpha
const VertsPerQuad = 6;

const QuadVertexShader = `#version 300 es
layout(location = 0) in vec2 position;
layout(location = 1) in vec2 uv;
layout(location = 2) in float alpha;
uniform vec2 uScreen;
out vec2 vUv;
out float vAlpha;
void main() {
  vUv = uv;
  vAlpha = alpha;
  gl_Position = vec4(position.x / uScreen.x * 2.0 - 1.0, 1.0 - position.y / uScreen.y * 2.0, 0.0, 1.0);
}`;

const QuadFragmentShader = `#version 300 es
precision highp float;
in vec2 vUv;
in float vAlpha;
uniform sampler2D uTex;
layout(location = 0) out vec4 fragColor;
void main() {
  // Source is straight alpha (Canvas2D text / decoded image); premultiply here for "over" compositing.
  vec4 c = texture(uTex, vUv);
  float a = c.a * vAlpha;
  fragColor = vec4(c.rgb * a, a);
}`;

/** The layer-local quad rect an {@link ITexturedQuadSource} fills for a layer. */
export interface IQuadRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

/** Per-variant hooks for {@link CreateTexturedQuadRenderer}. */
export interface ITexturedQuadSource {
    /** Lottie layer `ty` this renderer handles (2 image, 5 text). */
    kind: number;
    /** Extra readiness beyond effect compilation (e.g. async image decode). */
    ready?: () => boolean;
    /** Fill `rect` with the layer's local quad; return `false` to skip the layer this frame. */
    fillRect(layer: IParsedLayer, rect: IQuadRect): boolean;
    /** The texture to bind for a layer at record time, or `null` to skip. */
    textureFor(layer: IParsedLayer): Nullable<ThinTexture>;
    /** Dispose the renderer-owned textures. */
    disposeTextures(): void;
}

// Interleaved pos.xy / uv.xy / alpha. bindBuffersDirectly derives each attribute's byte offset by
// accumulating these sizes, which yields 0 / 8 / 16 for this layout.
const QuadVertexDeclaration = [2, 2, 1];

/**
 * Creates a textured-quad renderer for one layer kind (text or image) from a variant source.
 * @param engine The engine to render with.
 * @param source The per-variant hooks describing where quads and textures come from.
 * @returns A layer renderer for the source's layer kind.
 */
export function CreateTexturedQuadRenderer(engine: ThinEngine, source: ITexturedQuadSource): ILayerRenderer {
    const effect = engine.createEffect({ vertexSource: QuadVertexShader, fragmentSource: QuadFragmentShader }, ["position", "uv", "alpha"], ["uScreen"], ["uTex"]);

    const verts: number[] = [];
    const tokenLayer: IParsedLayer[] = [];
    const corner: [number, number] = [0, 0];
    const rect: IQuadRect = { left: 0, top: 0, width: 0, height: 0 };

    let vbo: Nullable<DataBuffer> = null;
    let vertData = new Float32Array(0);
    let vertCapacity = 0; // in floats
    // See fillRenderer: bindBuffersDirectly wants an index buffer even though every draw is a
    // drawArraysType over a tightly packed stream.
    let unusedIb: Nullable<DataBuffer> = null;

    function pushVert(x: number, y: number, u: number, v: number, alpha: number): void {
        verts.push(x, y, u, v, alpha);
    }

    function ensureBuffers(quads: number): void {
        const neededFloats = Math.max(quads * VertsPerQuad * FloatsPerVert, FloatsPerVert);
        if (!vbo || vertCapacity < neededFloats) {
            if (vbo) {
                engine._releaseBuffer(vbo);
            }
            vertCapacity = Math.max(neededFloats, Math.ceil((vertCapacity || 1024) * 1.5));
            vertData = new Float32Array(vertCapacity);
            vbo = engine.createDynamicVertexBuffer(vertData);
        }
        if (!unusedIb) {
            unusedIb = engine.createIndexBuffer(new Uint16Array([0, 1, 2]));
        }
    }

    return {
        kind: source.kind,
        isReady: () => effect.isReady() && (source.ready ? source.ready() : true),
        beginFrame() {
            verts.length = 0;
            tokenLayer.length = 0;
        },
        emitLayer(layer: IParsedLayer, world: Mat2D, layerAlpha: number): number {
            if (layerAlpha <= 0.0001 || !source.fillRect(layer, rect)) {
                return -1;
            }
            const l = rect.left;
            const tp = rect.top;
            const rr = l + rect.width;
            const b = tp + rect.height;
            TransformPoint(world, l, tp, corner);
            const ax = corner[0];
            const ay = corner[1];
            TransformPoint(world, rr, tp, corner);
            const bx = corner[0];
            const by = corner[1];
            TransformPoint(world, rr, b, corner);
            const cx = corner[0];
            const cy = corner[1];
            TransformPoint(world, l, b, corner);
            const dx = corner[0];
            const dy = corner[1];
            pushVert(ax, ay, 0, 0, layerAlpha);
            pushVert(bx, by, 1, 0, layerAlpha);
            pushVert(cx, cy, 1, 1, layerAlpha);
            pushVert(ax, ay, 0, 0, layerAlpha);
            pushVert(cx, cy, 1, 1, layerAlpha);
            pushVert(dx, dy, 0, 1, layerAlpha);
            const token = tokenLayer.length;
            tokenLayer.push(layer);
            return token;
        },
        flush(ctx: ILayerRenderContext) {
            const quads = tokenLayer.length;
            ensureBuffers(Math.max(quads, 1));
            if (quads > 0 && vbo) {
                vertData.set(verts);
                engine.updateDynamicVertexBuffer(vbo, vertData, 0, verts.length * Float32Array.BYTES_PER_ELEMENT);
            }
            engine.enableEffect(effect);
            effect.setFloat2("uScreen", ctx.screenW, ctx.screenH);
        },
        recordLayer(token: number) {
            const texture = source.textureFor(tokenLayer[token]);
            if (!texture || !vbo || !unusedIb || !effect.isReady()) {
                return;
            }
            engine.enableEffect(effect);
            // (Re)bind the interleaved layout — the fill renderer binds its own single-attribute
            // layout between quads when layers interleave by z-order.
            engine.bindBuffersDirectly(vbo, unusedIb, QuadVertexDeclaration, FloatsPerVert * Float32Array.BYTES_PER_ELEMENT, effect);
            // Textured quad: no stencil, no cull, premultiplied "over".
            engine.setColorWrite(true);
            engine.setState(false);
            engine.stencilState.stencilTest = false;
            engine.setAlphaMode(Constants.ALPHA_PREMULTIPLIED);
            effect.setTexture("uTex", texture);
            engine.drawArraysType(Constants.MATERIAL_TriangleFillMode, token * VertsPerQuad, VertsPerQuad);
        },
        dispose() {
            if (vbo) {
                engine._releaseBuffer(vbo);
                vbo = null;
            }
            if (unusedIb) {
                engine._releaseBuffer(unusedIb);
                unusedIb = null;
            }
            source.disposeTextures();
            effect.dispose();
        },
    };
}
