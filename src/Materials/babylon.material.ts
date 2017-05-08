module BABYLON {
    export class MaterialDefines {
        private _keys: string[];
        private _isDirty = true;
        public _renderId: number;

        public _areLightsDirty = true;
        public _areAttributesDirty = true;
        public _areTexturesDirty = true;
        public _areFresnelDirty = true;
        public _areMiscDirty = true;    

        public _normals = false;
        public _uvs = false;

        public _needNormals = false;
        public _needUVs = false;

        public get isDirty(): boolean {
            return this._isDirty;
        }

        public markAsProcessed() {
            this._isDirty = false;
            this._areAttributesDirty = false;
            this._areTexturesDirty = false;
            this._areFresnelDirty = false;
            this._areLightsDirty = false;
            this._areMiscDirty = false;
        }

        public markAsUnprocessed() {
            this._isDirty = true;
        }

        public markAllAsDirty() {
            this._areTexturesDirty = true;
            this._areAttributesDirty = true;
            this._areLightsDirty = true;
            this._areFresnelDirty = true;
            this._areMiscDirty = true;
            this._isDirty = true;
        }

        public markAsLightDirty() {
            this._areLightsDirty = true;
            this._isDirty = true;
        }

        public markAsAttributesDirty() {
            this._areAttributesDirty = true;
            this._isDirty = true;
        }
        
        public markAsTexturesDirty() {
            this._areTexturesDirty = true;
            this._isDirty = true;
        }

        public markAsFresnelDirty() {
            this._areFresnelDirty = true;
            this._isDirty = true;
        }

        public markAsMiscDirty() {
            this._areMiscDirty = true;
            this._isDirty = true;
        }

        public rebuild() {
            if (this._keys) {
                delete this._keys;
            }

            this._keys = [];

            for (var key of Object.keys(this)) {
                if (key[0] === "_") {
                    continue;
                }

                this._keys.push(key);
            }
        } 

        public isEqual(other: MaterialDefines): boolean {
            if (this._keys.length !== other._keys.length) {
                return false;
            }

            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];

                if (this[prop] !== other[prop]) {
                    return false;
                }
            }

            return true;
        }

        public cloneTo(other: MaterialDefines): void {
            if (this._keys.length !== other._keys.length) {
                other._keys = this._keys.slice(0);
            }

            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];

                other[prop] = this[prop];
            }
        }

        public reset(): void {
            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];

                if (typeof (this[prop]) === "number") {
                    this[prop] = 0;

                } else {
                    this[prop] = false;
                }
            }
        }

        public toString(): string {
            var result = "";
            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];
                var value = this[prop];

                if (typeof (value) === "number") {
                    result += "#define " + prop + " " + this[prop] + "\n";

                } else if (value) {
                    result += "#define " + prop + "\n";
                }
            }

            return result;
        }
    }

    export class Material {
        private static _TriangleFillMode = 0;
        private static _WireFrameFillMode = 1;
        private static _PointFillMode = 2;

        public static get TriangleFillMode(): number {
            return Material._TriangleFillMode;
        }

        public static get WireFrameFillMode(): number {
            return Material._WireFrameFillMode;
        }

        public static get PointFillMode(): number {
            return Material._PointFillMode;
        }

        private static _ClockWiseSideOrientation = 0;
        private static _CounterClockWiseSideOrientation = 1;

        public static get ClockWiseSideOrientation(): number {
            return Material._ClockWiseSideOrientation;
        }

        public static get CounterClockWiseSideOrientation(): number {
            return Material._CounterClockWiseSideOrientation;
        }

        private static _TextureDirtyFlag = 0;
        private static _LightDirtyFlag = 1;
        private static _FresnelDirtyFlag = 2;
        private static _AttributesDirtyFlag = 4;
        private static _MiscDirtyFlag = 8;

        public static get TextureDirtyFlag(): number {
            return Material._TextureDirtyFlag;
        }

        public static get LightDirtyFlag(): number {
            return Material._LightDirtyFlag;
        }

        public static get FresnelDirtyFlag(): number {
            return Material._FresnelDirtyFlag;
        }

        public static get AttributesDirtyFlag(): number {
            return Material._AttributesDirtyFlag;
        }

        public static get MiscDirtyFlag(): number {
            return Material._MiscDirtyFlag;
        }

        @serialize()
        public id: string;

        @serialize()
        public name: string;

        @serialize()
        public checkReadyOnEveryCall = false;

        @serialize()
        public checkReadyOnlyOnce = false;

        @serialize()
        public state = "";

        @serialize()
        public alpha = 1.0;

        @serialize("backFaceCulling")
        protected _backFaceCulling = true;
        public set backFaceCulling(value : boolean) {
            if (this._backFaceCulling === value) {
                return;
            }
            this._backFaceCulling = value;
            this.markAsDirty(Material.TextureDirtyFlag);
        }
        public get backFaceCulling(): boolean {
            return this._backFaceCulling;
        }          

        @serialize()
        public sideOrientation: number;

        public onCompiled: (effect: Effect) => void;
        public onError: (effect: Effect, errors: string) => void;
        public getRenderTargetTextures: () => SmartArray<RenderTargetTexture>;

        public doNotSerialize = false;

        public storeEffectOnSubMeshes = false;

        /**
        * An event triggered when the material is disposed.
        * @type {BABYLON.Observable}
        */
        public onDisposeObservable = new Observable<Material>();

        private _onDisposeObserver: Observer<Material>;
        public set onDispose(callback: () => void) {
            if (this._onDisposeObserver) {
                this.onDisposeObservable.remove(this._onDisposeObserver);
            }
            this._onDisposeObserver = this.onDisposeObservable.add(callback);
        }

        /**
        * An event triggered when the material is bound.
        * @type {BABYLON.Observable}
        */
        public onBindObservable = new Observable<AbstractMesh>();

        private _onBindObserver: Observer<AbstractMesh>;
        public set onBind(callback: (Mesh: AbstractMesh) => void) {
            if (this._onBindObserver) {
                this.onBindObservable.remove(this._onBindObserver);
            }
            this._onBindObserver = this.onBindObservable.add(callback);
        }

        /**
        * An event triggered when the material is unbound.
        * @type {BABYLON.Observable}
        */
        public onUnBindObservable = new Observable<Material>();


        @serialize()
        public alphaMode = Engine.ALPHA_COMBINE;

        @serialize()
        public disableDepthWrite = false;

        @serialize("fogEnabled")
        private _fogEnabled = true;
        public set fogEnabled(value : boolean) {
            if (this._fogEnabled === value) {
                return;
            }
            this._fogEnabled = value;
            this.markAsDirty(Material.MiscDirtyFlag);
        }
        public get fogEnabled(): boolean {
            return this._fogEnabled;
        }         

        @serialize()
        public pointSize = 1.0;

        @serialize()
        public zOffset = 0;

        @serialize()
        public get wireframe(): boolean {
            return this._fillMode === Material.WireFrameFillMode;
        }

        public set wireframe(value: boolean) {
            this._fillMode = (value ? Material.WireFrameFillMode : Material.TriangleFillMode);
        }

        @serialize()
        public get pointsCloud(): boolean {
            return this._fillMode === Material.PointFillMode;
        }

        public set pointsCloud(value: boolean) {
            this._fillMode = (value ? Material.PointFillMode : Material.TriangleFillMode);            
        }

        @serialize()
        public get fillMode(): number {
            return this._fillMode;
        }

        public set fillMode(value: number) {
            if (this._fillMode === value) {
                return;
            }

            this._fillMode = value;
            this.markAsDirty(Material.MiscDirtyFlag);
        }

        public _effect: Effect;
        public _wasPreviouslyReady = false;
        private _useUBO: boolean;
        private _scene: Scene;
        private _fillMode = Material.TriangleFillMode;
        private _cachedDepthWriteState: boolean;

        protected _uniformBuffer: UniformBuffer;

        constructor(name: string, scene: Scene, doNotAdd?: boolean) {
            this.name = name;
            this.id = name;

            this._scene = scene || Engine.LastCreatedScene;

            if (this._scene.useRightHandedSystem) {
                this.sideOrientation = Material.ClockWiseSideOrientation;
            } else {
                this.sideOrientation = Material.CounterClockWiseSideOrientation;
            }

            this._uniformBuffer = new UniformBuffer(this._scene.getEngine());
            this._useUBO = this.getScene().getEngine().webGLVersion > 1;

            if (!doNotAdd) {
                this._scene.materials.push(this);
            }
        }

        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         * subclasses should override adding information pertainent to themselves
         */
        public toString(fullDetails? : boolean) : string {
            var ret = "Name: " + this.name;
            if (fullDetails){
            }
            return ret;
        } 

        /**
         * Child classes can use it to update shaders         
         */
        public markAsDirty(flag: number): void {

        }
        
        public getClassName(): string {
            return "Material";
        }
        
        public get isFrozen(): boolean {
            return this.checkReadyOnlyOnce;
        }

        public freeze(): void {
            this.checkReadyOnlyOnce = true;
        }

        public unfreeze(): void {
            this.checkReadyOnlyOnce = false;
        }

        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            return true;
        }

        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
            return false;            
        }

        public getEffect(): Effect {
            return this._effect;
        }

        public getScene(): Scene {
            return this._scene;
        }

        public needAlphaBlending(): boolean {
            return (this.alpha < 1.0);
        }

        public needAlphaTesting(): boolean {
            return false;
        }

        public getAlphaTestTexture(): BaseTexture {
            return null;
        }
        
        public markDirty(): void {
            this._wasPreviouslyReady = false;
        }

        public _preBind(effect?: Effect): void {
            var engine = this._scene.getEngine();

            var reverse = this.sideOrientation === Material.ClockWiseSideOrientation;

            engine.enableEffect(effect ? effect : this._effect);
            engine.setState(this.backFaceCulling, this.zOffset, false, reverse);
        }

        public bind(world: Matrix, mesh?: Mesh): void {
        }

        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {            
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
        }

        public bindSceneUniformBuffer(effect: Effect, sceneUbo: UniformBuffer): void {
            sceneUbo.bindToEffect(effect, "Scene");
        }

        public bindView(effect: Effect): void {
            if (!this._useUBO) {
                effect.setMatrix("view", this.getScene().getViewMatrix());
            } else {
                this.bindSceneUniformBuffer(effect, this.getScene().getSceneUniformBuffer());
            }
        }

        public bindViewProjection(effect: Effect): void {
            if (!this._useUBO) {
                effect.setMatrix("viewProjection", this.getScene().getTransformMatrix());
            } else {
                this.bindSceneUniformBuffer(effect, this.getScene().getSceneUniformBuffer());
            }
        }

        protected _afterBind(mesh: Mesh): void {
            this._scene._cachedMaterial = this;

            this.onBindObservable.notifyObservers(mesh);

            if (this.disableDepthWrite) {
                var engine = this._scene.getEngine();
                this._cachedDepthWriteState = engine.getDepthWrite();
                engine.setDepthWrite(false);
            }
        }

        public unbind(): void {

            this.onUnBindObservable.notifyObservers(this);

            if (this.disableDepthWrite) {
                var engine = this._scene.getEngine();
                engine.setDepthWrite(this._cachedDepthWriteState);
            }
        }

        public clone(name: string): Material {
            return null;
        }

        public getBindedMeshes(): AbstractMesh[] {
            var result = new Array<AbstractMesh>();

            for (var index = 0; index < this._scene.meshes.length; index++) {
                var mesh = this._scene.meshes[index];

                if (mesh.material === this) {
                    result.push(mesh);
                }
            }

            return result;
        }

        public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {
            // Animations
            this.getScene().stopAnimation(this);

            // Remove from scene
            var index = this._scene.materials.indexOf(this);
            if (index >= 0) {
                this._scene.materials.splice(index, 1);
            }

            // Remove from meshes
            for (index = 0; index < this._scene.meshes.length; index++) {
                var mesh = this._scene.meshes[index];

                if (mesh.material === this) {
                    mesh.material = null;
                
                    if ((<Mesh>mesh).geometry) {
                        var geometry = (<Mesh>mesh).geometry;

                        if (this.storeEffectOnSubMeshes) {
                            for (var subMesh of mesh.subMeshes) {
                                geometry._releaseVertexArrayObject(subMesh._materialEffect);
                            }
                        } else {
                            geometry._releaseVertexArrayObject(this._effect)
                        }
                    }
                }
            }

            this._uniformBuffer.dispose();

            // Shader are kept in cache for further use but we can get rid of this by using forceDisposeEffect
            if (forceDisposeEffect && this._effect) {
                    if (this.storeEffectOnSubMeshes) {
                        for (var subMesh of mesh.subMeshes) {
                            this._scene.getEngine()._releaseEffect(subMesh._materialEffect); 
                        }
                    } else {
                        this._scene.getEngine()._releaseEffect(this._effect);                    
                    }

                this._effect = null;
            }
            
            // Callback
            this.onDisposeObservable.notifyObservers(this);

            this.onDisposeObservable.clear();
            this.onBindObservable.clear();
            this.onUnBindObservable.clear();
        }

        public serialize(): any {
            return SerializationHelper.Serialize(this);
        }

        public static ParseMultiMaterial(parsedMultiMaterial: any, scene: Scene): MultiMaterial {
            var multiMaterial = new BABYLON.MultiMaterial(parsedMultiMaterial.name, scene);

            multiMaterial.id = parsedMultiMaterial.id;

            Tags.AddTagsTo(multiMaterial, parsedMultiMaterial.tags);

            for (var matIndex = 0; matIndex < parsedMultiMaterial.materials.length; matIndex++) {
                var subMatId = parsedMultiMaterial.materials[matIndex];

                if (subMatId) {
                    multiMaterial.subMaterials.push(scene.getMaterialByID(subMatId));
                } else {
                    multiMaterial.subMaterials.push(null);
                }
            }

            return multiMaterial;
        }

        public static Parse(parsedMaterial: any, scene: Scene, rootUrl: string) {
            if (!parsedMaterial.customType) {
                return StandardMaterial.Parse(parsedMaterial, scene, rootUrl);
            }

            var materialType = Tools.Instantiate(parsedMaterial.customType);
            return materialType.Parse(parsedMaterial, scene, rootUrl);;
        }
    }
} 