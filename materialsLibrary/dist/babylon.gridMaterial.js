/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var BABYLON;
(function (BABYLON) {
    var GRIDMaterialDefines = (function (_super) {
        __extends(GRIDMaterialDefines, _super);
        function GRIDMaterialDefines() {
            _super.call(this);
            this.TRANSPARENT = false;
            this._keys = Object.keys(this);
        }
        return GRIDMaterialDefines;
    })(BABYLON.MaterialDefines);
    /**
     * The grid materials allows you to wrap any shape with a grid.
     * Colors are customizable.
     */
    var GridMaterial = (function (_super) {
        __extends(GridMaterial, _super);
        /**
         * constructor
         * @param name The name given to the material in order to identify it afterwards.
         * @param scene The scene the material is used in.
         */
        function GridMaterial(name, scene) {
            _super.call(this, name, scene);
            /**
             * Main color of the grid (e.g. between lines)
             */
            this.mainColor = BABYLON.Color3.White();
            /**
             * Color of the grid lines.
             */
            this.lineColor = BABYLON.Color3.Black();
            /**
             * The scale of the grid compared to unit.
             */
            this.gridRatio = 1.0;
            /**
             * The frequency of thicker lines.
             */
            this.majorUnitFrequency = 10;
            /**
             * The visibility of minor units in the grid.
             */
            this.minorUnitVisibility = 0.33;
            /**
             * The grid opacity outside of the lines.
             */
            this.opacity = 1.0;
            this._gridControl = new BABYLON.Vector4(this.gridRatio, this.majorUnitFrequency, this.minorUnitVisibility, this.opacity);
            this._defines = new GRIDMaterialDefines();
            this._cachedDefines = new GRIDMaterialDefines();
            // Forces cache to be different on first creation.
            this._cachedDefines.TRANSPARENT = true;
        }
        /**
         * Returns wehter or not the grid requires alpha blending.
         */
        GridMaterial.prototype.needAlphaBlending = function () {
            return this.opacity < 1.0;
        };
        GridMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
            if (!mesh) {
                return true;
            }
            if (mesh._materialDefines && mesh._materialDefines.isEqual(this._defines)) {
                return true;
            }
            return false;
        };
        GridMaterial.prototype.isReady = function (mesh, useInstances) {
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
            // Get correct effect      
            if (!this._defines.isEqual(this._cachedDefines)) {
                this._defines.cloneTo(this._cachedDefines);
                scene.resetCachedMaterial();
                // Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind, BABYLON.VertexBuffer.NormalKind];
                // Effect
                var shaderName = scene.getEngine().getCaps().standardDerivatives ? "grid" : "legacygrid";
                // Defines
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName, attribs, ["worldViewProjection", "mainColor", "lineColor", "gridControl"], [], join, null, this.onCompiled, this.onError);
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        GridMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            var scene = this.getScene();
            this._effect.setMatrix("worldViewProjection", world.multiply(scene.getTransformMatrix()));
        };
        GridMaterial.prototype.bind = function (world, mesh) {
            var scene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            // Uniforms
            if (scene.getCachedMaterial() !== this) {
                this._effect.setColor3("mainColor", this.mainColor);
                this._effect.setColor3("lineColor", this.lineColor);
                this._gridControl.x = this.gridRatio;
                this._gridControl.y = Math.round(this.majorUnitFrequency);
                this._gridControl.z = this.minorUnitVisibility;
                this._gridControl.w = this.opacity;
                this._effect.setVector4("gridControl", this._gridControl);
            }
            _super.prototype.bind.call(this, world, mesh);
        };
        GridMaterial.prototype.dispose = function (forceDisposeEffect) {
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        GridMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new GridMaterial(name, _this.getScene()); }, this);
        };
        GridMaterial.prototype.serialize = function () {
            return BABYLON.SerializationHelper.Serialize(this);
        };
        GridMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new GridMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serializeAsColor3()
        ], GridMaterial.prototype, "mainColor");
        __decorate([
            BABYLON.serializeAsColor3()
        ], GridMaterial.prototype, "lineColor");
        __decorate([
            BABYLON.serialize()
        ], GridMaterial.prototype, "gridRatio");
        __decorate([
            BABYLON.serialize()
        ], GridMaterial.prototype, "majorUnitFrequency");
        __decorate([
            BABYLON.serialize()
        ], GridMaterial.prototype, "minorUnitVisibility");
        __decorate([
            BABYLON.serialize()
        ], GridMaterial.prototype, "opacity");
        return GridMaterial;
    })(BABYLON.Material);
    BABYLON.GridMaterial = GridMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['gridVertexShader'] = "precision highp float;\n\nattribute vec3 position;\nattribute vec3 normal;\n\nuniform mat4 worldViewProjection;\n\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nvoid main(void) {\ngl_Position=worldViewProjection*vec4(position,1.0);\nvPosition=position;\nvNormal=normal;\n}";
BABYLON.Effect.ShadersStore['gridPixelShader'] = "#extension GL_OES_standard_derivatives : enable\n#define SQRT2 1.41421356\n#define PI 3.14159\nprecision highp float;\nuniform vec3 mainColor;\nuniform vec3 lineColor;\nuniform vec4 gridControl;\n\nvarying vec3 vPosition;\nvarying vec3 vNormal;\nfloat getVisibility(float position) {\n\nfloat majorGridFrequency=gridControl.y;\nif (floor(position+0.5) == floor(position/majorGridFrequency+0.5)*majorGridFrequency)\n{\nreturn 1.0;\n} \nreturn gridControl.z;\n}\nfloat getAnisotropicAttenuation(float differentialLength) {\nconst float maxNumberOfLines=10.0;\nreturn clamp(1.0/(differentialLength+1.0)-1.0/maxNumberOfLines,0.0,1.0);\n}\nfloat isPointOnLine(float position,float differentialLength) {\nfloat fractionPartOfPosition=position-floor(position+0.5); \nfractionPartOfPosition/=differentialLength; \nfractionPartOfPosition=clamp(fractionPartOfPosition,-1.,1.);\nfloat result=0.5+0.5*cos(fractionPartOfPosition*PI); \nreturn result; \n}\nfloat contributionOnAxis(float position) {\nfloat differentialLength=length(vec2(dFdx(position),dFdy(position)));\ndifferentialLength*=SQRT2; \n\nfloat result=isPointOnLine(position,differentialLength);\n\nfloat visibility=getVisibility(position);\nresult*=visibility;\n\nfloat anisotropicAttenuation=getAnisotropicAttenuation(differentialLength);\nresult*=anisotropicAttenuation;\nreturn result;\n}\nfloat normalImpactOnAxis(float x) {\nfloat normalImpact=clamp(1.0-2.8*abs(x*x*x),0.0,1.0);\nreturn normalImpact;\n}\nvoid main(void) {\n\nfloat gridRatio=gridControl.x;\nvec3 gridPos=vPosition/gridRatio;\n\nfloat x=contributionOnAxis(gridPos.x);\nfloat y=contributionOnAxis(gridPos.y);\nfloat z=contributionOnAxis(gridPos.z); \n\nvec3 normal=normalize(vNormal);\nx*=normalImpactOnAxis(normal.x);\ny*=normalImpactOnAxis(normal.y);\nz*=normalImpactOnAxis(normal.z);\n\nfloat grid=clamp(x+y+z,0.,1.);\n\nvec3 gridColor=mix(mainColor,lineColor,grid);\n#ifdef TRANSPARENT\nfloat opacity=clamp(grid,0.08,gridControl.w);\ngl_FragColor=vec4(gridColor.rgb,opacity);\n#else\n\ngl_FragColor=vec4(gridColor.rgb,1.0);\n#endif\n}";
BABYLON.Effect.ShadersStore['legacygridVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n\nuniform mat4 worldViewProjection;\nvoid main(void) {\ngl_Position=worldViewProjection*vec4(position,1.0);\n}";
BABYLON.Effect.ShadersStore['legacygridPixelShader'] = "void main(void) {\ngl_FragColor=vec4(1,1,1,0.1);\n}";
