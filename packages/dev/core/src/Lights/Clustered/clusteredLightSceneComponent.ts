import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import type { Mesh } from "core/Meshes/mesh";
import type { Scene } from "core/scene";
import { type RenderTargetsStageAction, SceneComponentConstants, type ISceneComponent } from "core/sceneComponent";

import { ClusteredLight } from "./clusteredLight";

import { StandardMaterial } from "core/Materials/standardMaterial";

class ClusteredLightSceneComponent implements ISceneComponent {
    public name = SceneComponentConstants.NAME_CLUSTEREDLIGHT;

    public scene: Scene;
    public readonly sphere: Mesh;

    constructor(scene: Scene) {
        this.scene = scene;
        this.sphere = CreateSphere("LightSphere", { segments: 8, diameter: 2 }, scene);
        scene.removeMesh(this.sphere);

        const material = new StandardMaterial("SphereMaterial", scene);
        material.disableLighting = true;
        this.sphere.material = material;
    }

    public dispose(): void {
        this.sphere.dispose();
    }

    public rebuild(): void {}

    public register(): void {
        this.scene._gatherRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERRENDERTARGETS_CLUSTEREDLIGHT, this, this._gatherRenderTargets);
    }

    private _gatherRenderTargets: RenderTargetsStageAction = (renderTargets) => {
        for (const light of this.scene.lights) {
            if (light instanceof ClusteredLight && light.isSupported) {
                renderTargets.push(light._lightMask);
            }
        }
    };
}

ClusteredLight._SceneComponentInitialization = (scene) => {
    let component = <ClusteredLightSceneComponent>scene._getComponent(SceneComponentConstants.NAME_CLUSTEREDLIGHT);
    if (!component) {
        component = new ClusteredLightSceneComponent(scene);
        scene._addComponent(component);
    }
    return component.sphere;
};
