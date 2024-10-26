import type { SmartArrayNoDuplicate } from "../../Misc/smartArray";
import type { Scene } from "../../scene";
import type { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { ShadowGenerator } from "./shadowGenerator";
import { CascadedShadowGenerator } from "./cascadedShadowGenerator";
import type { ISceneSerializableComponent } from "../../sceneComponent";
import { SceneComponentConstants } from "../../sceneComponent";
import { AddParser } from "core/Loading/Plugins/babylonFileParser.function";
import type { IAssetContainer } from "core/IAssetContainer";

// Adds the parser to the scene parsers.
AddParser(SceneComponentConstants.NAME_SHADOWGENERATOR, (parsedData: any, scene: Scene) => {
    // Shadows
    if (parsedData.shadowGenerators !== undefined && parsedData.shadowGenerators !== null) {
        for (let index = 0, cache = parsedData.shadowGenerators.length; index < cache; index++) {
            const parsedShadowGenerator = parsedData.shadowGenerators[index];
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
     * The component name helpful to identify the component in the list of scene components.
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
        const lights = this.scene.lights;
        for (const light of lights) {
            const shadowGenerators = light.getShadowGenerators();
            if (shadowGenerators) {
                const iterator = shadowGenerators.values();
                for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
                    const shadowGenerator = key.value;
                    serializationObject.shadowGenerators.push(shadowGenerator.serialize());
                }
            }
        }
    }

    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public addFromContainer(container: IAssetContainer): void {
        // Nothing To Do Here. (directly attached to a light)
    }

    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public removeFromContainer(container: IAssetContainer, dispose?: boolean): void {
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
        const scene = this.scene;
        if (this.scene.shadowsEnabled) {
            for (let lightIndex = 0; lightIndex < scene.lights.length; lightIndex++) {
                const light = scene.lights[lightIndex];
                const shadowGenerators = light.getShadowGenerators();

                if (light.isEnabled() && light.shadowEnabled && shadowGenerators) {
                    const iterator = shadowGenerators.values();
                    for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
                        const shadowGenerator = key.value;
                        const shadowMap = <RenderTargetTexture>shadowGenerator.getShadowMap();
                        if (scene.textures.indexOf(shadowMap) !== -1) {
                            renderTargets.push(shadowMap);
                        }
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
