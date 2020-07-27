import { Tools } from "../Misc/tools";
import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Scene } from "../scene";
import { SceneComponentConstants, ISceneSerializableComponent } from "../sceneComponent";
import { AbstractScene } from "../abstractScene";
import { AssetContainer } from "../assetContainer";
import { LensFlareSystem } from "./lensFlareSystem";
// Adds the parser to the scene parsers.
AbstractScene.AddParser(SceneComponentConstants.NAME_LENSFLARESYSTEM, (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => {
    // Lens flares
    if (parsedData.lensFlareSystems !== undefined && parsedData.lensFlareSystems !== null) {
        if (!container.lensFlareSystems) {
            container.lensFlareSystems = new Array<LensFlareSystem>();
        }

        for (let index = 0, cache = parsedData.lensFlareSystems.length; index < cache; index++) {
            var parsedLensFlareSystem = parsedData.lensFlareSystems[index];
            var lf = LensFlareSystem.Parse(parsedLensFlareSystem, scene, rootUrl);
            container.lensFlareSystems.push(lf);
        }
    }
});

declare module "../abstractScene" {
    export interface AbstractScene {
        /**
         * The list of lens flare system added to the scene
         * @see https://doc.babylonjs.com/how_to/how_to_use_lens_flares
         */
        lensFlareSystems: Array<LensFlareSystem>;

        /**
         * Removes the given lens flare system from this scene.
         * @param toRemove The lens flare system to remove
         * @returns The index of the removed lens flare system
         */
        removeLensFlareSystem(toRemove: LensFlareSystem): number;

        /**
         * Adds the given lens flare system to this scene
         * @param newLensFlareSystem The lens flare system to add
         */
        addLensFlareSystem(newLensFlareSystem: LensFlareSystem): void;

        /**
         * Gets a lens flare system using its name
         * @param name defines the name to look for
         * @returns the lens flare system or null if not found
         */
        getLensFlareSystemByName(name: string): Nullable<LensFlareSystem>;

        /**
         * Gets a lens flare system using its id
         * @param id defines the id to look for
         * @returns the lens flare system or null if not found
         */
        getLensFlareSystemByID(id: string): Nullable<LensFlareSystem>;
    }
}

AbstractScene.prototype.getLensFlareSystemByName = function(name: string): Nullable<LensFlareSystem> {
    for (var index = 0; index < this.lensFlareSystems.length; index++) {
        if (this.lensFlareSystems[index].name === name) {
            return this.lensFlareSystems[index];
        }
    }

    return null;
};

AbstractScene.prototype.getLensFlareSystemByID = function(id: string): Nullable<LensFlareSystem> {
    for (var index = 0; index < this.lensFlareSystems.length; index++) {
        if (this.lensFlareSystems[index].id === id) {
            return this.lensFlareSystems[index];
        }
    }

    return null;
};

AbstractScene.prototype.removeLensFlareSystem = function(toRemove: LensFlareSystem): number {
    var index = this.lensFlareSystems.indexOf(toRemove);
    if (index !== -1) {
        this.lensFlareSystems.splice(index, 1);
    }
    return index;
};

AbstractScene.prototype.addLensFlareSystem = function(newLensFlareSystem: LensFlareSystem): void {
    this.lensFlareSystems.push(newLensFlareSystem);
};

/**
 * Defines the lens flare scene component responsible to manage any lens flares
 * in a given scene.
 */
export class LensFlareSystemSceneComponent implements ISceneSerializableComponent {
    /**
     * The component name helpfull to identify the component in the list of scene components.
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

        scene.lensFlareSystems = new Array<LensFlareSystem>();
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
        // Nothing to do for lens flare
    }

    /**
     * Adds all the elements from the container to the scene
     * @param container the container holding the elements
     */
    public addFromContainer(container: AbstractScene): void {
        if (!container.lensFlareSystems) {
            return;
        }
        container.lensFlareSystems.forEach((o) => {
            this.scene.addLensFlareSystem(o);
        });
    }

    /**
     * Removes all the elements in the container from the scene
     * @param container contains the elements to remove
     * @param dispose if the removed element should be disposed (default: false)
     */
    public removeFromContainer(container: AbstractScene, dispose?: boolean): void {
        if (!container.lensFlareSystems) {
            return;
        }
        container.lensFlareSystems.forEach((o) => {
            this.scene.removeLensFlareSystem(o);
            if (dispose) {
                o.dispose();
            }
        });
    }

    /**
     * Serializes the component data to the specified json object
     * @param serializationObject The object to serialize to
     */
    public serialize(serializationObject: any): void {
        // Lens flares
        serializationObject.lensFlareSystems = [];
        let lensFlareSystems = this.scene.lensFlareSystems;
        for (let lensFlareSystem of lensFlareSystems) {
            serializationObject.lensFlareSystems.push(lensFlareSystem.serialize());
        }
    }

    /**
     * Disposes the component and the associated ressources.
     */
    public dispose(): void {
        let lensFlareSystems = this.scene.lensFlareSystems;
        while (lensFlareSystems.length) {
            lensFlareSystems[0].dispose();
        }
    }

    private _draw(camera: Camera): void {
        // Lens flares
        if (this.scene.lensFlaresEnabled) {
            let lensFlareSystems = this.scene.lensFlareSystems;
            Tools.StartPerformanceCounter("Lens flares", lensFlareSystems.length > 0);
            for (let lensFlareSystem of lensFlareSystems) {
                if ((camera.layerMask & lensFlareSystem.layerMask) !== 0) {
                    lensFlareSystem.render();
                }
            }
            Tools.EndPerformanceCounter("Lens flares", lensFlareSystems.length > 0);
        }
    }
}

LensFlareSystem._SceneComponentInitialization = (scene: Scene) => {
    let component = scene._getComponent(SceneComponentConstants.NAME_LENSFLARESYSTEM) as LensFlareSystemSceneComponent;
    if (!component) {
        component = new LensFlareSystemSceneComponent(scene);
        scene._addComponent(component);
    }
};