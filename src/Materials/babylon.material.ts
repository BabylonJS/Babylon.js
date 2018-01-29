module BABYLON {
    /**
     * Manages the defines for the Material.
     */
    export class MaterialDefines {
        private _keys: string[];
        private _isDirty = true;
        public _renderId: number;

        public _areLightsDirty = true;
        public _areAttributesDirty = true;
        public _areTexturesDirty = true;
        public _areFresnelDirty = true;
        public _areMiscDirty = true;
        public _areImageProcessingDirty = true;

        public _normals = false;
        public _uvs = false;

        public _needNormals = false;
        public _needUVs = false;

        /**
         * Specifies if the material needs to be re-calculated.
         * @returns - Boolean indicating if the material is dirty or not.
         */
        public get isDirty(): boolean {
            return this._isDirty;
        }

        /**
         * Marks the material to indicate that it has been re-calculated.
         */
        public markAsProcessed() {
            this._isDirty = false;
            this._areAttributesDirty = false;
            this._areTexturesDirty = false;
            this._areFresnelDirty = false;
            this._areLightsDirty = false;
            this._areMiscDirty = false;
            this._areImageProcessingDirty = false;
        }

        /**
         * Marks the material to indicate that it needs to be re-calculated.
         */
        public markAsUnprocessed() {
            this._isDirty = true;
        }

        /**
         * Marks the material to indicate all of its defines need to be re-calculated.
         */
        public markAllAsDirty() {
            this._areTexturesDirty = true;
            this._areAttributesDirty = true;
            this._areLightsDirty = true;
            this._areFresnelDirty = true;
            this._areMiscDirty = true;
            this._areImageProcessingDirty = true;
            this._isDirty = true;
        }

        /**
         * Marks the material to indicate that image processing needs to be re-calculated.
         */
        public markAsImageProcessingDirty() {
            this._areImageProcessingDirty = true;
            this._isDirty = true;
        }

        /**
         * Marks the material to indicate the lights need to be re-calculated.
         */
        public markAsLightDirty() {
            this._areLightsDirty = true;
            this._isDirty = true;
        }

        /**
         * Marks the attribute state as changed.
         */
        public markAsAttributesDirty() {
            this._areAttributesDirty = true;
            this._isDirty = true;
        }

        /**
         * Marks the texture state as changed.
         */
        public markAsTexturesDirty() {
            this._areTexturesDirty = true;
            this._isDirty = true;
        }

        /**
         * Marks the fresnel state as changed.
         */
        public markAsFresnelDirty() {
            this._areFresnelDirty = true;
            this._isDirty = true;
        }

        /**
         * Marks the misc state as changed.
         */
        public markAsMiscDirty() {
            this._areMiscDirty = true;
            this._isDirty = true;
        }

        /**
         * Rebuilds the material defines.
         */
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

        /**
         * Specifies if two material defines are equal.
         * @param other - A material define instance to compare to.
         * @returns - Boolean indicating if the material defines are equal (true) or not (false).
         */
        public isEqual(other: MaterialDefines): boolean {
            if (this._keys.length !== other._keys.length) {
                return false;
            }

            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];

                if ((<any>this)[prop] !== (<any>other)[prop]) {
                    return false;
                }
            }

            return true;
        }

        /**
         * Clones this instance's defines to another instance.
         * @param other - material defines to clone values to.
         */
        public cloneTo(other: MaterialDefines): void {
            if (this._keys.length !== other._keys.length) {
                other._keys = this._keys.slice(0);
            }

            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];

                (<any>other)[prop] = (<any>this)[prop];
            }
        }

        /**
         * Resets the material define values.
         */
        public reset(): void {
            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];

                if (typeof ((<any>this)[prop]) === "number") {
                    (<any>this)[prop] = 0;

                } else {
                    (<any>this)[prop] = false;
                }
            }
        }

        /**
         * Converts the material define values to a string.
         * @returns - String of material define information.
         */
        public toString(): string {
            var result = "";
            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];
                var value = (<any>this)[prop];

                if (typeof (value) === "number") {
                    result += "#define " + prop + " " + (<any>this)[prop] + "\n";

                } else if (value) {
                    result += "#define " + prop + "\n";
                }
            }

            return result;
        }
    }

    /**
     * This offers the main features of a material in BJS.
     */
    export class Material implements IAnimatable {
        // Triangle views
        private static _TriangleFillMode = 0;
        private static _WireFrameFillMode = 1;
        private static _PointFillMode = 2;
        // Draw modes
        private static _PointListDrawMode = 3;
        private static _LineListDrawMode = 4;
        private static _LineLoopDrawMode = 5;
        private static _LineStripDrawMode = 6;
        private static _TriangleStripDrawMode = 7;
        private static _TriangleFanDrawMode = 8;

        /**
         * Returns the triangle fill mode.
         * @returns - Number indicating the triangle fill mode.
         */
        public static get TriangleFillMode(): number {
            return Material._TriangleFillMode;
        }

        /**
         * Returns the wireframe mode.
         * @returns - Number indicating the wireframe mode.
         */
        public static get WireFrameFillMode(): number {
            return Material._WireFrameFillMode;
        }

        /**
         * Returns the point fill mode.
         * @returns - Number indicating the point fill mode.
         */
        public static get PointFillMode(): number {
            return Material._PointFillMode;
        }

        /**
         * Returns the point list draw mode.
         * @returns - Number indicating the point list draw mode.
         */
        public static get PointListDrawMode(): number {
            return Material._PointListDrawMode;
        }

        /**
         * Returns the line list draw mode.
         * @returns - Number indicating the line list draw mode.
         */
        public static get LineListDrawMode(): number {
            return Material._LineListDrawMode;
        }

        /**
         * Returns the line loop draw mode.
         * @returns - Number indicating the line loop draw mode.
         */
        public static get LineLoopDrawMode(): number {
            return Material._LineLoopDrawMode;
        }

        /**
         * Returns the line strip draw mode.
         * @returns - Number indicating the line strip draw mode.
         */
        public static get LineStripDrawMode(): number {
            return Material._LineStripDrawMode;
        }

        /**
         * Returns the triangle strip draw mode.
         * @returns - Number indicating the triangle strip draw mode.
         */
        public static get TriangleStripDrawMode(): number {
            return Material._TriangleStripDrawMode;
        }

        /**
         * Returns the triangle fan draw mode.
         * @returns - Number indicating the triangle fan draw mode.
         */
        public static get TriangleFanDrawMode(): number {
            return Material._TriangleFanDrawMode;
        }

        /**
         * Stores the clock-wise side orientation.
         */
        private static _ClockWiseSideOrientation = 0;

        /**
         * Stores the counter clock-wise side orientation.
         */
        private static _CounterClockWiseSideOrientation = 1;

        /**
         * Returns the clock-wise side orientation.
         * @returns - Number indicating the clock-wise side orientation.
         */
        public static get ClockWiseSideOrientation(): number {
            return Material._ClockWiseSideOrientation;
        }

        /**
         * Returns the counter clock-wise side orientation.
         * @returns - Number indicating the counter clock-wise side orientation.
         */
        public static get CounterClockWiseSideOrientation(): number {
            return Material._CounterClockWiseSideOrientation;
        }

        /**
         * The dirty texture flag value.
         */
        private static _TextureDirtyFlag = 1;

        /**
         * The dirty light flag value.
         */
        private static _LightDirtyFlag = 2;

        /**
         * The dirty fresnel flag value.
         */
        private static _FresnelDirtyFlag = 4;

        /**
         * The dirty attribute flag value.
         */
        private static _AttributesDirtyFlag = 8;

        /**
         * The dirty misc flag value.
         */
        private static _MiscDirtyFlag = 16;

        /**
         * Returns the dirty texture flag value.
         * @returns - Number for the dirty texture flag value.
         */
        public static get TextureDirtyFlag(): number {
            return Material._TextureDirtyFlag;
        }

        /**
         * Returns the dirty light flag value.
         * @returns - Number for the dirty light flag value.
         */
        public static get LightDirtyFlag(): number {
            return Material._LightDirtyFlag;
        }

        /**
         * Returns the dirty fresnel flag value.
         * @returns - Number for the dirsty fresnel flag value.
         */
        public static get FresnelDirtyFlag(): number {
            return Material._FresnelDirtyFlag;
        }

        /**
         * Returns the dirty attributes flag value.
         * @returns - Number for the dirty attribute flag value.
         */
        public static get AttributesDirtyFlag(): number {
            return Material._AttributesDirtyFlag;
        }

        /**
         * Returns the dirty misc flag value.
         * @returns - Number for the dirty misc flag value.
         */
        public static get MiscDirtyFlag(): number {
            return Material._MiscDirtyFlag;
        }

        /**
         * The ID of the material.
         */
        @serialize()
        public id: string;

        /**
         * The name of the material.
         */
        @serialize()
        public name: string;

        /**
         * Specifies if the ready state should be checked on each call.
         */
        @serialize()
        public checkReadyOnEveryCall = false;

        /**
         * Specifies if the ready state should be checked once.
         */
        @serialize()
        public checkReadyOnlyOnce = false;

        /**
         * The state of the material.
         */
        @serialize()
        public state = "";

        /**
         * The alpha value of the material.
         */
        @serialize("alpha")
        protected _alpha = 1.0;

        /**
         * Sets the alpha value of the material.
         */
        public set alpha(value: number) {
            if (this._alpha === value) {
                return;
            }
            this._alpha = value;
            this.markAsDirty(Material.MiscDirtyFlag);
        }

        /**
         * Gets the alpha value of the material.
         * @returns - Number of the alpha value.
         */
        public get alpha(): number {
            return this._alpha;
        }        

        /**
         * Specifies if back face culling is enabled.
         */
        @serialize("backFaceCulling")
        protected _backFaceCulling = true;

        /**
         * Sets the back-face culling state.
         * @param value - Booleean specifying if back face culling should be enabled.
         */
        public set backFaceCulling(value: boolean) {
            if (this._backFaceCulling === value) {
                return;
            }
            this._backFaceCulling = value;
            this.markAsDirty(Material.TextureDirtyFlag);
        }

        /**
         * Gets the back-face culling state.
         * @returns - Boolean specifiying if back face culling is enabled.
         */
        public get backFaceCulling(): boolean {
            return this._backFaceCulling;
        }

        /**
         * Stores the value for side orientation.
         */
        @serialize()
        public sideOrientation: number;

        /**
         * Callback triggered when the material is compiled.
         */
        public onCompiled: (effect: Effect) => void;

        /**
         * Callback triggered when an error occurs.
         */
        public onError: (effect: Effect, errors: string) => void;

        /**
         * Callback triggered to get the render target textures.
         */
        public getRenderTargetTextures: () => SmartArray<RenderTargetTexture>;

        /**
         * Specifies if the material should be serialized.
         */
        public doNotSerialize = false;

        /**
         * Specifies if the effect should be stored on sub meshes.
         */
        public storeEffectOnSubMeshes = false;

        /**
         * Stores the animations for the material.
         */
        public animations: Array<Animation>;

        /**
        * An event triggered when the material is disposed.
        * @type {BABYLON.Observable}
        */
        public onDisposeObservable = new Observable<Material>();

        /**
         * An observer which watches for dispose events.
         * @type {BABYLON.Observer}
         */
        private _onDisposeObserver: Nullable<Observer<Material>>;

        /**
         * Called during a dispose event.
         */
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

        /**
         * An observer which watches for bind events.
         * @type {BABYLON.Observer}
         */
        private _onBindObserver: Nullable<Observer<AbstractMesh>>;

        /**
         * Called during a bind event.
         */
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

        /**
         * Stores the value of the alpha mode.
         */
        @serialize("alphaMode")
        private _alphaMode: number = Engine.ALPHA_COMBINE;

        /**
         * Sets the value of the alpha mode.
         * @param value - Number representing the alpha mode.
         */
        public set alphaMode(value: number) {
            if (this._alphaMode === value) {
                return;
            }
            this._alphaMode = value;
            this.markAsDirty(Material.TextureDirtyFlag);
        }

        /**
         * Gets the value of the alpha mode.
         * @returns - Number of the alpha mode.
         */
        public get alphaMode(): number {
            return this._alphaMode;
        }

        /**
         * Stores the state of the need depth pre-pass value.
         */
        @serialize()
        private _needDepthPrePass = false;

        /**
         * Sets the need depth pre-pass value.
         * @param value - Boolean specifying if the depth pre-pass is needed.
         */
        public set needDepthPrePass(value: boolean) {
            if (this._needDepthPrePass === value) {
                return;
            }
            this._needDepthPrePass = value;
            if (this._needDepthPrePass) {
                this.checkReadyOnEveryCall = true;
            }
        }

        /**
         * Gets the depth pre-pass value.
         * @returns - Boolean specifying if the depth pre-pass is needed.
         */
        public get needDepthPrePass(): boolean {
            return this._needDepthPrePass;
        }

        /**
         * Specifies if depth writing should be disabled.
         */
        @serialize()
        public disableDepthWrite = false;

        /**
         * Specifies if depth writing should be forced.
         */
        @serialize()
        public forceDepthWrite = false;

        /**
         * Specifies if there should be a separate pass for culling.
         */
        @serialize()
        public separateCullingPass = false;

        /**
         * Stores the state specifing if fog should be enabled.
         */
        @serialize("fogEnabled")
        private _fogEnabled = true;

        /**
         * Sets the state for enabling fog.
         * @param value - Boolean specifying if fog should be enabled.
         */
        public set fogEnabled(value: boolean) {
            if (this._fogEnabled === value) {
                return;
            }
            this._fogEnabled = value;
            this.markAsDirty(Material.MiscDirtyFlag);
        }

        /**
         * Gets the value of the fog enabled state.
         * @returns - Boolean indicating the fog enabled state.
         */
        public get fogEnabled(): boolean {
            return this._fogEnabled;
        }

        /**
         * Stores the size of points.
         */
        @serialize()
        public pointSize = 1.0;

        /**
         * Stores the z offset value.
         */
        @serialize()
        public zOffset = 0;

        /**
         * Gets a value specifying if wireframe mode is enabled.
         * @returns - Boolean specifying if wireframe is enabled. 
         */
        @serialize()
        public get wireframe(): boolean {
            return this._fillMode === Material.WireFrameFillMode;
        }

        /**
         * Sets the state of wireframe mode.
         * @param value - Boolean specifying if wireframe is enabled.
         */
        public set wireframe(value: boolean) {
            this._fillMode = (value ? Material.WireFrameFillMode : Material.TriangleFillMode);
        }

        /**
         * Gets the value specifying if point clouds are enabled.
         * @returns - Boolean specifying if point clouds are enabled.
         */
        @serialize()
        public get pointsCloud(): boolean {
            return this._fillMode === Material.PointFillMode;
        }

        /**
         * Sets the state of point cloud mode.
         * @param value - Boolean specifying if point clouds are enabled.
         */
        public set pointsCloud(value: boolean) {
            this._fillMode = (value ? Material.PointFillMode : Material.TriangleFillMode);
        }

        /**
         * Gets the material fill mode.
         * @returns - Number specifying the fill mode.
         */
        @serialize()
        public get fillMode(): number {
            return this._fillMode;
        }

        /**
         * Sets the material fill mode.
         * @param value - Number specifying the material fill mode.
         */
        public set fillMode(value: number) {
            if (this._fillMode === value) {
                return;
            }

            this._fillMode = value;
            this.markAsDirty(Material.MiscDirtyFlag);
        }

        /**
         * Stores the effects for the material.
         */
        public _effect: Nullable<Effect>;

        /**
         * Specifies if the material was previously ready.
         */
        public _wasPreviouslyReady = false;

        /**
         * Specifies if uniform buffers should be used.
         */
        private _useUBO: boolean;

        /**
         * Stores a reference to the scene.
         */
        private _scene: Scene;

        /**
         * Stores the fill mode state.
         */
        private _fillMode = Material.TriangleFillMode;

        /**
         * Specifies if the depth write state should be cached.
         */
        private _cachedDepthWriteState: boolean;

        /**
         * Stores the uniform buffer.
         */
        protected _uniformBuffer: UniformBuffer;

        /**
         * Creates a material instance.
         * @param name - The name of the material.
         * @param scene - The BJS scene to reference.
         * @param doNotAdd - Specifies if the material should be added to the scene.
         */
        constructor(name: string, scene: Scene, doNotAdd?: boolean) {
            this.name = name;
            this.id = name || Tools.RandomId();

            this._scene = scene || Engine.LastCreatedScene;

            if (this._scene.useRightHandedSystem) {
                this.sideOrientation = Material.ClockWiseSideOrientation;
            } else {
                this.sideOrientation = Material.CounterClockWiseSideOrientation;
            }

            this._uniformBuffer = new UniformBuffer(this._scene.getEngine());
            this._useUBO = this.getScene().getEngine().supportsUniformBuffers;

            if (!doNotAdd) {
                this._scene.materials.push(this);
            }
        }

        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         * subclasses should override adding information pertainent to themselves.
         * @returns - String with material information.
         */
        public toString(fullDetails?: boolean): string {
            var ret = "Name: " + this.name;
            if (fullDetails) {
            }
            return ret;
        }

         /**
          * Gets the class name of the material.
          * @returns - String with the class name of the material.
          */
        public getClassName(): string {
            return "Material";
        }

        /**
         * Specifies if updates for the material been locked.
         */
        public get isFrozen(): boolean {
            return this.checkReadyOnlyOnce;
        }

        /**
         * Locks updates for the material.
         */
        public freeze(): void {
            this.checkReadyOnlyOnce = true;
        }

        /**
         * Unlocks updates for the material.
         */
        public unfreeze(): void {
            this.checkReadyOnlyOnce = false;
        }

        /**
         * Specifies if the material is ready to be used.
         * @param mesh - BJS mesh.
         * @param useInstances - Specifies if instances should be used.
         * @returns - Boolean indicating if the material is ready to be used.
         */
        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            return true;
        }

        /**
         * Specifies that the submesh is ready to be used.
         * @param mesh - BJS mesh.
         * @param subMesh - A submesh of the BJS mesh.  Used to check if it is ready. 
         * @param useInstances - Specifies that instances should be used.
         * @returns - boolean indicating that the submesh is ready or not.
         */
        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: BaseSubMesh, useInstances?: boolean): boolean {
            return false;
        }

        /**
         * Returns the material effect.
         * @returns - Nullable material effect.
         */
        public getEffect(): Nullable<Effect> {
            return this._effect;
        }

        /**
         * Returns the BJS scene.
         * @returns - BJS Scene.
         */
        public getScene(): Scene {
            return this._scene;
        }

        /**
         * Specifies if the material will require alpha blending
         * @returns - Boolean specifying if alpha blending is needed.
         */
        public needAlphaBlending(): boolean {
            return (this.alpha < 1.0);
        }

        /**
         * Specifies if the mesh will require alpha blending.
         * @param mesh - BJS mesh.
         * @returns - Boolean specifying if alpha blending is needed for the mesh.
         */
        public needAlphaBlendingForMesh(mesh: AbstractMesh): boolean {
            return this.needAlphaBlending() || (mesh.visibility < 1.0) || mesh.hasVertexAlpha;
        }

        /**
         * Specifies if this material should be rendered in alpha test mode.
         * @returns - Boolean specifying if an alpha test is needed.
         */
        public needAlphaTesting(): boolean {
            return false;
        }

        /**
         * Gets the texture used for the alpha test.
         * @returns - Nullable alpha test texture.
         */
        public getAlphaTestTexture(): Nullable<BaseTexture> {
            return null;
        }

        /**
         * Marks the material to indicate that it needs to be re-calculated.
         */
        public markDirty(): void {
            this._wasPreviouslyReady = false;
        }

        public _preBind(effect?: Effect, overrideOrientation: Nullable<number> = null): boolean {
            var engine = this._scene.getEngine();

            var orientation = (overrideOrientation == null) ? this.sideOrientation : overrideOrientation;
            var reverse = orientation === Material.ClockWiseSideOrientation;

            engine.enableEffect(effect ? effect : this._effect);
            engine.setState(this.backFaceCulling, this.zOffset, false, reverse);

            return reverse;
        }

        /**
         * Binds the material to the mesh.
         * @param world - World transformation matrix.
         * @param mesh - Mesh to bind the material to.
         */
        public bind(world: Matrix, mesh?: Mesh): void {
        }

        /**
         * Binds the submesh to the material.
         * @param world - World transformation matrix.
         * @param mesh - Mesh containing the submesh.
         * @param subMesh - Submesh to bind the material to.
         */
        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        }

        /**
         * Binds the world matrix to the material.
         * @param world - World transformation matrix.
         */
        public bindOnlyWorldMatrix(world: Matrix): void {
        }

        /**
         * Binds the scene's uniform buffer to the effect.
         * @param effect - Effect to bind to the scene uniform buffer.
         * @param sceneUbo - Scene uniform buffer.
         */
        public bindSceneUniformBuffer(effect: Effect, sceneUbo: UniformBuffer): void {
            sceneUbo.bindToEffect(effect, "Scene");
        }

        /**
         * Binds the view matrix to the effect.
         * @param effect - Effect to bind the view matrix to.
         */
        public bindView(effect: Effect): void {
            if (!this._useUBO) {
                effect.setMatrix("view", this.getScene().getViewMatrix());
            } else {
                this.bindSceneUniformBuffer(effect, this.getScene().getSceneUniformBuffer());
            }
        }

        /**
         * Binds the view projection matrix to the effect.
         * @param effect - Effect to bind the view projection matrix to.
         */
        public bindViewProjection(effect: Effect): void {
            if (!this._useUBO) {
                effect.setMatrix("viewProjection", this.getScene().getTransformMatrix());
            } else {
                this.bindSceneUniformBuffer(effect, this.getScene().getSceneUniformBuffer());
            }
        }

        /**
         * Specifies if material alpha testing should be turned on for the mesh.
         * @param mesh - BJS mesh.
         */
        protected _shouldTurnAlphaTestOn(mesh: AbstractMesh): boolean {
            return (!this.needAlphaBlendingForMesh(mesh) && this.needAlphaTesting());
        }

        /**
         * Processes to execute after binding the material to a mesh.
         * @param mesh - BJS mesh.
         */
        protected _afterBind(mesh?: Mesh): void {
            this._scene._cachedMaterial = this;
            if (mesh) {
                this._scene._cachedVisibility = mesh.visibility;
            } else {
                this._scene._cachedVisibility = 1;
            }

            if (mesh) {
                this.onBindObservable.notifyObservers(mesh);
            }

            if (this.disableDepthWrite) {
                var engine = this._scene.getEngine();
                this._cachedDepthWriteState = engine.getDepthWrite();
                engine.setDepthWrite(false);
            }
        }

        /**
         * Unbinds the material from the mesh.
         */
        public unbind(): void {

            this.onUnBindObservable.notifyObservers(this);

            if (this.disableDepthWrite) {
                var engine = this._scene.getEngine();
                engine.setDepthWrite(this._cachedDepthWriteState);
            }
        }

        /**
         * Gets the active textures from the material.
         * @returns - Array of textures.
         */
        public getActiveTextures(): BaseTexture[] {
            return [];
        }

        /**
         * Specifies if the material uses a texture.
         * @param texture - Texture to check against the material.
         * @returns - Boolean specifying if the material uses the texture.
         */
        public hasTexture(texture: BaseTexture): boolean {
            return false;
        }

        /**
         * Makes a duplicate of the material, and gives it a new name.
         * @param name - Name to call the duplicated material.
         * @returns - Nullable cloned material
         */
        public clone(name: string): Nullable<Material> {
            return null;
        }

        /**
         * Gets the meshes bound to the material.
         * @returns - Array of meshes bound to the material.
         */
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

        /**
         * Force shader compilation including textures ready check
         * @param mesh - BJS mesh.
         * @param onCompiled - function to execute once the material is compiled.
         * @param options - options to pass to this function.
         */
        public forceCompilation(mesh: AbstractMesh, onCompiled?: (material: Material) => void, options?: Partial<{ clipPlane: boolean }>): void {
            let localOptions = {
                clipPlane: false,
                ...options
            };

            var subMesh = new BaseSubMesh();
            var scene = this.getScene();

            var checkReady = () => {
                if (!this._scene || !this._scene.getEngine()) {
                    return;
                }

                if (subMesh._materialDefines) {
                    subMesh._materialDefines._renderId = -1;
                }

                var clipPlaneState = scene.clipPlane;

                if (localOptions.clipPlane) {
                    scene.clipPlane = new Plane(0, 0, 0, 1);
                }

                if (this.storeEffectOnSubMeshes) {
                    if (this.isReadyForSubMesh(mesh, subMesh)) {
                        if (onCompiled) {
                            onCompiled(this);
                        }
                    }
                    else {
                        setTimeout(checkReady, 16);
                    }
                } else {
                    if (this.isReady(mesh)) {
                        if (onCompiled) {
                            onCompiled(this);
                        }
                    }
                    else {
                        setTimeout(checkReady, 16);
                    }
                }

                if (options && options.clipPlane) {
                    scene.clipPlane = clipPlaneState;
                }
            };

            checkReady();
        }

        /**
         * Marks a define in the material to indicate that it needs to be re-computed.
         * @param flag - Material define flag.
         */
        public markAsDirty(flag: number): void {
            if (flag & Material.TextureDirtyFlag) {
                this._markAllSubMeshesAsTexturesDirty();
            }

            if (flag & Material.LightDirtyFlag) {
                this._markAllSubMeshesAsLightsDirty();
            }

            if (flag & Material.FresnelDirtyFlag) {
                this._markAllSubMeshesAsFresnelDirty();
            }

            if (flag & Material.AttributesDirtyFlag) {
                this._markAllSubMeshesAsAttributesDirty();
            }

            if (flag & Material.MiscDirtyFlag) {
                this._markAllSubMeshesAsMiscDirty();
            }

            this.getScene().resetCachedMaterial();
        }

        /**
         * Marks all submeshes of a material to indicate that their material defines need to be re-calculated.
         * @param func - function which checks material defines against the submeshes.
         */
        protected _markAllSubMeshesAsDirty(func: (defines: MaterialDefines) => void) {
            for (var mesh of this.getScene().meshes) {
                if (!mesh.subMeshes) {
                    continue;
                }
                for (var subMesh of mesh.subMeshes) {
                    if (subMesh.getMaterial() !== this) {
                        continue;
                    }

                    if (!subMesh._materialDefines) {
                        continue;
                    }

                    func(subMesh._materialDefines);
                }
            }
        }

        /**
         * Indicates that image processing needs to be re-calculated for all submeshes.
         */
        protected _markAllSubMeshesAsImageProcessingDirty() {
            this._markAllSubMeshesAsDirty(defines => defines.markAsImageProcessingDirty());
        }

        /**
         * Indicates that textures need to be re-calculated for all submeshes.
         */
        protected _markAllSubMeshesAsTexturesDirty() {
            this._markAllSubMeshesAsDirty(defines => defines.markAsTexturesDirty());
        }

        /**
         * Indicates that fresnel needs to be re-calculated for all submeshes.
         */
        protected _markAllSubMeshesAsFresnelDirty() {
            this._markAllSubMeshesAsDirty(defines => defines.markAsFresnelDirty());
        }

        /**
         * Indicates that fresnel and misc need to be re-calculated for all submeshes.
         */
        protected _markAllSubMeshesAsFresnelAndMiscDirty() {
            this._markAllSubMeshesAsDirty(defines => {
                defines.markAsFresnelDirty();
                defines.markAsMiscDirty();
            });
        }        

        /**
         * Indicates that lights need to be re-calculated for all submeshes.
         */
        protected _markAllSubMeshesAsLightsDirty() {
            this._markAllSubMeshesAsDirty(defines => defines.markAsLightDirty());
        }

        /**
         * Indicates that attributes need to be re-calculated for all submeshes.
         */
        protected _markAllSubMeshesAsAttributesDirty() {
            this._markAllSubMeshesAsDirty(defines => defines.markAsAttributesDirty());
        }

        /**
         * Indicates that misc needs to be re-calculated for all submeshes.
         */
        protected _markAllSubMeshesAsMiscDirty() {
            this._markAllSubMeshesAsDirty(defines => defines.markAsMiscDirty());
        }

        /**
         * Indicates that textures and misc need to be re-calculated for all submeshes.
         */
        protected _markAllSubMeshesAsTexturesAndMiscDirty() {
            this._markAllSubMeshesAsDirty(defines => {
                defines.markAsTexturesDirty();
                defines.markAsMiscDirty();
            });
        }        

        /**
         * Disposes the material.
         * @param forceDisposeEffect - Specifies if effects should be force disposed.
         * @param forceDisposeTextures - Specifies if textures should be force disposed.
         */
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
                        var geometry = <Geometry>((<Mesh>mesh).geometry);

                        if (this.storeEffectOnSubMeshes) {
                            for (var subMesh of mesh.subMeshes) {
                                geometry._releaseVertexArrayObject(subMesh._materialEffect);
                                if (forceDisposeEffect && subMesh._materialEffect) {
                                    this._scene.getEngine()._releaseEffect(subMesh._materialEffect);
                                }
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
                if (!this.storeEffectOnSubMeshes) {
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

        /**
         * Serializes this material.
         * @returns - serialized material object.
         */
        public serialize(): any {
            return SerializationHelper.Serialize(this);
        }

        /**
         * Creates a MultiMaterial from parse MultiMaterial data.
         * @param parsedMultiMaterial - Parsed MultiMaterial data.
         * @param scene - BJS scene.
         * @returns - MultiMaterial.
         */
        public static ParseMultiMaterial(parsedMultiMaterial: any, scene: Scene): MultiMaterial {
            var multiMaterial = new MultiMaterial(parsedMultiMaterial.name, scene);

            multiMaterial.id = parsedMultiMaterial.id;

            if (Tags) {
                Tags.AddTagsTo(multiMaterial, parsedMultiMaterial.tags);
            }

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

        /**
         * Creates a material from parsed material data.
         * @param parsedMaterial - Parsed material data.
         * @param scene - BJS scene.
         * @param rootUrl - Root URL containing the material information.
         * @returns - Parsed material.
         */
        public static Parse(parsedMaterial: any, scene: Scene, rootUrl: string): any {
            if (!parsedMaterial.customType) {
                return StandardMaterial.Parse(parsedMaterial, scene, rootUrl);
            }

            if (parsedMaterial.customType === "BABYLON.PBRMaterial" && parsedMaterial.overloadedAlbedo) {
                parsedMaterial.customType = "BABYLON.LegacyPBRMaterial";
                if (!(<any>BABYLON).LegacyPBRMaterial) {
                    Tools.Error("Your scene is trying to load a legacy version of the PBRMaterial, please, include it from the materials library.");
                    return;
                }
            }

            var materialType = Tools.Instantiate(parsedMaterial.customType);
            return materialType.Parse(parsedMaterial, scene, rootUrl);;
        }
    }
} 