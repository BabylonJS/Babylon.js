module BABYLON {
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
            this.sounds.forEach((o) => {
                o.play();
                o.autoplay = true;
                this.scene.mainSoundTrack.AddSound(o);
            });
            this.textures.forEach((o) => {
                this.scene.addTexture(o);
            });

            for (let component of this.scene._serializableComponents) {
                component.addFromContainer(this.scene);
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
            this.sounds.forEach((o) => {
                o.stop();
                o.autoplay = false;
                this.scene.mainSoundTrack.RemoveSound(o);
            });
            this.textures.forEach((o) => {
                this.scene.removeTexture(o);
            });

            for (let component of this.scene._serializableComponents) {
                component.removeFromContainer(this.scene);
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
        public createRootMesh(){
            var rootMesh = new BABYLON.Mesh("assetContainerRootMesh", this.scene);
            this.meshes.forEach((m)=>{
                if(!m.parent){
                    rootMesh.addChild(m);
                }
            })
            this.meshes.unshift(rootMesh);
            return rootMesh;
        }
    }
}
