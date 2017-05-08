module BABYLON {

    export interface IShadowLight extends Light {
        id: string;
        position: Vector3;
        transformedPosition: Vector3;
        name: string;
        shadowMinZ: number;
        shadowMaxZ: number;

        computeTransformedPosition(): boolean;
        getScene(): Scene;

        customProjectionMatrixBuilder: (viewMatrix: Matrix, renderList: Array<AbstractMesh>, result: Matrix) => void;
        setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void;
        getDepthScale(): number;

        needRefreshPerFrame(): boolean;
        needCube(): boolean;

        getShadowDirection(faceIndex?: number): Vector3;

        _shadowGenerator: IShadowGenerator;
    }

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

        @serializeAsColor3()
        public diffuse = new Color3(1.0, 1.0, 1.0);

        @serializeAsColor3()
        public specular = new Color3(1.0, 1.0, 1.0);

        @serialize()
        public intensity = 1.0;

        @serialize()
        public range = Number.MAX_VALUE;

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

        // PBR Properties.
        @serialize()
        public radius = 0.00001;

        public _shadowGenerator: IShadowGenerator;
        private _parentedWorldMatrix: Matrix;
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
        public toString(fullDetails? : boolean) : string {
            var ret = "Name: " + this.name;
            ret += ", type: " + (["Point", "Directional", "Spot", "Hemispheric"])[this.getTypeID()];
            if (this.animations){
                for (var i = 0; i < this.animations.length; i++){
                   ret += ", animation[0]: " + this.animations[i].toString(fullDetails);
                }
            }
            if (fullDetails){
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
        public getShadowGenerator(): IShadowGenerator {
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

            if (this.includedOnlyMeshes.length > 0 && this.includedOnlyMeshes.indexOf(mesh) === -1) {
                return false;
            }

            if (this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(mesh) !== -1) {
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
         * Returns a new Light object, named "name", from the current one.  
         */
        public clone(name: string): Light {
            return SerializationHelper.Clone(Light.GetConstructorFromName(this.getTypeID(), name, this.getScene()), this);
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
        static GetConstructorFromName(type: number, name: string, scene: Scene): () => Light {
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
        }

        /**
         * Parses the passed "parsedLight" and returns a new instanced Light from this parsing.  
         */
        public static Parse(parsedLight: any, scene: Scene): Light {            
            var light = SerializationHelper.Parse(Light.GetConstructorFromName(parsedLight.type, parsedLight.name, scene), parsedLight, scene);

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
    }
}
