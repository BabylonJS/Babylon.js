import { type Scene } from "../../../scene.pure";
import { type AbstractMesh } from "../../../Meshes/abstractMesh.pure";
import { type HtmlTexture } from "./htmlTexture";
import { type Observer } from "../../../Misc/observable.pure";
import { type Nullable } from "../../../types";

import { Matrix, Vector3 } from "../../../Maths/math.vector.pure";
import { Viewport } from "../../../Maths/math.viewport";

// Attribution: the overlay-and-hit-test technique used here is prior art from `three-html-render`
// (Palash Bansal, MIT), three.js' `InteractionManager`, and Jake Archibald's `curved-markup` demo.
// The implementation below is a clean-room rewrite against Babylon.js' own projection APIs.

/**
 * Builds the CSS `transform` string that positions an overlay element over the projected face of a mesh.
 *
 * The transform is applied with `transform-origin: 0 0`. Reading right to left it centers the element on
 * its own origin, scales and rotates it to match the projected face, then translates it to the projected
 * center (in CSS pixels, top-left origin).
 * @param centerX projected center X in CSS pixels
 * @param centerY projected center Y in CSS pixels
 * @param scaleX horizontal scale to apply to the element
 * @param scaleY vertical scale to apply to the element
 * @param rotation in-plane rotation in radians
 * @param elementWidth element width in pixels
 * @param elementHeight element height in pixels
 * @returns the CSS transform string
 */
export function ComputeOverlayCssTransform(
    centerX: number,
    centerY: number,
    scaleX: number,
    scaleY: number,
    rotation: number,
    elementWidth: number,
    elementHeight: number
): string {
    return `translate(${centerX}px, ${centerY}px) rotate(${rotation}rad) scale(${scaleX}, ${scaleY}) translate(${-elementWidth / 2}px, ${-elementHeight / 2}px)`;
}

/**
 * Options for {@link HtmlInteractionManager}.
 */
export interface IHtmlInteractionManagerOptions {
    /** The DOM element to overlay (defaults to the texture's element). */
    targetElement?: HTMLElement;
    /** Whether the overlay element captures pointer events so the browser hit-tests it natively (default true). */
    enablePointerEvents?: boolean;
}

/**
 * Overlays the live HTML element of an {@link HtmlTexture} on top of the projected face of a planar mesh,
 * so the browser hit-tests the real DOM element natively (enabling focus, text selection and form input).
 *
 * Each frame the mesh face is projected to screen space and the element is translated, scaled and rotated
 * to match. This is best suited to planar, camera-facing surfaces. For arbitrary or curved meshes, use the
 * UV-based {@link HtmlRaycastInteractionManager} instead.
 *
 * The overlay is screen-aligned (position, size and in-plane rotation); it does not apply a full
 * perspective skew, so steeply oblique faces will not be perspective-correct.
 */
export class HtmlInteractionManager {
    private readonly _scene: Scene;
    private readonly _mesh: AbstractMesh;
    private readonly _element: HTMLElement;
    private _observer: Nullable<Observer<Scene>>;
    private _previousTransform: string = "";

    // Reused across frames to avoid per-frame allocations.
    private readonly _viewport = new Viewport(0, 0, 0, 0);
    private readonly _center = new Vector3();
    private readonly _xAxis = new Vector3();
    private readonly _yAxis = new Vector3();
    private readonly _projectedCenter = new Vector3();
    private readonly _projectedX = new Vector3();
    private readonly _projectedY = new Vector3();

    /**
     * Creates an overlay interaction manager.
     * @param scene the scene whose camera drives the projection
     * @param texture the HTML texture whose element should be overlaid
     * @param mesh the planar mesh displaying the texture
     * @param options optional configuration
     */
    constructor(scene: Scene, texture: HtmlTexture, mesh: AbstractMesh, options: IHtmlInteractionManagerOptions = {}) {
        this._scene = scene;
        this._mesh = mesh;
        this._element = options.targetElement ?? texture.element;

        this._element.style.position = "absolute";
        this._element.style.left = "0px";
        this._element.style.top = "0px";
        this._element.style.transformOrigin = "0 0";
        this._element.style.pointerEvents = (options.enablePointerEvents ?? true) ? "auto" : "none";

        this._observer = scene.onAfterRenderObservable.add(() => this._update());
    }

    private _update(): void {
        const camera = this._scene.activeCamera;
        const engine = this._scene.getEngine();
        if (!camera) {
            return;
        }

        const boundingBox = this._mesh.getBoundingInfo().boundingBox;
        const world = this._mesh.getWorldMatrix();
        const extend = boundingBox.extendSize;

        this._center.copyFrom(boundingBox.centerWorld);
        // World-space half-axis directions of the mesh face.
        Vector3.TransformNormalToRef(new Vector3(extend.x, 0, 0), world, this._xAxis);
        Vector3.TransformNormalToRef(new Vector3(0, extend.y, 0), world, this._yAxis);

        const transform = this._scene.getTransformMatrix();
        camera.viewport.toGlobalToRef(engine.getRenderWidth(), engine.getRenderHeight(), this._viewport);

        Vector3.ProjectToRef(this._center, Matrix.IdentityReadOnly, transform, this._viewport, this._projectedCenter);
        Vector3.ProjectToRef(this._center.add(this._xAxis), Matrix.IdentityReadOnly, transform, this._viewport, this._projectedX);
        Vector3.ProjectToRef(this._center.add(this._yAxis), Matrix.IdentityReadOnly, transform, this._viewport, this._projectedY);

        // Hide the overlay when the face is behind the camera.
        if (this._projectedCenter.z < 0 || this._projectedCenter.z > 1) {
            this._setTransform("translate(-99999px, -99999px)");
            return;
        }

        const dpr = engine.getHardwareScalingLevel();
        const centerX = this._projectedCenter.x * dpr;
        const centerY = this._projectedCenter.y * dpr;

        const halfWidth = Math.hypot(this._projectedX.x - this._projectedCenter.x, this._projectedX.y - this._projectedCenter.y) * dpr;
        const halfHeight = Math.hypot(this._projectedY.x - this._projectedCenter.x, this._projectedY.y - this._projectedCenter.y) * dpr;
        const rotation = Math.atan2(this._projectedX.y - this._projectedCenter.y, this._projectedX.x - this._projectedCenter.x);

        const elementWidth = this._element.offsetWidth || 1;
        const elementHeight = this._element.offsetHeight || 1;
        const scaleX = (2 * halfWidth) / elementWidth;
        const scaleY = (2 * halfHeight) / elementHeight;

        this._setTransform(ComputeOverlayCssTransform(centerX, centerY, scaleX, scaleY, rotation, elementWidth, elementHeight));
    }

    private _setTransform(transform: string): void {
        if (transform === this._previousTransform) {
            return;
        }
        this._previousTransform = transform;
        this._element.style.transform = transform;
    }

    /**
     * Detaches the manager and stops updating the overlay.
     */
    public dispose(): void {
        if (this._observer) {
            this._scene.onAfterRenderObservable.remove(this._observer);
            this._observer = null;
        }
    }
}
