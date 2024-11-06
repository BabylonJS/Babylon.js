import { Mesh } from "core/Meshes/mesh";
import { CreatePlaneVertexData } from "core/Meshes/Builders/planeBuilder";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Matrix } from "core/Maths/math";
import { PointerEventsCaptureBehavior } from "./pointerEventsCaptureBehavior";
import type { Scene } from "core/scene";
import { Logger } from "core/Misc/logger";
import type { FitStrategyType } from "./fitStrategy";
import { FitStrategy } from "./fitStrategy";

/**
 * This class represents HTML content that we want to render as though it is part of the scene.  The HTML content is actually
 * rendered below the canvas, but a depth mask is created by this class that writes to the depth buffer but does not
 * write to the color buffer, effectively punching a hole in the canvas.  CSS transforms are used to scale, translate, and rotate
 * the HTML content so that it matches the camera and mesh orientation.  The class supports interactions in editable and non-editable mode.
 * In non-editable mode (the default), events are passed to the HTML content when the pointer is over the mask (and not occluded by other meshes
 * in the scene).
 * #HVHYJC#5
 * #B17TC7#112
 */
export class HtmlMesh extends Mesh {
    /**
     * Helps identifying a html mesh from a regular mesh
     */
    public get isHtmlMesh() {
        return true;
    }

    // Override the super class's _isEnabled property so we can control when the mesh
    // is enabled.  I.e., we don't want to render the mesh until there is content to show.
    private _enabled = false;

    // The mesh is ready when content has been set and the content size has been set
    // The former is done by the user, the latter is done by the renderer.
    private _ready = false;

    /**
     * @internal
     */
    public _isCanvasOverlay = false;

    private _requiresUpdate = true;

    private _element?: HTMLElement;
    private _width?: number;
    private _height?: number;

    private _inverseScaleMatrix: Matrix | null = null;

    private _captureOnPointerEnter: boolean = true;
    private _pointerEventCaptureBehavior: PointerEventsCaptureBehavior | null = null;

    private _sourceWidth: number | null = null;
    private _sourceHeight: number | null = null;

    /**
     * Return the source width of the content in pixels
     */
    public get sourceWidth() {
        return this._sourceWidth;
    }

    /**
     * Return the source height of the content in pixels
     */
    public get sourceHeight() {
        return this._sourceHeight;
    }

    private _worldMatrixUpdateObserver: any;

    private _fitStrategy: FitStrategyType = FitStrategy.NONE;

    /**
     * Contruct an instance of HtmlMesh
     * @param scene
     * @param id The id of the mesh.  Will be used as the id of the HTML element as well.
     * @param options object with optional parameters
     */
    constructor(scene: Scene, id: string, { captureOnPointerEnter = true, isCanvasOverlay = false, fitStrategy = FitStrategy.NONE } = {}) {
        super(id, scene);

        // Requires a browser to work.  Bail if we aren't running in a browser
        if (typeof document === "undefined") {
            Logger.Warn(`Creating an instance of an HtmlMesh with id ${id} outside of a browser.  The mesh will not be visible.`);
            return;
        }

        this._fitStrategy = fitStrategy;
        this._isCanvasOverlay = isCanvasOverlay;
        this._createMask();
        this._element = this._createElement();

        // Set enabled by default, so this will show as soon as it's ready
        this.setEnabled(true);

        this._captureOnPointerEnter = captureOnPointerEnter;

        // Create a behavior to capture pointer events
        this._pointerEventCaptureBehavior = new PointerEventsCaptureBehavior(this.capturePointerEvents.bind(this), this.releasePointerEvents.bind(this), {
            captureOnPointerEnter: this._captureOnPointerEnter,
        });
        this.addBehavior(this._pointerEventCaptureBehavior);
    }

    /**
     * The width of the content in pixels
     */
    public get width() {
        return this._width;
    }

    /**
     * The height of the content in pixels
     */
    public get height() {
        return this._height;
    }

    /**
     * The HTML element that is being rendered as a mesh
     */
    public get element() {
        return this._element;
    }

    /**
     * True if the mesh has been moved, rotated, or scaled since the last time this
     * property was read.  This property is reset to false after reading.
     */
    public get requiresUpdate() {
        return this._requiresUpdate;
    }

    /**
     * Enable capture for the pointer when entering the mesh area
     */
    public set captureOnPointerEnter(captureOnPointerEnter: boolean) {
        this._captureOnPointerEnter = captureOnPointerEnter;
        if (this._pointerEventCaptureBehavior) {
            this._pointerEventCaptureBehavior.captureOnPointerEnter = captureOnPointerEnter;
        }
    }

    /**
     * Disposes of the mesh and the HTML element
     */
    public override dispose() {
        super.dispose();
        this._element?.remove();
        this._element = undefined;
        if (this._pointerEventCaptureBehavior) {
            this._pointerEventCaptureBehavior.dispose();
            this._pointerEventCaptureBehavior = null;
        }
    }

    /**
     * @internal
     */
    public _markAsUpdated() {
        this._requiresUpdate = false;
    }

    /**
     * Sets the content of the element to the specified content adjusting the mesh scale to match and making it visible.
     * If the the specified content is undefined, then it will make the mesh invisible.  In either case it will clear the
     * element content first.
     * @param element The element to render as a mesh
     * @param width The width of the mesh in Babylon units
     * @param height The height of the mesh in Babylon units
     */
    setContent(element: HTMLElement, width: number, height: number) {
        // If content is changed, we are no longer ready
        this._setAsReady(false);

        // Also invalidate the source width and height
        this._sourceWidth = null;
        this._sourceHeight = null;

        if (!this._element) {
            return;
        }

        this._width = width;
        this._height = height;
        this._requiresUpdate = true;

        this.scaling.setAll(1);

        if (element) {
            this._element!.appendChild(this._fitStrategy.wrapElement(element));

            this._updateScaleIfNecessary();
        }

        if (this.sourceWidth && this.sourceHeight) {
            this._setAsReady(true);
        }
    }

    // Overides BABYLON.Mesh.setEnabled
    public override setEnabled(enabled: boolean) {
        // Capture requested enabled state
        this._enabled = enabled;

        // If disabling or enabling and we are ready
        if (!enabled || this._ready) {
            this._doSetEnabled(enabled);
        }
    }

    /**
     * Sets the content size in pixels
     * @param width width of the source
     * @param height height of the source
     */
    public setContentSizePx(width: number, height: number) {
        this._sourceWidth = width;
        this._sourceHeight = height;

        if (!this._element || !this._element.firstElementChild) {
            return;
        }

        this._fitStrategy.updateSize(this._element.firstElementChild! as HTMLElement, width, height);

        this._updateScaleIfNecessary();

        if (this.width && this.height) {
            this._setAsReady(true);
        }
    }

    protected _setAsReady(ready: boolean) {
        this._ready = ready;
        if (ready) {
            this._doSetEnabled(this._enabled);
        } else {
            this._doSetEnabled(false);
        }
    }

    protected _doSetEnabled(enabled: boolean) {
        if (!this._element) {
            return;
        }

        //if enabled, then start listening for changes to the
        // scaling, rotation, and position.  otherwise stop listening
        if (enabled && !this._worldMatrixUpdateObserver) {
            this._worldMatrixUpdateObserver = this.onAfterWorldMatrixUpdateObservable.add(() => {
                this._requiresUpdate = true;
            });
        } else if (!enabled) {
            this._worldMatrixUpdateObserver?.remove();
            this._worldMatrixUpdateObserver = null;
        }

        // If enabled, then revert the content element display
        // otherwise hide it
        this._element!.style.display = enabled ? "" : "none";
        // Capture the content z index
        this._setElementZIndex(this.position.z * -10000);
        super.setEnabled(enabled);
    }

    protected _updateScaleIfNecessary() {
        // If we have setContent before, the content scale is baked into the mesh.  If we don't reset the vertices to
        // the original size, then we will multiply the scale when we bake the scale below.  By applying the inverse, we back out
        // the scaling that has been done so we are starting from the same point.
        // First reset the scale to 1
        this.scaling.setAll(1);
        // Then back out the original vertices changes to match the content scale
        if (this._inverseScaleMatrix) {
            this.bakeTransformIntoVertices(this._inverseScaleMatrix);
            // Clear out the matrix so it doesn't get applied again unless we scale
            this._inverseScaleMatrix = null;
        }

        // Set scale to match content.  Note we can't just scale the mesh, because that will scale the content as well
        // What we need to do is compute a scale matrix and then bake that into the mesh vertices.  This will leave the
        // mesh scale at 1, so our content will stay it's original width and height until we scale the mesh.
        const scaleX = this._width || 1;
        const scaleY = this._height || 1;
        const scaleMatrix = Matrix.Scaling(scaleX, scaleY, 1);
        this.bakeTransformIntoVertices(scaleMatrix);

        // Get an inverse of the scale matrix that we can use to back out the scale changes we have made so
        // we don't multiply the scale.
        this._inverseScaleMatrix = new Matrix();
        scaleMatrix.invertToRef(this._inverseScaleMatrix);
    }

    protected _createMask() {
        const vertexData = CreatePlaneVertexData({ width: 1, height: 1 });
        vertexData.applyToMesh(this);

        const scene = this.getScene();
        this.checkCollisions = true;

        const depthMask = new StandardMaterial(`${this.id}-mat`, scene);
        if (!this._isCanvasOverlay) {
            depthMask.backFaceCulling = false;
            depthMask.disableColorWrite = true;
            depthMask.disableLighting = true;
        }

        this.material = depthMask;

        // Optimization - Freeze material since it never needs to change
        this.material.freeze();
    }

    protected _setElementZIndex(zIndex: number) {
        if (this._element) {
            this._element!.style.zIndex = `${zIndex}`;
        }
    }

    /**
     * Callback used by the PointerEventsCaptureBehavior to capture pointer events
     */
    capturePointerEvents() {
        if (!this._element) {
            return;
        }

        // Enable dom content to capture pointer events
        this._element.style.pointerEvents = "auto";

        // Supress events outside of the dom content
        document.getElementsByTagName("body")[0].style.pointerEvents = "none";
    }

    /**
     * Callback used by the PointerEventsCaptureBehavior to release pointer events
     */
    releasePointerEvents() {
        if (!this._element) {
            return;
        }

        // Enable pointer events on canvas
        document.getElementsByTagName("body")[0].style.pointerEvents = "auto";

        // Disable pointer events on dom content
        this._element.style.pointerEvents = "none";
    }

    protected _createElement() {
        // Requires a browser to work.  Bail if we aren't running in a browser
        if (typeof document === "undefined") {
            return;
        }
        const div = document.createElement("div");
        div.id = this.id;
        div.style.backgroundColor = this._isCanvasOverlay ? "transparent" : "#000";
        div.style.zIndex = "1";
        div.style.position = "absolute";
        div.style.pointerEvents = "none";
        div.style.backfaceVisibility = "hidden";

        return div;
    }
}
