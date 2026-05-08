/** This file must only contain pure code and pure imports */

import { Scene } from "../scene.pure";
import { SceneComponentConstants } from "../sceneComponent";
import type { ISceneComponent } from "../sceneComponent";
import { DepthPeelingRenderer } from "./depthPeelingRenderer";
import { Constants } from "../Engines/constants";
import { ThinDepthPeelingRenderer } from "./thinDepthPeelingRenderer.pure";

/**
 * Scene component to render order independent transparency with depth peeling
 */
export class DepthPeelingSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_DEPTHPEELINGRENDERER;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene: Scene) {
        this.scene = scene;

        scene.depthPeelingRenderer = new DepthPeelingRenderer(scene);
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {}

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {}

    /**
     * Disposes the component and the associated resources.
     */
    public dispose(): void {
        this.scene.depthPeelingRenderer?.dispose();
        this.scene.depthPeelingRenderer = null;
    }
}

let _registered = false;
export function registerDepthPeelingSceneComponent(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    Object.defineProperty(Scene.prototype, "depthPeelingRenderer", {
        get: function (this: Scene) {
            if (!this._depthPeelingRenderer) {
                let component = this._getComponent(SceneComponentConstants.NAME_DEPTHPEELINGRENDERER) as DepthPeelingSceneComponent;
                if (!component) {
                    component = new DepthPeelingSceneComponent(this);
                    this._addComponent(component);
                }
            }

            return this._depthPeelingRenderer;
        },
        set: function (this: Scene, value: ThinDepthPeelingRenderer) {
            this._depthPeelingRenderer = value;
        },
        enumerable: true,
        configurable: true,
    });

    Object.defineProperty(Scene.prototype, "useOrderIndependentTransparency", {
        get: function (this: Scene) {
            return this._useOrderIndependentTransparency;
        },
        set: function (this: Scene, value: boolean) {
            if (this._useOrderIndependentTransparency === value) {
                return;
            }
            this._useOrderIndependentTransparency = value;
            this.markAllMaterialsAsDirty(Constants.MATERIAL_AllDirtyFlag);
            this.prePassRenderer?.markAsDirty();
        },
        enumerable: true,
        configurable: true,
    });
}
