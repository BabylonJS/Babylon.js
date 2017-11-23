module BABYLON {
    export class Light extends Node {

        //lightmapMode Consts
        private static _LIGHTMAP_DEFAULT = 0;
        private static _LIGHTMAP_SPECULAR = 1;
        private static _LIGHTMAP_SHADOWSONLY = 2;

        /**
         * If every light affecting the material is in this lightmapMode,
         * material.lightmapTexture adds or multiplies
         * (depends on material.useLightmapAsShadowmap)
         * after every other light calculations.
         */
        public static get LIGHTMAP_DEFAULT(): number {
            return Light._LIGHTMAP_DEFAULT;
        }

        /**
         * material.lightmapTexture as only diffuse lighting from this light
         * adds pnly specular lighting from this light
         * adds dynamic shadows
         */
        public static get LIGHTMAP_SPECULAR(): number {
            return Light._LIGHTMAP_SPECULAR;
        }

        /**
         * material.lightmapTexture as only lighting
         * no light calculation from this light
         * only adds dynamic shadows from this light
         */
        public static get LIGHTMAP_SHADOWSONLY(): number {
            return Light._LIGHTMAP_SHADOWSONLY;
        }

        // Intensity Mode Consts
        private static _INTENSITYMODE_AUTOMATIC = 0;
        private static _INTENSITYMODE_LUMINOUSPOWER = 1;
        private static _INTENSITYMODE_LUMINOUSINTENSITY = 2;
        private static _INTENSITYMODE_ILLUMINANCE = 3;
        private static _INTENSITYMODE_LUMINANCE = 4;

        /**
         * Each light type uses the default quantity according to its type:
         *      point/spot lights use luminous intensity
         *      directional lights use illuminance
         */
        public static get INTENSITYMODE_AUTOMATIC(): number {
            return Light._INTENSITYMODE_AUTOMATIC;
        }

        /**
         * lumen (lm)
         */
        public static get INTENSITYMODE_LUMINOUSPOWER(): number {
            return Light._INTENSITYMODE_LUMINOUSPOWER;
        }

        /**
         * candela (lm/sr)
         */
        public static get INTENSITYMODE_LUMINOUSINTENSITY(): number {
            return Light._INTENSITYMODE_LUMINOUSINTENSITY;
        }

        /**
         * lux (lm/m^2)
         */
        public static get INTENSITYMODE_ILLUMINANCE(): number {
            return Light._INTENSITYMODE_ILLUMINANCE;
        }

        /**
         * nit (cd/m^2)
         */
        public static get INTENSITYMODE_LUMINANCE(): number {
            return Light._INTENSITYMODE_LUMINANCE;
        }

        // Light types ids const.
        private static _LIGHTTYPEID_POINTLIGHT = 0;
        private static _LIGHTTYPEID_DIRECTIONALLIGHT = 1;
        private static _LIGHTTYPEID_SPOTLIGHT = 2;
        private static _LIGHTTYPEID_HEMISPHERICLIGHT = 3;

        /**
         * Light type const id of the point light.
         */
        public static get LIGHTTYPEID_POINTLIGHT(): number {
            return Light._LIGHTTYPEID_POINTLIGHT;
        }

        /**
         * Light type const id of the directional light.
         */
        public static get LIGHTTYPEID_DIRECTIONALLIGHT(): number {
            return Light._LIGHTTYPEID_DIRECTIONALLIGHT;
        }

        /**
         * Light type const id of the spot light.
         */
        public static get LIGHTTYPEID_SPOTLIGHT(): number {
            return Light._LIGHTTYPEID_SPOTLIGHT;
        }

        /**
         * Light type const id of the hemispheric light.
         */
        public static get LIGHTTYPEID_HEMISPHERICLIGHT(): number {
            return Light._LIGHTTYPEID_HEMISPHERICLIGHT;
        }

        @serializeAsColor3()
        public diffuse = new Color3(1.0, 1.0, 1.0);

        @serializeAsColor3()
        public specular = new Color3(1.0, 1.0, 1.0);

        @serialize()
        public intensity = 1.0;

        @serialize()
        public range = Number.MAX_VALUE;

        /**
         * Cached photometric scale default to 1.0 as the automatic intensity mode defaults to 1.0 for every type
         * of light.
         */
        private _photometricScale = 1.0;

        private _intensityMode: number = Light.INTENSITYMODE_AUTOMATIC;
        /**
         * Gets the photometric scale used to interpret the intensity.
         * This is only relevant with PBR Materials where the light intensity can be defined in a physical way.
         */
        @serialize()
        public get intensityMode(): number {
            return this._intensityMode;
        };
        /**
         * Sets the photometric scale used to interpret the intensity.
         * This is only relevant with PBR Materials where the light intensity can be defined in a physical way.
         */
        public set intensityMode(value: number) {
            this._intensityMode = value;
            this._computePhotometricScale();
        };

        private _radius = 0.00001;
        /**
         * Gets the light radius used by PBR Materials to simulate soft area lights.
         */
        @serialize()
        public get radius(): number {
            return this._radius;
        };
        /**
         * sets the light radius used by PBR Materials to simulate soft area lights.
         */
        public set radius(value: number) {
            this._radius = value;
            this._computePhotometricScale();
        };

        /**
         * Defines the rendering priority of the lights. It can help in case of fallback or number of lights
         * exceeding the number allowed of the materials.
         */
        @serialize()
        private _renderPriority: number;
        @expandToProperty("_reorderLightsInScene")
        public renderPriority: number = 0;

        /**
         * Defines wether or not the shadows are enabled for this light. This can help turning off/on shadow without detaching
         * the current shadow generator.
         */
        @serialize()
        public shadowEnabled: boolean = true;

        private _includedOnlyMeshes: AbstractMesh[];
        public get includedOnlyMeshes(): AbstractMesh[] {
            return this._includedOnlyMeshes;
        }

        public set includedOnlyMeshes(value: AbstractMesh[]) {
            this._includedOnlyMeshes = value;
            this._hookArrayForIncludedOnly(value);
        }

        private _excludedMeshes: AbstractMesh[];
        public get excludedMeshes(): AbstractMesh[] {
            return this._excludedMeshes;
        }
        public set excludedMeshes(value: AbstractMesh[]) {
            this._excludedMeshes = value;
            this._hookArrayForExcluded(value);
        }

        @serialize("excludeWithLayerMask")
        private _excludeWithLayerMask = 0;
        public get excludeWithLayerMask(): number {
            return this._excludeWithLayerMask;
        }

        public set excludeWithLayerMask(value: number) {
            this._excludeWithLayerMask = value;
            this._resyncMeshes();
        }

        @serialize("includeOnlyWithLayerMask")
        private _includeOnlyWithLayerMask = 0;
        public get includeOnlyWithLayerMask(): number {
            return this._includeOnlyWithLayerMask;
        }

        public set includeOnlyWithLayerMask(value: number) {
            this._includeOnlyWithLayerMask = value;
            this._resyncMeshes();
        }

        @serialize("lightmapMode")
        private _lightmapMode = 0;
        public get lightmapMode(): number {
            return this._lightmapMode;
        }

        public set lightmapMode(value: number) {
            if (this._lightmapMode === value) {
                return;
            }

            this._lightmapMode = value;
            this._markMeshesAsLightDirty();
        }

        private _parentedWorldMatrix: Matrix;
        public _shadowGenerator: Nullable<IShadowGenerator>;
        public _excludedMeshesIds = new Array<string>();
        public _includedOnlyMeshesIds = new Array<string>();

        // Light uniform buffer
        public _uniformBuffer: UniformBuffer;

        /**
         * Creates a Light object in the scene.  
         * Documentation : http://doc.babylonjs.com/tutorials/lights  
         */
        constructor(name: string, scene: Scene) {
            super(name, scene);
            this.getScene().addLight(this);
            this._uniformBuffer = new UniformBuffer(this.getScene().getEngine());
            this._buildUniformLayout();

            this.includedOnlyMeshes = new Array<AbstractMesh>();
            this.excludedMeshes = new Array<AbstractMesh>();

            this._resyncMeshes();
        }

        protected _buildUniformLayout(): void {
            // Overridden
        }

        /**
         * Returns the string "Light".  
         */
        public getClassName(): string {
            return "Light";
        }

        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        public toString(fullDetails?: boolean): string {
            var ret = "Name: " + this.name;
            ret += ", type: " + (["Point", "Directional", "Spot", "Hemispheric"])[this.getTypeID()];
            if (this.animations) {
                for (var i = 0; i < this.animations.length; i++) {
                    ret += ", animation[0]: " + this.animations[i].toString(fullDetails);
                }
            }
            if (fullDetails) {
            }
            return ret;
        }


        /**
         * Set the enabled state of this node.
         * @param {boolean} value - the new enabled state
         * @see isEnabled
         */
        public setEnabled(value: boolean): void {
            super.setEnabled(value);

            this._resyncMeshes();
        }

        /**
         * Returns the Light associated shadow generator.  
         */
        public getShadowGenerator(): Nullable<IShadowGenerator> {
            return this._shadowGenerator;
        }

        /**
         * Returns a Vector3, the absolute light position in the World.  
         */
        public getAbsolutePosition(): Vector3 {
            return Vector3.Zero();
        }

        public transferToEffect(effect: Effect, lightIndex: string): void {
        }

        public _getWorldMatrix(): Matrix {
            return Matrix.Identity();
        }

        /**
         * Boolean : True if the light will affect the passed mesh.  
         */
        public canAffectMesh(mesh: AbstractMesh): boolean {
            if (!mesh) {
                return true;
            }

            if (this.includedOnlyMeshes && this.includedOnlyMeshes.length > 0 && this.includedOnlyMeshes.indexOf(mesh) === -1) {
                return false;
            }

            if (this.excludedMeshes && this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(mesh) !== -1) {
                return false;
            }

            if (this.includeOnlyWithLayerMask !== 0 && (this.includeOnlyWithLayerMask & mesh.layerMask) === 0) {
                return false;
            }

            if (this.excludeWithLayerMask !== 0 && this.excludeWithLayerMask & mesh.layerMask) {
                return false;
            }

            return true;
        }

        /**
         * Returns the light World matrix.  
         */
        public getWorldMatrix(): Matrix {
            this._currentRenderId = this.getScene().getRenderId();

            var worldMatrix = this._getWorldMatrix();

            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._parentedWorldMatrix) {
                    this._parentedWorldMatrix = Matrix.Identity();
                }

                worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._parentedWorldMatrix);

                this._markSyncedWithParent();

                return this._parentedWorldMatrix;
            }

            return worldMatrix;
        }

        /**
		 * Sort function to order lights for rendering.
		 * @param a First Light object to compare to second.
		 * @param b Second Light object to compare first.
		 * @return -1 to reduce's a's index relative to be, 0 for no change, 1 to increase a's index relative to b.
		 */
        public static compareLightsPriority(a: Light, b: Light): number {
            //shadow-casting lights have priority over non-shadow-casting lights
            //the renderPrioirty is a secondary sort criterion
            if (a.shadowEnabled !== b.shadowEnabled) {
                return (b.shadowEnabled ? 1 : 0) - (a.shadowEnabled ? 1 : 0);
            }
            return b.renderPriority - a.renderPriority;
        }

        /**
         * Disposes the light.  
         */
        public dispose(): void {
            if (this._shadowGenerator) {
                this._shadowGenerator.dispose();
                this._shadowGenerator = null;
            }

            // Animations
            this.getScene().stopAnimation(this);

            // Remove from meshes
            for (var mesh of this.getScene().meshes) {
                mesh._removeLightSource(this);
            }

            this._uniformBuffer.dispose();

            // Remove from scene
            this.getScene().removeLight(this);
            super.dispose();
        }

        /**
         * Returns the light type ID (integer).  
         */
        public getTypeID(): number {
            return 0;
        }

        /**
         * Returns the intensity scaled by the Photometric Scale according to the light type and intensity mode.
         */
        public getScaledIntensity() {
            return this._photometricScale * this.intensity;
        }

        /**
         * Returns a new Light object, named "name", from the current one.  
         */
        public clone(name: string): Nullable<Light> {
            let constructor = Light.GetConstructorFromName(this.getTypeID(), name, this.getScene());

            if (!constructor) {
                return null;
            }
            return SerializationHelper.Clone(constructor, this);
        }
        /**
         * Serializes the current light into a Serialization object.  
         * Returns the serialized object.  
         */
        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);

            // Type
            serializationObject.type = this.getTypeID();

            // Parent
            if (this.parent) {
                serializationObject.parentId = this.parent.id;
            }

            // Inclusion / exclusions
            if (this.excludedMeshes.length > 0) {
                serializationObject.excludedMeshesIds = [];
                this.excludedMeshes.forEach((mesh: AbstractMesh) => {
                    serializationObject.excludedMeshesIds.push(mesh.id);
                });
            }

            if (this.includedOnlyMeshes.length > 0) {
                serializationObject.includedOnlyMeshesIds = [];
                this.includedOnlyMeshes.forEach((mesh: AbstractMesh) => {
                    serializationObject.includedOnlyMeshesIds.push(mesh.id);
                });
            }

            // Animations  
            Animation.AppendSerializedAnimations(this, serializationObject);
            serializationObject.ranges = this.serializeAnimationRanges();

            return serializationObject;
        }

        /**
         * Creates a new typed light from the passed type (integer) : point light = 0, directional light = 1, spot light = 2, hemispheric light = 3.  
         * This new light is named "name" and added to the passed scene.  
         */
        static GetConstructorFromName(type: number, name: string, scene: Scene): Nullable<() => Light> {
            switch (type) {
                case 0:
                    return () => new PointLight(name, Vector3.Zero(), scene);
                case 1:
                    return () => new DirectionalLight(name, Vector3.Zero(), scene);
                case 2:
                    return () => new SpotLight(name, Vector3.Zero(), Vector3.Zero(), 0, 0, scene);
                case 3:
                    return () => new HemisphericLight(name, Vector3.Zero(), scene);
            }

            return null;
        }

        /**
         * Parses the passed "parsedLight" and returns a new instanced Light from this parsing.  
         */
        public static Parse(parsedLight: any, scene: Scene): Nullable<Light> {
            let constructor = Light.GetConstructorFromName(parsedLight.type, parsedLight.name, scene);

            if (!constructor) {
                return null;
            }

            var light = SerializationHelper.Parse(constructor, parsedLight, scene);

            // Inclusion / exclusions
            if (parsedLight.excludedMeshesIds) {
                light._excludedMeshesIds = parsedLight.excludedMeshesIds;
            }

            if (parsedLight.includedOnlyMeshesIds) {
                light._includedOnlyMeshesIds = parsedLight.includedOnlyMeshesIds;
            }

            // Parent
            if (parsedLight.parentId) {
                light._waitingParentId = parsedLight.parentId;
            }

            // Animations
            if (parsedLight.animations) {
                for (var animationIndex = 0; animationIndex < parsedLight.animations.length; animationIndex++) {
                    var parsedAnimation = parsedLight.animations[animationIndex];

                    light.animations.push(Animation.Parse(parsedAnimation));
                }
                Node.ParseAnimationRanges(light, parsedLight, scene);
            }

            if (parsedLight.autoAnimate) {
                scene.beginAnimation(light, parsedLight.autoAnimateFrom, parsedLight.autoAnimateTo, parsedLight.autoAnimateLoop, parsedLight.autoAnimateSpeed || 1.0);
            }

            return light;
        }

        private _hookArrayForExcluded(array: AbstractMesh[]): void {
            var oldPush = array.push;
            array.push = (...items: AbstractMesh[]) => {
                var result = oldPush.apply(array, items);

                for (var item of items) {
                    item._resyncLighSource(this);
                }

                return result;
            }

            var oldSplice = array.splice;
            array.splice = (index: number, deleteCount?: number) => {
                var deleted = oldSplice.apply(array, [index, deleteCount]);

                for (var item of deleted) {
                    item._resyncLighSource(this);
                }

                return deleted;
            }

            for (var item of array) {
                item._resyncLighSource(this);
            }
        }

        private _hookArrayForIncludedOnly(array: AbstractMesh[]): void {
            var oldPush = array.push;
            array.push = (...items: AbstractMesh[]) => {
                var result = oldPush.apply(array, items);

                this._resyncMeshes();

                return result;
            }

            var oldSplice = array.splice;
            array.splice = (index: number, deleteCount?: number) => {
                var deleted = oldSplice.apply(array, [index, deleteCount]);

                this._resyncMeshes();

                return deleted;
            }

            this._resyncMeshes();
        }

        private _resyncMeshes() {
            for (var mesh of this.getScene().meshes) {
                mesh._resyncLighSource(this);
            }
        }

        public _markMeshesAsLightDirty() {
            for (var mesh of this.getScene().meshes) {
                if (mesh._lightSources.indexOf(this) !== -1) {
                    mesh._markSubMeshesAsLightDirty();
                }
            }
        }

        /**
         * Recomputes the cached photometric scale if needed.
         */
        private _computePhotometricScale(): void {
            this._photometricScale = this._getPhotometricScale();
            this.getScene().resetCachedMaterial();
        }

        /**
         * Returns the Photometric Scale according to the light type and intensity mode.
         */
        private _getPhotometricScale() {
            let photometricScale = 0.0;
            let lightTypeID = this.getTypeID();

            //get photometric mode
            let photometricMode = this.intensityMode;
            if (photometricMode === Light.INTENSITYMODE_AUTOMATIC) {
                if (lightTypeID === Light.LIGHTTYPEID_DIRECTIONALLIGHT) {
                    photometricMode = Light.INTENSITYMODE_ILLUMINANCE;
                } else {
                    photometricMode = Light.INTENSITYMODE_LUMINOUSINTENSITY;
                }
            }

            //compute photometric scale
            switch (lightTypeID) {
                case Light.LIGHTTYPEID_POINTLIGHT:
                case Light.LIGHTTYPEID_SPOTLIGHT:
                    switch (photometricMode) {
                        case Light.INTENSITYMODE_LUMINOUSPOWER:
                            photometricScale = 1.0 / (4.0 * Math.PI);
                            break;
                        case Light.INTENSITYMODE_LUMINOUSINTENSITY:
                            photometricScale = 1.0;
                            break;
                        case Light.INTENSITYMODE_LUMINANCE:
                            photometricScale = this.radius * this.radius;
                            break;
                    }
                    break;

                case Light.LIGHTTYPEID_DIRECTIONALLIGHT:
                    switch (photometricMode) {
                        case Light.INTENSITYMODE_ILLUMINANCE:
                            photometricScale = 1.0;
                            break;
                        case Light.INTENSITYMODE_LUMINANCE:
                            // When radius (and therefore solid angle) is non-zero a directional lights brightness can be specified via central (peak) luminance.
                            // For a directional light the 'radius' defines the angular radius (in radians) rather than world-space radius (e.g. in metres).
                            let apexAngleRadians = this.radius;
                            // Impose a minimum light angular size to avoid the light becoming an infinitely small angular light source (i.e. a dirac delta function).
                            apexAngleRadians = Math.max(apexAngleRadians, 0.001);
                            let solidAngle = 2.0 * Math.PI * (1.0 - Math.cos(apexAngleRadians));
                            photometricScale = solidAngle;
                            break;
                    }
                    break;

                case Light.LIGHTTYPEID_HEMISPHERICLIGHT:
                    // No fall off in hemisperic light.
                    photometricScale = 1.0;
                    break;
            }
            return photometricScale;
        }

        public _reorderLightsInScene(): void {
            var scene = this.getScene();
            if (this._renderPriority != 0) {
                scene.requireLightSorting = true;
            }
            this.getScene().sortLightsByPriority();
        }
    }
}
