/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    /** @hidden */
    var SkyMaterialDefines = /** @class */ (function (_super) {
        __extends(SkyMaterialDefines, _super);
        function SkyMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.CLIPPLANE = false;
            _this.CLIPPLANE2 = false;
            _this.CLIPPLANE3 = false;
            _this.CLIPPLANE4 = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.rebuild();
            return _this;
        }
        return SkyMaterialDefines;
    }(BABYLON.MaterialDefines));
    /**
     * This is the sky material which allows to create dynamic and texture free effects for skyboxes.
     * @see https://doc.babylonjs.com/extensions/sky
     */
    var SkyMaterial = /** @class */ (function (_super) {
        __extends(SkyMaterial, _super);
        /**
         * Instantiates a new sky material.
         * This material allows to create dynamic and texture free
         * effects for skyboxes by taking care of the atmosphere state.
         * @see https://doc.babylonjs.com/extensions/sky
         * @param name Define the name of the material in the scene
         * @param scene Define the scene the material belong to
         */
        function SkyMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            /**
             * Defines the overall luminance of sky in interval ]0, 1[.
             */
            _this.luminance = 1.0;
            /**
             * Defines the amount (scattering) of haze as opposed to molecules in atmosphere.
             */
            _this.turbidity = 10.0;
            /**
             * Defines the sky appearance (light intensity).
             */
            _this.rayleigh = 2.0;
            /**
             * Defines the mieCoefficient in interval [0, 0.1] which affects the property .mieDirectionalG.
             */
            _this.mieCoefficient = 0.005;
            /**
             * Defines the amount of haze particles following the Mie scattering theory.
             */
            _this.mieDirectionalG = 0.8;
            /**
             * Defines the distance of the sun according to the active scene camera.
             */
            _this.distance = 500;
            /**
             * Defines the sun inclination, in interval [-0.5, 0.5]. When the inclination is not 0, the sun is said
             * "inclined".
             */
            _this.inclination = 0.49;
            /**
             * Defines the solar azimuth in interval [0, 1]. The azimuth is the angle in the horizontal plan between
             * an object direction and a reference direction.
             */
            _this.azimuth = 0.25;
            /**
             * Defines the sun position in the sky on (x,y,z). If the property .useSunPosition is set to false, then
             * the property is overriden by the inclination and the azimuth and can be read at any moment.
             */
            _this.sunPosition = new BABYLON.Vector3(0, 100, 0);
            /**
             * Defines if the sun position should be computed (inclination and azimuth) according to the given
             * .sunPosition property.
             */
            _this.useSunPosition = false;
            /**
             * Defines an offset vector used to get a horizon offset.
             * @example skyMaterial.cameraOffset.y = camera.globalPosition.y // Set horizon relative to 0 on the Y axis
             */
            _this.cameraOffset = BABYLON.Vector3.Zero();
            _this._cameraPosition = BABYLON.Vector3.Zero();
            return _this;
        }
        /**
         * Specifies if the material will require alpha blending
         * @returns a boolean specifying if alpha blending is needed
         */
        SkyMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        /**
         * Specifies if this material should be rendered in alpha test mode
         * @returns false as the sky material doesn't need alpha testing.
         */
        SkyMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        /**
         * Get the texture used for alpha test purpose.
         * @returns null as the sky material has no texture.
         */
        SkyMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        /**
         * Get if the submesh is ready to be used and all its information available.
         * Child classes can use it to update shaders
         * @param mesh defines the mesh to check
         * @param subMesh defines which submesh to check
         * @param useInstances specifies that instances should be used
         * @returns a boolean indicating that the submesh is ready or not
         */
        SkyMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new SkyMaterialDefines();
            }
            var defines = subMesh._materialDefines;
            var scene = this.getScene();
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, false, defines);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, false);
            // Get correct effect
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                var shaderName = "sky";
                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect(shaderName, attribs, ["world", "viewProjection", "view",
                    "vFogInfos", "vFogColor", "pointSize", "vClipPlane", "vClipPlane2", "vClipPlane3", "vClipPlane4",
                    "luminance", "turbidity", "rayleigh", "mieCoefficient", "mieDirectionalG", "sunPosition",
                    "cameraPosition", "cameraOffset"
                ], [], join, fallbacks, this.onCompiled, this.onError), defines);
            }
            if (!subMesh.effect || !subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        /**
         * Binds the submesh to this material by preparing the effect and shader to draw
         * @param world defines the world transformation matrix
         * @param mesh defines the mesh containing the submesh
         * @param subMesh defines the submesh to bind the material to
         */
        SkyMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
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
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            if (this._mustRebind(scene, effect)) {
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            // Sky
            var camera = scene.activeCamera;
            if (camera) {
                var cameraWorldMatrix = camera.getWorldMatrix();
                this._cameraPosition.x = cameraWorldMatrix.m[12];
                this._cameraPosition.y = cameraWorldMatrix.m[13];
                this._cameraPosition.z = cameraWorldMatrix.m[14];
                this._activeEffect.setVector3("cameraPosition", this._cameraPosition);
            }
            this._activeEffect.setVector3("cameraOffset", this.cameraOffset);
            if (this.luminance > 0) {
                this._activeEffect.setFloat("luminance", this.luminance);
            }
            this._activeEffect.setFloat("turbidity", this.turbidity);
            this._activeEffect.setFloat("rayleigh", this.rayleigh);
            this._activeEffect.setFloat("mieCoefficient", this.mieCoefficient);
            this._activeEffect.setFloat("mieDirectionalG", this.mieDirectionalG);
            if (!this.useSunPosition) {
                var theta = Math.PI * (this.inclination - 0.5);
                var phi = 2 * Math.PI * (this.azimuth - 0.5);
                this.sunPosition.x = this.distance * Math.cos(phi);
                this.sunPosition.y = this.distance * Math.sin(phi) * Math.sin(theta);
                this.sunPosition.z = this.distance * Math.sin(phi) * Math.cos(theta);
            }
            this._activeEffect.setVector3("sunPosition", this.sunPosition);
            this._afterBind(mesh, this._activeEffect);
        };
        /**
         * Get the list of animatables in the material.
         * @returns the list of animatables object used in the material
         */
        SkyMaterial.prototype.getAnimatables = function () {
            return [];
        };
        /**
         * Disposes the material
         * @param forceDisposeEffect specifies if effects should be forcefully disposed
         */
        SkyMaterial.prototype.dispose = function (forceDisposeEffect) {
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        /**
         * Makes a duplicate of the material, and gives it a new name
         * @param name defines the new name for the duplicated material
         * @returns the cloned material
         */
        SkyMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new SkyMaterial(name, _this.getScene()); }, this);
        };
        /**
         * Serializes this material in a JSON representation
         * @returns the serialized material object
         */
        SkyMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.SkyMaterial";
            return serializationObject;
        };
        /**
         * Gets the current class name of the material e.g. "SkyMaterial"
         * Mainly use in serialization.
         * @returns the class name
         */
        SkyMaterial.prototype.getClassName = function () {
            return "SkyMaterial";
        };
        /**
         * Creates a sky material from parsed material data
         * @param source defines the JSON representation of the material
         * @param scene defines the hosting scene
         * @param rootUrl defines the root URL to use to load textures and relative dependencies
         * @returns a new sky material
         */
        SkyMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new SkyMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "luminance", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "turbidity", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "rayleigh", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "mieCoefficient", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "mieDirectionalG", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "distance", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "inclination", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "azimuth", void 0);
        __decorate([
            BABYLON.serializeAsVector3()
        ], SkyMaterial.prototype, "sunPosition", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "useSunPosition", void 0);
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "cameraOffset", void 0);
        return SkyMaterial;
    }(BABYLON.PushMaterial));
    BABYLON.SkyMaterial = SkyMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.skyMaterial.js.map

BABYLON.Effect.ShadersStore['skyVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n\nuniform mat4 world;\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\nvoid main(void) {\ngl_Position=viewProjection*world*vec4(position,1.0);\nvec4 worldPos=world*vec4(position,1.0);\nvPositionW=vec3(worldPos);\n\n#include<clipPlaneVertex>\n\n#include<fogVertex>\n\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n\n#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['skyPixelShader'] = "precision highp float;\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\nuniform vec3 cameraPosition;\nuniform vec3 cameraOffset;\nuniform float luminance;\nuniform float turbidity;\nuniform float rayleigh;\nuniform float mieCoefficient;\nuniform float mieDirectionalG;\nuniform vec3 sunPosition;\n\n#include<fogFragmentDeclaration>\n\nconst float e=2.71828182845904523536028747135266249775724709369995957;\nconst float pi=3.141592653589793238462643383279502884197169;\nconst float n=1.0003;\nconst float N=2.545E25;\nconst float pn=0.035;\nconst vec3 lambda=vec3(680E-9,550E-9,450E-9);\nconst vec3 K=vec3(0.686,0.678,0.666);\nconst float v=4.0;\nconst float rayleighZenithLength=8.4E3;\nconst float mieZenithLength=1.25E3;\nconst vec3 up=vec3(0.0,1.0,0.0);\nconst float EE=1000.0;\nconst float sunAngularDiameterCos=0.999956676946448443553574619906976478926848692873900859324;\nconst float cutoffAngle=pi/1.95;\nconst float steepness=1.5;\nvec3 totalRayleigh(vec3 lambda)\n{\nreturn (8.0*pow(pi,3.0)*pow(pow(n,2.0)-1.0,2.0)*(6.0+3.0*pn))/(3.0*N*pow(lambda,vec3(4.0))*(6.0-7.0*pn));\n}\nvec3 simplifiedRayleigh()\n{\nreturn 0.0005/vec3(94,40,18);\n}\nfloat rayleighPhase(float cosTheta)\n{ \nreturn (3.0/(16.0*pi))*(1.0+pow(cosTheta,2.0));\n}\nvec3 totalMie(vec3 lambda,vec3 K,float T)\n{\nfloat c=(0.2*T )*10E-18;\nreturn 0.434*c*pi*pow((2.0*pi)/lambda,vec3(v-2.0))*K;\n}\nfloat hgPhase(float cosTheta,float g)\n{\nreturn (1.0/(4.0*pi))*((1.0-pow(g,2.0))/pow(1.0-2.0*g*cosTheta+pow(g,2.0),1.5));\n}\nfloat sunIntensity(float zenithAngleCos)\n{\nreturn EE*max(0.0,1.0-exp((-(cutoffAngle-acos(zenithAngleCos))/steepness)));\n}\nfloat A=0.15;\nfloat B=0.50;\nfloat C=0.10;\nfloat D=0.20;\nfloat EEE=0.02;\nfloat F=0.30;\nfloat W=1000.0;\nvec3 Uncharted2Tonemap(vec3 x)\n{\nreturn ((x*(A*x+C*B)+D*EEE)/(x*(A*x+B)+D*F))-EEE/F;\n}\nvoid main(void) {\n\n#include<clipPlaneFragment>\n\nfloat sunfade=1.0-clamp(1.0-exp((sunPosition.y/450000.0)),0.0,1.0);\nfloat rayleighCoefficient=rayleigh-(1.0*(1.0-sunfade));\nvec3 sunDirection=normalize(sunPosition);\nfloat sunE=sunIntensity(dot(sunDirection,up));\nvec3 betaR=simplifiedRayleigh()*rayleighCoefficient;\nvec3 betaM=totalMie(lambda,K,turbidity)*mieCoefficient;\nfloat zenithAngle=acos(max(0.0,dot(up,normalize(vPositionW-cameraPosition+cameraOffset))));\nfloat sR=rayleighZenithLength/(cos(zenithAngle)+0.15*pow(93.885-((zenithAngle*180.0)/pi),-1.253));\nfloat sM=mieZenithLength/(cos(zenithAngle)+0.15*pow(93.885-((zenithAngle*180.0)/pi),-1.253));\nvec3 Fex=exp(-(betaR*sR+betaM*sM));\nfloat cosTheta=dot(normalize(vPositionW-cameraPosition),sunDirection);\nfloat rPhase=rayleighPhase(cosTheta*0.5+0.5);\nvec3 betaRTheta=betaR*rPhase;\nfloat mPhase=hgPhase(cosTheta,mieDirectionalG);\nvec3 betaMTheta=betaM*mPhase;\nvec3 Lin=pow(sunE*((betaRTheta+betaMTheta)/(betaR+betaM))*(1.0-Fex),vec3(1.5));\nLin*=mix(vec3(1.0),pow(sunE*((betaRTheta+betaMTheta)/(betaR+betaM))*Fex,vec3(1.0/2.0)),clamp(pow(1.0-dot(up,sunDirection),5.0),0.0,1.0));\nvec3 direction=normalize(vPositionW-cameraPosition);\nfloat theta=acos(direction.y);\nfloat phi=atan(direction.z,direction.x);\nvec2 uv=vec2(phi,theta)/vec2(2.0*pi,pi)+vec2(0.5,0.0);\nvec3 L0=vec3(0.1)*Fex;\nfloat sundisk=smoothstep(sunAngularDiameterCos,sunAngularDiameterCos+0.00002,cosTheta);\nL0+=(sunE*19000.0*Fex)*sundisk;\nvec3 whiteScale=1.0/Uncharted2Tonemap(vec3(W));\nvec3 texColor=(Lin+L0);\ntexColor*=0.04 ;\ntexColor+=vec3(0.0,0.001,0.0025)*0.3;\nfloat g_fMaxLuminance=1.0;\nfloat fLumScaled=0.1/luminance; \nfloat fLumCompressed=(fLumScaled*(1.0+(fLumScaled/(g_fMaxLuminance*g_fMaxLuminance))))/(1.0+fLumScaled); \nfloat ExposureBias=fLumCompressed;\nvec3 curr=Uncharted2Tonemap((log2(2.0/pow(luminance,4.0)))*texColor);\n\n\n\nvec3 retColor=curr*whiteScale;\n\n\nfloat alpha=1.0;\n#ifdef VERTEXCOLOR\nretColor.rgb*=vColor.rgb;\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n\nvec4 color=clamp(vec4(retColor.rgb,alpha),0.0,1.0);\n\n#include<fogFragment>\ngl_FragColor=color;\n}\n";
