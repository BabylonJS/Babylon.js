﻿module BABYLON {
    export class MaterialDefines {
        _keys: string[];

        public rebuild() {
            if (this._keys) {
                delete this._keys;
            }
            this._keys = Object.keys(this);
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

                if (typeof (this[prop]) === "number") {
                    result += "#define " + prop + " " + this[prop] + "\n";

                } else if (this[prop]) {
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

        @serialize()
        public id: string;

        @serialize()
        public checkReadyOnEveryCall = false;

        @serialize()
        public checkReadyOnlyOnce = false;

        @serialize()
        public state = "";

        @serialize()
        public alpha = 1.0;

        @serialize()
        public backFaceCulling = true;

        @serialize()
        public sideOrientation: number;

        public onCompiled: (effect: Effect) => void;
        public onError: (effect: Effect, errors: string) => void;
        public getRenderTargetTextures: () => SmartArray<RenderTargetTexture>;

        public doNotSerialize = false;

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

        @serialize()
        public fogEnabled = true;

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
            this._fillMode = value;
        }

        public _effect: Effect;
        public _wasPreviouslyReady = false;
        private _scene: Scene;
        private _fillMode = Material.TriangleFillMode;
        private _cachedDepthWriteState: boolean;


        constructor(public name: string, scene: Scene, doNotAdd?: boolean) {
            this.id = name;

            this._scene = scene;

            if (scene.useRightHandedSystem) {
                this.sideOrientation = Material.ClockWiseSideOrientation;
            } else {
                this.sideOrientation = Material.CounterClockWiseSideOrientation;
            }

            if (!doNotAdd) {
                scene.materials.push(this);
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

        public _preBind(): void {
            var engine = this._scene.getEngine();

            var reverse = this.sideOrientation === Material.ClockWiseSideOrientation;

            engine.enableEffect(this._effect);
            engine.setState(this.backFaceCulling, this.zOffset, false, reverse);
        }

        public bind(world: Matrix, mesh?: Mesh): void {
            this._scene._cachedMaterial = this;

            this.onBindObservable.notifyObservers(mesh);

            if (this.disableDepthWrite) {
                var engine = this._scene.getEngine();
                this._cachedDepthWriteState = engine.getDepthWrite();
                engine.setDepthWrite(false);
            }
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
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

            // Shader are kept in cache for further use but we can get rid of this by using forceDisposeEffect
            if (forceDisposeEffect && this._effect) {
                this._scene.getEngine()._releaseEffect(this._effect);
                this._effect = null;
            }

            // Remove from meshes
            for (index = 0; index < this._scene.meshes.length; index++) {
                var mesh = this._scene.meshes[index];

                if (mesh.material === this) {
                    mesh.material = null;
                }
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