/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    class GRIDMaterialDefines extends MaterialDefines {
        public TRANSPARENT = false;

        public FOG = false;

        constructor() {
            super();
            this._keys = Object.keys(this);
        }
    }

    /**
     * The grid materials allows you to wrap any shape with a grid.
     * Colors are customizable.
     */
    export class GridMaterial extends BABYLON.Material {

        /**
         * Main color of the grid (e.g. between lines)
         */
        @serializeAsColor3()
        public mainColor = Color3.White();

        /**
         * Color of the grid lines.
         */
        @serializeAsColor3()
        public lineColor = Color3.Black();

        /**
         * The scale of the grid compared to unit.
         */
        @serialize()
        public gridRatio = 1.0;

        /**
         * The frequency of thicker lines.
         */
        @serialize()
        public majorUnitFrequency = 10;

        /**
         * The visibility of minor units in the grid.
         */
        @serialize()
        public minorUnitVisibility = 0.33;

        /**
         * The grid opacity outside of the lines.
         */
        @serialize()
        public opacity = 1.0;

        private _gridControl: Vector4 = new Vector4(this.gridRatio, this.majorUnitFrequency, this.minorUnitVisibility, this.opacity);

        private _renderId: number;
        private _defines = new GRIDMaterialDefines();
        private _cachedDefines = new GRIDMaterialDefines();

        /**
         * constructor
         * @param name The name given to the material in order to identify it afterwards.
         * @param scene The scene the material is used in.
         */
        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        /**
         * Returns wehter or not the grid requires alpha blending.
         */
        public needAlphaBlending(): boolean {
            return this.opacity < 1.0;
        }

        private _checkCache(scene: Scene, mesh?: AbstractMesh, useInstances?: boolean): boolean {
            if (!mesh) {
                return true;
            }

            if (mesh._materialDefines && mesh._materialDefines.isEqual(this._defines)) {
                return true;
            }

            return false;
        }

        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            if (this.checkReadyOnlyOnce) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }

            var scene = this.getScene();

            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    if (this._checkCache(scene, mesh, useInstances)) {
                        return true;
                    }
                }
            }

            var engine = scene.getEngine();
            var needNormals = true;

            this._defines.reset();

            if (this.opacity < 1.0) {
                this._defines.TRANSPARENT = true;
            }

            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }

            // Get correct effect      
            if (!this._effect || !this._defines.isEqual(this._cachedDefines)) {
                this._defines.cloneTo(this._cachedDefines);
                scene.resetCachedMaterial();

                // Attributes
                var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

                // Effect
                var shaderName = scene.getEngine().getCaps().standardDerivatives ? "grid" : "legacygrid";

                // Defines
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs,
                    ["worldViewProjection", "mainColor", "lineColor", "gridControl", "vFogInfos", "vFogColor", "world", "view"],
                    [],
                    join,
                    null,
                    this.onCompiled,
                    this.onError);
            }

            if (!this._effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
            var scene = this.getScene();

            this._effect.setMatrix("worldViewProjection", world.multiply(scene.getTransformMatrix()));
            this._effect.setMatrix("world", world);
            this._effect.setMatrix("view", scene.getViewMatrix());
        }

        public bind(world: Matrix, mesh?: Mesh): void {
            var scene = this.getScene();

            // Matrices
            this.bindOnlyWorldMatrix(world);

            // Uniforms
            if (scene.getCachedMaterial() !== (<BABYLON.Material>this)) {
                this._effect.setColor3("mainColor", this.mainColor);
                this._effect.setColor3("lineColor", this.lineColor);

                this._gridControl.x = this.gridRatio;
                this._gridControl.y = Math.round(this.majorUnitFrequency);
                this._gridControl.z = this.minorUnitVisibility;
                this._gridControl.w = this.opacity;
                this._effect.setVector4("gridControl", this._gridControl);
            }

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._effect);

            super.bind(world, mesh);
        }

        public dispose(forceDisposeEffect?: boolean): void {
            super.dispose(forceDisposeEffect);
        }

        public clone(name: string): GridMaterial {
            return SerializationHelper.Clone(() => new GridMaterial(name, this.getScene()), this);
        }

        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.GridMaterial";
            return serializationObject;
        }

        public static Parse(source: any, scene: Scene, rootUrl: string): GridMaterial {
            return SerializationHelper.Parse(() => new GridMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
}