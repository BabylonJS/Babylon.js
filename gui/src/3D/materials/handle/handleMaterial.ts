import { ShaderMaterial } from "babylonjs/Materials/shaderMaterial";
import { Scene } from "babylonjs/index";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";

import "./shaders/handle.vertex";
import "./shaders/handle.fragment";

/**
 * Class used to render gizmo handles with fluent design
 */
export class HandleMaterial extends ShaderMaterial {
    private _hover: boolean = false;
    private _onBeforeRender: Nullable<Observer<Scene>>;
    private _lastTick: number;
    public get hover(): boolean {
        return this._hover;
    }

    public set hover(b: boolean) {
        this._hover = b;

        this._interpolateTo(b);
    }

    constructor(name: string, scene: Scene) {
        super(name, scene, "./shaders/handle", {
            attributes: ["position"],
            uniforms: ["worldViewProjection", "color", "scale"],
            needAlphaBlending: false,
            needAlphaTesting: false,
        });

        // Register callback for scene after render
        this._lastTick = Date.now();
        this._onBeforeRender = this.getScene().onBeforeRenderObservable.add(() => {
            const tick = Date.now();

            this._lastTick = tick;
        });
    }

    private _interpolateTo(value: boolean) {
        // in scene afterrender, update value
    }

    public dispose() {
        // unregister callback for scene
    }
}
