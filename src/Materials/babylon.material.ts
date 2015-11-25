module BABYLON {
    export class MaterialDefines {
        _keys: string[];

        public isEqual(other: MaterialDefines): boolean {
            for (var index = 0; index < this._keys.length; index++) {
                var prop = this._keys[index];

                if (this[prop] !== other[prop]) {
                    return false;
                }
            }

            return true;
        }

        public cloneTo(other: MaterialDefines): void {
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

        public id: string;
        public checkReadyOnEveryCall = false;
        public checkReadyOnlyOnce = false;
        public state = "";
        public alpha = 1.0;
        public backFaceCulling = true;
        public sideOrientation = Material.CounterClockWiseSideOrientation;
        public onCompiled: (effect: Effect) => void;
        public onError: (effect: Effect, errors: string) => void;
        public onDispose: () => void;
        public onBind: (material: Material, mesh: Mesh) => void;
        public getRenderTargetTextures: () => SmartArray<RenderTargetTexture>;
        public alphaMode = Engine.ALPHA_COMBINE;
        public disableDepthWrite = false;
        public fogEnabled = true;

        public _effect: Effect;
        public _wasPreviouslyReady = false;
        private _scene: Scene;
        private _fillMode = Material.TriangleFillMode;
        private _cachedDepthWriteState: boolean;

        public pointSize = 1.0;

        public zOffset = 0;

        public get wireframe(): boolean {
            return this._fillMode === Material.WireFrameFillMode;
        }

        public set wireframe(value: boolean) {
            this._fillMode = (value ? Material.WireFrameFillMode : Material.TriangleFillMode);
        }

        public get pointsCloud(): boolean {
            return this._fillMode === Material.PointFillMode;
        }

        public set pointsCloud(value: boolean) {
            this._fillMode = (value ? Material.PointFillMode : Material.TriangleFillMode);
        }

        public get fillMode(): number {
            return this._fillMode;
        }

        public set fillMode(value: number) {
            this._fillMode = value;
        }

        constructor(public name: string, scene: Scene, doNotAdd?: boolean) {
            this.id = name;

            this._scene = scene;

            if (!doNotAdd) {
                scene.materials.push(this);
            }
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

        public trackCreation(onCompiled: (effect: Effect) => void, onError: (effect: Effect, errors: string) => void) {
        }

        public markDirty(): void {
            this._wasPreviouslyReady = false;
        }

        public _preBind(): void {
            var engine = this._scene.getEngine();

            engine.enableEffect(this._effect);
            engine.setState(this.backFaceCulling, this.zOffset, false, this.sideOrientation === Material.ClockWiseSideOrientation);
        }

        public bind(world: Matrix, mesh?: Mesh): void {
            this._scene._cachedMaterial = this;

            if (this.onBind) {
                this.onBind(this, mesh);
            }

            if (this.disableDepthWrite) {
                var engine = this._scene.getEngine();
                this._cachedDepthWriteState = engine.getDepthWrite();
                engine.setDepthWrite(false);
            }
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
        }

        public unbind(): void {
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

        public dispose(forceDisposeEffect?: boolean): void {
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
            if (this.onDispose) {
                this.onDispose();
            }
        }

        public copyTo(other: Material): void {
            other.checkReadyOnlyOnce = this.checkReadyOnlyOnce;
            other.checkReadyOnEveryCall = this.checkReadyOnEveryCall;
            other.alpha = this.alpha;
            other.fillMode = this.fillMode;
            other.backFaceCulling = this.backFaceCulling;
            other.fogEnabled = this.fogEnabled;
            other.wireframe = this.wireframe;
            other.zOffset = this.zOffset;
            other.alphaMode = this.alphaMode;
            other.sideOrientation = this.sideOrientation;
            other.disableDepthWrite = this.disableDepthWrite;
            other.pointSize = this.pointSize;
            other.pointsCloud = this.pointsCloud;
        }

        public serialize(): any {
            var serializationObject: any = {};

            serializationObject.name = this.name;
            serializationObject.alpha = this.alpha;

            serializationObject.id = this.id;
            serializationObject.tags = Tags.GetTags(this);
            serializationObject.backFaceCulling = this.backFaceCulling;

            return serializationObject;
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
            return materialType.Parse(parsedMaterial, scene, rootUrl);
        }
    }
} 