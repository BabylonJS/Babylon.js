import { ShaderMaterial } from "babylonjs/Materials/shaderMaterial";
import { Scene } from "babylonjs/scene";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { Color3, TmpColors } from "babylonjs/Maths/math.color";
import { Vector3 } from "babylonjs/Maths/math.vector";

import "./shaders/handle.vertex";
import "./shaders/handle.fragment";

/**
 * Class used to render gizmo handles with fluent design
 */
export class HandleMaterial extends ShaderMaterial {
    private _hover: boolean = false;
    private _drag: boolean = false;
    private _onBeforeRender: Nullable<Observer<Scene>>;
    private _color: Color3 = new Color3();
    private _scale: number = 1;
    private _targetColor: Color3;
    private _targetScale: number;
    private _lastTick = -1;

    /**
     * Is the material indicating hovering state
     */
    public get hover(): boolean {
        return this._hover;
    }

    public set hover(b: boolean) {
        this._hover = b;

        this._updateInterpolationTarget();
    }

    /**
     * Is the material indicating drag state
     */
    public get drag(): boolean {
        return this._drag;
    }

    public set drag(b: boolean) {
        this._drag = b;

        this._updateInterpolationTarget();
    }

    /**
     * Length of animation
     */
    public animationLength: number = 100;

    /**
     * Color of the handle when hovered
     */
    public hoverColor: Color3 = new Color3(0, 0.467, 0.84);

    /**
     * Color of the handle when idle
     */
    public baseColor: Color3 = new Color3(1, 1, 1);

    /**
     * Scale of the handle when hovered
     */
    public hoverScale: number = 0.75;

    /**
     * Scale of the handle when idle
     */
    public baseScale: number = 0.35;

    /**
     * Scale of the handle when dragged
     */
    public dragScale: number = 0.55;

    /**
     * @hidden
     */
    public _positionOffset: Vector3 = Vector3.Zero();

    /**
     * Creates a handle material
     * @param name Name of the material
     * @param scene Scene
     */
    constructor(name: string, scene: Scene) {
        super(name, scene, "handle", {
            attributes: ["position"],
            uniforms: ["worldViewProjection", "color", "scale", "positionOffset"],
            needAlphaBlending: false,
            needAlphaTesting: false,
        });

        this._updateInterpolationTarget();

        // Register callback for scene after render
        this._lastTick = Date.now();
        this._onBeforeRender = this.getScene().onBeforeRenderObservable.add(() => {
            const tick = Date.now();
            const delta = tick - this._lastTick;

            const scaleDiff = this._targetScale - this._scale;
            const colorDiff = TmpColors.Color3[0].copyFrom(this._targetColor).subtractToRef(this._color, TmpColors.Color3[0]);

            this._scale = this._scale + (scaleDiff * delta) / this.animationLength;
            colorDiff.scaleToRef(delta / this.animationLength, colorDiff);
            this._color.addToRef(colorDiff, this._color);

            this.setColor3("color", this._color);
            this.setFloat("scale", this._scale);
            this.setVector3("positionOffset", this._positionOffset);

            this._lastTick = tick;
        });
    }

    private _updateInterpolationTarget() {
        if (this.drag) {
            this._targetColor = this.hoverColor;
            this._targetScale = this.dragScale;
        } else if (this.hover) {
            this._targetColor = this.hoverColor;
            this._targetScale = this.hoverScale;
        } else {
            this._targetColor = this.baseColor;
            this._targetScale = this.baseScale;
        }
    }

    /**
     * Disposes the handle material
     */
    public dispose() {
        super.dispose();
        this.getScene().onBeforeRenderObservable.remove(this._onBeforeRender);
    }
}
