/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    class GridMaterialDefines extends MaterialDefines {
        public TRANSPARENT = false;
        public FOG = false;
        public PREMULTIPLYALPHA = false;

        constructor() {
            super();
            this.rebuild();
        }
    }

    /**
     * The grid materials allows you to wrap any shape with a grid.
     * Colors are customizable.
     */
    export class GridMaterial extends BABYLON.PushMaterial {

        /**
         * Main color of the grid (e.g. between lines)
         */
        @serializeAsColor3()
        public mainColor = Color3.Black();

        /**
         * Color of the grid lines.
         */
        @serializeAsColor3()
        public lineColor = Color3.Teal();

        /**
         * The scale of the grid compared to unit.
         */
        @serialize()
        public gridRatio = 1.0;

        /**
         * Allows setting an offset for the grid lines.
         */
        @serializeAsColor3()
        public gridOffset = Vector3.Zero();

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

        /**
         * Determine RBG output is premultiplied by alpha value.
         */
        @serialize()
        public preMultiplyAlpha = false;        

        private _gridControl: Vector4 = new Vector4(this.gridRatio, this.majorUnitFrequency, this.minorUnitVisibility, this.opacity);

        private _renderId: number;

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

        public needAlphaBlendingForMesh(mesh: AbstractMesh): boolean {
            return this.needAlphaBlending();
        }

        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {   
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }

            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new GridMaterialDefines();
            }

            var defines = <GridMaterialDefines>subMesh._materialDefines;
            var scene = this.getScene();

            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            if (defines.TRANSPARENT !== (this.opacity < 1.0)) {
                defines.TRANSPARENT = !defines.TRANSPARENT;
                defines.markAsUnprocessed();
            }

            if (defines.PREMULTIPLYALPHA != this.preMultiplyAlpha) {
                defines.PREMULTIPLYALPHA = !defines.PREMULTIPLYALPHA;
                defines.markAsUnprocessed();
            }

            MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, false, this.fogEnabled, defines);

            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();

                // Attributes
                var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

                // Defines
                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect("grid",
                    attribs,
                    ["projection", "worldView", "mainColor", "lineColor", "gridControl", "gridOffset", "vFogInfos", "vFogColor", "world", "view"],
                    [],
                    join,
                    undefined,
                    this.onCompiled,
                    this.onError), defines);
            }

            if (!subMesh.effect || !subMesh.effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
            var scene = this.getScene();

            var defines = <GridMaterialDefines>subMesh._materialDefines;
            if (!defines) {
                return;
            }

            var effect = subMesh.effect;
            if (!effect) {
                return;
            }
            this._activeEffect = effect;

            // Matrices
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("worldView", world.multiply(scene.getViewMatrix()));
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
            this._activeEffect.setMatrix("projection", scene.getProjectionMatrix());

            // Uniforms
            if (this._mustRebind(scene, effect)) {
                this._activeEffect.setColor3("mainColor", this.mainColor);
                this._activeEffect.setColor3("lineColor", this.lineColor);

                this._activeEffect.setVector3("gridOffset", this.gridOffset);

                this._gridControl.x = this.gridRatio;
                this._gridControl.y = Math.round(this.majorUnitFrequency);
                this._gridControl.z = this.minorUnitVisibility;
                this._gridControl.w = this.opacity;
                this._activeEffect.setVector4("gridControl", this._gridControl);
            }
            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

            this._afterBind(mesh, this._activeEffect);
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

        public getClassName(): string {
            return "GridMaterial";
        }

        public static Parse(source: any, scene: Scene, rootUrl: string): GridMaterial {
            return SerializationHelper.Parse(() => new GridMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
}