import { AbstractScene } from "./abstractScene";
import { Scene } from "./scene";
import { Mesh } from "./Meshes/mesh";

/**
 * Set of assets to keep when moving a scene into an asset container.
 */
export class KeepAssets extends AbstractScene { }

/**
 * Container with a set of assets that can be added or removed from a scene.
 */
export class AssetContainer extends AbstractScene {
    /**
     * The scene the AssetContainer belongs to.
     */
    public scene: Scene;

    /**
     * Instantiates an AssetContainer.
     * @param scene The scene the AssetContainer belongs to.
     */
    constructor(scene: Scene) {
        super();
        this.scene = scene;
        this["sounds"] = [];
        this["effectLayers"] = [];
        this["layers"] = [];
        this["lensFlareSystems"] = [];
        this["proceduralTextures"] = [];
        this["reflectionProbes"] = [];
    }

    /**
     * Adds all the assets from the container to the scene.
     */
    public addAllToScene() {
        this.cameras.forEach((o) => {
            this.scene.addCamera(o);
        });
        this.lights.forEach((o) => {
            this.scene.addLight(o);
        });
        this.meshes.forEach((o) => {
            this.scene.addMesh(o);
        });
        this.skeletons.forEach((o) => {
            this.scene.addSkeleton(o);
        });
        this.animations.forEach((o) => {
            this.scene.addAnimation(o);
        });
        this.animationGroups.forEach((o) => {
            this.scene.addAnimationGroup(o);
        });
        this.multiMaterials.forEach((o) => {
            this.scene.addMultiMaterial(o);
        });
        this.materials.forEach((o) => {
            this.scene.addMaterial(o);
        });
        this.morphTargetManagers.forEach((o) => {
            this.scene.addMorphTargetManager(o);
        });
        this.geometries.forEach((o) => {
            this.scene.addGeometry(o);
        });
        this.transformNodes.forEach((o) => {
            this.scene.addTransformNode(o);
        });
        this.actionManagers.forEach((o) => {
            this.scene.addActionManager(o);
        });
        this.textures.forEach((o) => {
            this.scene.addTexture(o);
        });
        this.reflectionProbes.forEach((o) => {
            this.scene.addReflectionProbe(o);
        });

        this.scene.environmentTexture = this.environmentTexture;

        for (let component of this.scene._serializableComponents) {
            component.addFromContainer(this);
        }
    }

    /**
     * Removes all the assets in the container from the scene
     */
    public removeAllFromScene() {
        this.cameras.forEach((o) => {
            this.scene.removeCamera(o);
        });
        this.lights.forEach((o) => {
            this.scene.removeLight(o);
        });
        this.meshes.forEach((o) => {
            this.scene.removeMesh(o);
        });
        this.skeletons.forEach((o) => {
            this.scene.removeSkeleton(o);
        });
        this.animations.forEach((o) => {
            this.scene.removeAnimation(o);
        });
        this.animationGroups.forEach((o) => {
            this.scene.removeAnimationGroup(o);
        });
        this.multiMaterials.forEach((o) => {
            this.scene.removeMultiMaterial(o);
        });
        this.materials.forEach((o) => {
            this.scene.removeMaterial(o);
        });
        this.morphTargetManagers.forEach((o) => {
            this.scene.removeMorphTargetManager(o);
        });
        this.geometries.forEach((o) => {
            this.scene.removeGeometry(o);
        });
        this.transformNodes.forEach((o) => {
            this.scene.removeTransformNode(o);
        });
        this.actionManagers.forEach((o) => {
            this.scene.removeActionManager(o);
        });
        this.textures.forEach((o) => {
            this.scene.removeTexture(o);
        });
        this.reflectionProbes.forEach((o) => {
            this.scene.removeReflectionProbe(o);
        });

        if (this.environmentTexture === this.scene.environmentTexture) {
            this.scene.environmentTexture = null;
        }

        for (let component of this.scene._serializableComponents) {
            component.removeFromContainer(this);
        }
    }

    /**
     * Disposes all the assets in the container
     */
    public dispose() {
        this.cameras.forEach((o) => {
            o.dispose();
        });
        this.cameras = [];

        this.lights.forEach((o) => {
            o.dispose();
        });
        this.lights = [];

        this.meshes.forEach((o) => {
            o.dispose();
        });
        this.meshes = [];

        this.skeletons.forEach((o) => {
            o.dispose();
        });
        this.skeletons = [];

        this.animationGroups.forEach((o) => {
            o.dispose();
        });
        this.animationGroups = [];

        this.multiMaterials.forEach((o) => {
            o.dispose();
        });
        this.multiMaterials = [];

        this.materials.forEach((o) => {
            o.dispose();
        });
        this.materials = [];

        this.geometries.forEach((o) => {
            o.dispose();
        });
        this.geometries = [];
        
        this.transformNodes.forEach((o) => {
            o.dispose();
        });
        this.transformNodes = [];

        this.actionManagers.forEach((o) => {
            o.dispose();
        });
        this.actionManagers = [];

        this.textures.forEach((o) => {
            o.dispose();
        });
        this.textures = [];

        this.reflectionProbes.forEach((o) => {
            o.dispose();
        });
        this.reflectionProbes = [];

        if (this.environmentTexture) {
            this.environmentTexture.dispose();
            this.environmentTexture = null;
        }

        for (let component of this.scene._serializableComponents) {
            component.removeFromContainer(this, true);
        }
    }

    private _moveAssets<T>(sourceAssets: T[], targetAssets: T[], keepAssets: T[]): void {
        if (!sourceAssets) {
            return;
        }

        for (let asset of sourceAssets) {
            let move = true;
            if (keepAssets) {
                for (let keepAsset of keepAssets) {
                    if (asset === keepAsset) {
                        move = false;
                        break;
                    }
                }
            }

            if (move) {
                targetAssets.push(asset);
            }
        }
    }

    /**
     * Removes all the assets contained in the scene and adds them to the container.
     * @param keepAssets Set of assets to keep in the scene. (default: empty)
     */
    public moveAllFromScene(keepAssets?: KeepAssets): void {

        if (keepAssets === undefined) {
            keepAssets = new KeepAssets();
        }

        for (let key in this) {
            if (this.hasOwnProperty(key)) {
                (<any>this)[key] = (<any>this)[key] || [];
                this._moveAssets((<any>this.scene)[key], (<any>this)[key], (<any>keepAssets)[key]);
            }
        }

        this.removeAllFromScene();
    }

    /**
     * Adds all meshes in the asset container to a root mesh that can be used to position all the contained meshes. The root mesh is then added to the front of the meshes in the assetContainer.
     * @returns the root mesh
     */
    public createRootMesh() {
        var rootMesh = new Mesh("assetContainerRootMesh", this.scene);
        this.meshes.forEach((m) => {
            if (!m.parent) {
                rootMesh.addChild(m);
            }
        });
        this.meshes.unshift(rootMesh);
        return rootMesh;
    }
}
