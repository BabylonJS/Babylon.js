module BABYLON {
    /**
     * Set of assets to keep when moving a scene into an asset container.
     */
    export class KeepAssets {
        /**
         * Cameras to keep.
         */
        public cameras = new Array<Camera>();
        /**
         * Lights to keep.
         */
        public lights = new Array<Light>();
        /**
         * Meshes to keep.
         */
        public meshes = new Array<AbstractMesh>();
        /**
         * Skeletons to keep.
         */
        public skeletons = new Array<Skeleton>();
        /**
         * ParticleSystems to keep.
         */
        public particleSystems = new Array<IParticleSystem>();
        /**
         * Animations to keep.
         */
        public animations = new Array<Animation>();
        /**
         * AnimationGroups to keep.
         */
        public animationGroups = new Array<AnimationGroup>();
        /**
         * MultiMaterials to keep.
         */
        public multiMaterials = new Array<MultiMaterial>();
        /**
         * Materials to keep.
         */
        public materials = new Array<Material>();
        /**
         * MorphTargetManagers to keep.
         */
        public morphTargetManagers = new Array<MorphTargetManager>();
        /**
         * Geometries to keep.
         */
        public geometries = new Array<Geometry>();
        /**
         * TransformNodes to keep.
         */
        public transformNodes = new Array<TransformNode>();
        /**
         * LensFlareSystems to keep.
         */
        public lensFlareSystems = new Array<LensFlareSystem>();
        /**
         * ShadowGenerators to keep.
         */
        public shadowGenerators = new Array<ShadowGenerator>();
        /**
         * ActionManagers to keep.
         */
        public actionManagers = new Array<ActionManager>();
        /**
         * Sounds to keep.
         */
        public sounds = new Array<Sound>();
        /**
         * Textures to keep.
         */
        public textures = new Array<Texture>();
    }

    /**
     * Container with a set of assets that can be added or removed from a scene.
     */
    export class AssetContainer {
        /**
         * The scene the AssetContainer belongs to.
         */
        public scene: Scene;

        // Objects
        /**
         * Cameras populated in the container.
         */
        public cameras = new Array<Camera>();
        /**
         * Lights populated in the container.
         */
        public lights = new Array<Light>();
        /**
         * Meshes populated in the container.
         */
        public meshes = new Array<AbstractMesh>();
        /**
         * Skeletons populated in the container.
         */
        public skeletons = new Array<Skeleton>();
        /**
         * ParticleSystems populated in the container.
         */
        public particleSystems = new Array<IParticleSystem>();
        /**
         * Animations populated in the container.
         */
        public animations = new Array<Animation>();
        /**
         * AnimationGroups populated in the container.
         */
        public animationGroups = new Array<AnimationGroup>();
        /**
         * MultiMaterials populated in the container.
         */
        public multiMaterials = new Array<MultiMaterial>();
        /**
         * Materials populated in the container.
         */
        public materials = new Array<Material>();
        /**
         * MorphTargetManagers populated in the container.
         */
        public morphTargetManagers = new Array<MorphTargetManager>();
        /**
         * Geometries populated in the container.
         */
        public geometries = new Array<Geometry>();
        /**
         * TransformNodes populated in the container.
         */
        public transformNodes = new Array<TransformNode>();
        /**
         * LensFlareSystems populated in the container.
         */
        public lensFlareSystems = new Array<LensFlareSystem>();
        /**
         * ShadowGenerators populated in the container.
         */
        public shadowGenerators = new Array<ShadowGenerator>();
        /**
         * ActionManagers populated in the container.
         */
        public actionManagers = new Array<ActionManager>();
        /**
         * Sounds populated in the container.
         */
        public sounds = new Array<Sound>();
        /**
         * Textures populated in the container.
         */
        public textures = new Array<Texture>();

        /**
         * Instantiates an AssetContainer.
         * @param scene The scene the AssetContainer belongs to.
         */
        constructor(scene: Scene) {
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
            this.particleSystems.forEach((o) => {
                this.scene.addParticleSystem(o);
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
            this.lensFlareSystems.forEach((o) => {
                this.scene.addLensFlareSystem(o);
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
                this.scene.addTexture
            });
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
            this.particleSystems.forEach((o) => {
                this.scene.removeParticleSystem(o);
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
            this.lensFlareSystems.forEach((o) => {
                this.scene.removeLensFlareSystem(o);
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
        }

        private _moveAssets<T>(sourceAssets: T[], targetAssets: T[], keepAssets: T[]): void {
            for (let asset of sourceAssets) {
                let move = true;
                for (let keepAsset of keepAssets) {
                    if (asset === keepAsset) {
                        move = false;
                        break;
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

            this._moveAssets(this.scene.cameras, this.cameras, keepAssets.cameras);
            this._moveAssets(this.scene.meshes, this.meshes, keepAssets.meshes);
            this._moveAssets(this.scene.getGeometries(), this.geometries, keepAssets.geometries);
            this._moveAssets(this.scene.materials, this.materials, keepAssets.materials);
            this._moveAssets(this.scene._actionManagers, this.actionManagers, keepAssets.actionManagers);
            this._moveAssets(this.scene.animations, this.animations, keepAssets.animations);
            this._moveAssets(this.scene.animationGroups, this.animationGroups, keepAssets.animationGroups);
            this._moveAssets(this.scene.lensFlareSystems, this.lensFlareSystems, keepAssets.lensFlareSystems);
            this._moveAssets(this.scene.lights, this.lights, keepAssets.lights);
            this._moveAssets(this.scene.morphTargetManagers, this.morphTargetManagers, keepAssets.morphTargetManagers);
            this._moveAssets(this.scene.multiMaterials, this.multiMaterials, keepAssets.multiMaterials);
            this._moveAssets(this.scene.skeletons, this.skeletons, keepAssets.skeletons);
            this._moveAssets(this.scene.particleSystems, this.particleSystems, keepAssets.particleSystems);
            this._moveAssets(this.scene.mainSoundTrack.soundCollection, this.sounds, keepAssets.sounds);
            this._moveAssets(this.scene.transformNodes, this.transformNodes, keepAssets.transformNodes);
            this._moveAssets(this.scene.textures, this.textures, keepAssets.textures);

            this.removeAllFromScene();
        }
    }
}
