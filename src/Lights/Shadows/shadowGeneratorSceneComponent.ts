import { SmartArrayNoDuplicate } from "../../Misc/smartArray";
import { Scene } from "../../scene";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { ShadowGenerator } from "./shadowGenerator";
import { CascadedShadowGenerator } from "./cascadedShadowGenerator";
import { SceneComponentConstants, ISceneSerializableComponent } from "../../sceneComponent";
import { AbstractScene } from "../../abstractScene";
// Adds the parser to the scene parsers.
AbstractScene.AddParser(SceneComponentConstants.NAME_SHADOWGENERATOR, (parsedData: any, scene: Scene) => {
    // Shadows
    if (parsedData.shadowGenerators !== undefined && parsedData.shadowGenerators !== null) {
        for (var index = 0, cache = parsedData.shadowGenerators.length; index < cache; index++) {
            var parsedShadowGenerator = parsedData.shadowGenerators[index];
            if (parsedShadowGenerator.className === CascadedShadowGenerator.CLASSNAME) {
                CascadedShadowGenerator.Parse(parsedShadowGenerator, scene);
            } else {
                ShadowGenerator.Parse(parsedShadowGenerator, scene);
            }
            // SG would be available on their associated lights
        }
    }
});

/**
 * Defines the shadow generator component responsible to manage any shadow generators
 * in a given scene.
 */
export class ShadowGeneratorSceneComponent implements ISceneSerializableComponent {
    /**
     * The component name helpfull to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_SHADOWGENERATOR;

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
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        this.scene._gatherRenderTargetsStage.registerStep(SceneComponentConstants.STEP_GATHERRENDERTARGETS_SHADOWGENERATOR, this, this._gatherRenderTargets);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing To Do Here.
    }

    /**
     * Serializes the component data to the specified json object
     * @param serializationObject The object to serialize to
     */
    public serialize(serializationObject: any): void {
        // Shadows
        serializationObject.shadowGenerators = [];
        var lights = this.scene.lights;
        for (let light of lights) {
            let shadowGenerator = light.getShadowGenerator();
            if (shadowGenerator) {
                serializationObject.shadowGenerators.push(shadowGenerator.serialize());
            }
        }
    }

    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    public addFromContainer(container: AbstractScene): void {
        // Nothing To Do Here. (directly attached to a light)
    }

    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    public removeFromContainer(container: AbstractScene, dispose?: boolean): void {
        // Nothing To Do Here. (directly attached to a light)
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public dispose(): void {
        // Nothing To Do Here.
    }

    private _gatherRenderTargets(renderTargets: SmartArrayNoDuplicate<RenderTargetTexture>): void {
        // Shadows
        var scene = this.scene;
        if (this.scene.shadowsEnabled) {
            for (var lightIndex = 0; lightIndex < scene.lights.length; lightIndex++) {
                var light = scene.lights[lightIndex];
                var shadowGenerator = light.getShadowGenerator();

                if (light.isEnabled() && light.shadowEnabled && shadowGenerator) {
                    var shadowMap = <RenderTargetTexture>(shadowGenerator.getShadowMap());
                    if (scene.textures.indexOf(shadowMap) !== -1) {
                        renderTargets.push(shadowMap);
                    }
                }
            }
        }
    }
}

ShadowGenerator._SceneComponentInitialization = (scene: Scene) => {
    let component = scene._getComponent(SceneComponentConstants.NAME_SHADOWGENERATOR);
    if (!component) {
        component = new ShadowGeneratorSceneComponent(scene);
        scene._addComponent(component);
    }
};
