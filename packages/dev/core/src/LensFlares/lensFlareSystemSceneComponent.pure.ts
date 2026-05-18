/** This file must only contain pure code and pure imports */

import { Tools } from "../Misc/tools.pure";
import { type Camera } from "../Cameras/camera.pure";
import { Scene } from "../scene.pure";
import { SceneComponentConstants, type ISceneSerializableComponent } from "../sceneComponent";

import { type IAssetContainer } from "core/IAssetContainer";
import { type Nullable } from "../types";
import { type AssetContainer } from "../assetContainer";
import { AddParser } from "core/Loading/Plugins/babylonFileParser.function";
import { type LensFlareSystem } from "./lensFlareSystem";

/**
 * Defines the lens flare scene component responsible to manage any lens flares
 * in a given scene.
 */
export class LensFlareSystemSceneComponent implements ISceneSerializableComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_LENSFLARESYSTEM;

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
        this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_LENSFLARESYSTEM, this, this._draw);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        for (let index = 0; index < this.scene.lensFlareSystems.length; index++) {
            this.scene.lensFlareSystems[index].rebuild();
        }
    }

    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    public addFromContainer(container: IAssetContainer): void {
        if (!container.lensFlareSystems) {
            return;
        }
        for (const o of container.lensFlareSystems) {
            this.scene.addLensFlareSystem(o);
        }
    }

    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    public removeFromContainer(container: IAssetContainer, dispose?: boolean): void {
        if (!container.lensFlareSystems) {
            return;
        }
        for (const o of container.lensFlareSystems) {
            this.scene.removeLensFlareSystem(o);
            if (dispose) {
                o.dispose();
            }
        }
    }

    /**
     * Serializes the component data to the specified json object
     * @param serializationObject The object to serialize to
     */
    public serialize(serializationObject: any): void {
        // Lens flares
        serializationObject.lensFlareSystems = [];
        const lensFlareSystems = this.scene.lensFlareSystems;
        for (const lensFlareSystem of lensFlareSystems) {
            serializationObject.lensFlareSystems.push(lensFlareSystem.serialize());
        }
    }

    /**
     * Disposes the component and the associated resources.
     */
    public dispose(): void {
        const lensFlareSystems = this.scene.lensFlareSystems;
        while (lensFlareSystems.length) {
            lensFlareSystems[0].dispose();
        }
    }

    private _draw(camera: Camera): void {
        // Lens flares
        if (this.scene.lensFlaresEnabled) {
            const lensFlareSystems = this.scene.lensFlareSystems;
            Tools.StartPerformanceCounter("Lens flares", lensFlareSystems.length > 0);
            for (const lensFlareSystem of lensFlareSystems) {
                if ((camera.layerMask & lensFlareSystem.layerMask) !== 0) {
                    lensFlareSystem.render();
                }
            }
            Tools.EndPerformanceCounter("Lens flares", lensFlareSystems.length > 0);
        }
    }
}

let _Registered = false;
/**
 * Register side effects for lensFlareSystemSceneComponent.
 * Safe to call multiple times; only the first call has an effect.
 * @param lensFlareSystemClass The LensFlareSystem class to register the component for
 */
export function RegisterLensFlareSystemSceneComponent(lensFlareSystemClass: typeof LensFlareSystem): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    // Adds the parser to the scene parsers.
    AddParser(SceneComponentConstants.NAME_LENSFLARESYSTEM, (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => {
        // Lens flares
        if (parsedData.lensFlareSystems !== undefined && parsedData.lensFlareSystems !== null) {
            if (!container.lensFlareSystems) {
                container.lensFlareSystems = [] as LensFlareSystem[];
            }

            for (let index = 0, cache = parsedData.lensFlareSystems.length; index < cache; index++) {
                const parsedLensFlareSystem = parsedData.lensFlareSystems[index];
                const lf = lensFlareSystemClass.Parse(parsedLensFlareSystem, scene, rootUrl);
                container.lensFlareSystems.push(lf);
            }
        }
    });

    Scene.prototype.getLensFlareSystemByName = function (name: string): Nullable<LensFlareSystem> {
        for (let index = 0; index < this.lensFlareSystems.length; index++) {
            if (this.lensFlareSystems[index].name === name) {
                return this.lensFlareSystems[index];
            }
        }

        return null;
    };

    Scene.prototype.getLensFlareSystemById = function (id: string): Nullable<LensFlareSystem> {
        for (let index = 0; index < this.lensFlareSystems.length; index++) {
            if (this.lensFlareSystems[index].id === id) {
                return this.lensFlareSystems[index];
            }
        }

        return null;
    };

    Scene.prototype.getLensFlareSystemByID = function (id: string): Nullable<LensFlareSystem> {
        return this.getLensFlareSystemById(id);
    };

    Scene.prototype.removeLensFlareSystem = function (toRemove: LensFlareSystem): number {
        const index = this.lensFlareSystems.indexOf(toRemove);
        if (index !== -1) {
            this.lensFlareSystems.splice(index, 1);
        }
        return index;
    };

    Scene.prototype.addLensFlareSystem = function (newLensFlareSystem: LensFlareSystem): void {
        this.lensFlareSystems.push(newLensFlareSystem);
    };

    lensFlareSystemClass._SceneComponentInitialization = (scene: Scene) => {
        let component = scene._getComponent(SceneComponentConstants.NAME_LENSFLARESYSTEM) as LensFlareSystemSceneComponent;
        if (!component) {
            component = new LensFlareSystemSceneComponent(scene);
            scene._addComponent(component);
        }
    };
}
