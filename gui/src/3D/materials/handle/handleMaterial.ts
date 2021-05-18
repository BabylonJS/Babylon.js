import { ShaderMaterial } from "babylonjs/Materials/shaderMaterial";
import { Scene } from "babylonjs/index";

import "./shaders/handle.vertex";
import "./shaders/handle.fragment";

/**
 * Class used to render gizmo handles with fluent design
 */
export class HandleMaterial extends ShaderMaterial {
    private _hover: boolean = false;
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
    }

    private _interpolateTo(value: boolean) {
        // in scene afterrender, update value
    }

    public dispose() {
        // unregister callback for scene
    }
}
