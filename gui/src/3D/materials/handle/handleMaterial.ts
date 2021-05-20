import { ShaderMaterial } from "babylonjs/Materials/shaderMaterial";
import { Scene } from "babylonjs/index";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";

import "./shaders/handle.vertex";
import "./shaders/handle.fragment";
import { Color3, TmpColors } from "babylonjs/Maths/math.color";
import { CubicEase } from "babylonjs/Animations/easing";
import { Scalar } from "babylonjs/Maths/math.scalar";
import { Vector3 } from "babylonjs/Maths/math.vector";

/**
 * Class used to render gizmo handles with fluent design
 */
export class HandleMaterial extends ShaderMaterial {
    private _hover: boolean = false;
    private _onBeforeRender: Nullable<Observer<Scene>>;
    private _color: Color3 = new Color3();
    private _scale: number = 1;
    private _currentGradient = 0;
    private _lastTick = -1;

    /**
     * Easing function used to animate the material
     */
    public easingFunction = new CubicEase();

    public get hover(): boolean {
        return this._hover;
    }

    public set hover(b: boolean) {
        if (this.hover !== b) {
            this._interpolateTo(b);
        }
        this._hover = b;
    }

    /**
     * Length of hovering in/out animation
     */
    public animationLength: number = 250;

    /**
     * Color of the handle when hovered
     */
    public hoverColor: Color3 = new Color3(0, 0.467, 0.84);

    /**
     * Color of the handle
     */
    public baseColor: Color3 = new Color3(1, 1, 1);

    /**
     * Scale of the handle when hovered
     */
    public hoverScale: number = 3;

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

        // Register callback for scene after render
        this._lastTick = Date.now();
        this._onBeforeRender = this.getScene().onBeforeRenderObservable.add(() => {
            const tick = Date.now();
            const delta = tick - this._lastTick;

            this._currentGradient += this.hover ? delta / this.animationLength : -delta / this.animationLength;
            this._currentGradient = Scalar.Clamp(this._currentGradient, 0, 1);

            const alpha = this.easingFunction.ease(this._currentGradient);

            TmpColors.Color3[0].copyFrom(this.hoverColor).scaleToRef(alpha, TmpColors.Color3[0]);
            TmpColors.Color3[1].copyFrom(this.baseColor).scaleToRef(1 - alpha, TmpColors.Color3[1]);
            this._color.copyFrom(TmpColors.Color3[0]).addToRef(TmpColors.Color3[1], this._color);
            this._scale = 1 - alpha + alpha * this.hoverScale;

            this.setColor3("color", this._color);
            this.setFloat("scale", this._scale);
            this.setVector3("positionOffset", this._positionOffset)

            this._lastTick = tick;
        });

        this.easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    }

    private _interpolateTo(value: boolean) {
        // this._currentGradient = 1 - this._currentGradient;
    }

    public dispose() {
        this.getScene().onBeforeRenderObservable.remove(this._onBeforeRender);
    }
}
