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
    var SkyMaterialDefines = (function (_super) {
        __extends(SkyMaterialDefines, _super);
        function SkyMaterialDefines() {
            _super.call(this);
            this.CLIPPLANE = false;
            this.POINTSIZE = false;
            this.FOG = false;
            this.VERTEXCOLOR = false;
            this.VERTEXALPHA = false;
            this._keys = Object.keys(this);
        }
        return SkyMaterialDefines;
    })(BABYLON.MaterialDefines);
    var SkyMaterial = (function (_super) {
        __extends(SkyMaterial, _super);
        function SkyMaterial(name, scene) {
            _super.call(this, name, scene);
            // Public members
            this.luminance = 1.0;
            this.turbidity = 10.0;
            this.rayleigh = 2.0;
            this.mieCoefficient = 0.005;
            this.mieDirectionalG = 0.8;
            this.distance = 500;
            this.inclination = 0.49;
            this.azimuth = 0.25;
            // Private members
            this._sunPosition = BABYLON.Vector3.Zero();
            this._defines = new SkyMaterialDefines();
            this._cachedDefines = new SkyMaterialDefines();
        }
        SkyMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        SkyMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        SkyMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        SkyMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
            if (!mesh) {
                return true;
            }
            if (mesh._materialDefines && mesh._materialDefines.isEqual(this._defines)) {
                return true;
            }
            return false;
        };
        SkyMaterial.prototype.isReady = function (mesh, useInstances) {
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
            this._defines.reset();
            // Effect
            if (scene.clipPlane) {
                this._defines.CLIPPLANE = true;
            }
            // Point size
            if (this.pointsCloud || scene.forcePointsCloud) {
                this._defines.POINTSIZE = true;
            }
            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }
            // Attribs
            if (mesh) {
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                    this._defines.VERTEXCOLOR = true;
                    if (mesh.hasVertexAlpha) {
                        this._defines.VERTEXALPHA = true;
                    }
                }
            }
            // Get correct effect      
            if (!this._defines.isEqual(this._cachedDefines) || !this._effect) {
                this._defines.cloneTo(this._cachedDefines);
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (this._defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (this._defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                // Legacy browser patch
                var shaderName = "sky";
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName, attribs, ["world", "viewProjection", "view",
                    "vFogInfos", "vFogColor", "pointSize", "vClipPlane",
                    "luminance", "turbidity", "rayleigh", "mieCoefficient", "mieDirectionalG", "sunPosition"
                ], [], join, fallbacks, this.onCompiled, this.onError);
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new SkyMaterialDefines();
                }
                this._defines.cloneTo(mesh._materialDefines);
            }
            return true;
        };
        SkyMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        SkyMaterial.prototype.bind = function (world, mesh) {
            var scene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
            if (scene.getCachedMaterial() !== this) {
                // Clip plane
                if (scene.clipPlane) {
                    var clipPlane = scene.clipPlane;
                    this._effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }
                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._effect);
            // Sky
            this._effect.setFloat("luminance", this.luminance);
            this._effect.setFloat("turbidity", this.turbidity);
            this._effect.setFloat("rayleigh", this.rayleigh);
            this._effect.setFloat("mieCoefficient", this.mieCoefficient);
            this._effect.setFloat("mieDirectionalG", this.mieDirectionalG);
            var theta = Math.PI * (this.inclination - 0.5);
            var phi = 2 * Math.PI * (this.azimuth - 0.5);
            this._sunPosition.x = this.distance * Math.cos(phi);
            this._sunPosition.y = this.distance * Math.sin(phi) * Math.sin(theta);
            this._sunPosition.z = this.distance * Math.sin(phi) * Math.cos(theta);
            this._effect.setVector3("sunPosition", this._sunPosition);
            _super.prototype.bind.call(this, world, mesh);
        };
        SkyMaterial.prototype.getAnimatables = function () {
            return [];
        };
        SkyMaterial.prototype.dispose = function (forceDisposeEffect) {
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        SkyMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new SkyMaterial(name, _this.getScene()); }, this);
        };
        SkyMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.SkyMaterial";
            return serializationObject;
        };
        // Statics
        SkyMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new SkyMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "luminance");
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "turbidity");
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "rayleigh");
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "mieCoefficient");
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "mieDirectionalG");
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "distance");
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "inclination");
        __decorate([
            BABYLON.serialize()
        ], SkyMaterial.prototype, "azimuth");
        return SkyMaterial;
    })(BABYLON.Material);
    BABYLON.SkyMaterial = SkyMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['skyVertexShader'] = "precision highp float;\n\nattribute vec3 position;\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n\nuniform mat4 world;\nuniform mat4 view;\nuniform mat4 viewProjection;\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\nvoid main(void) {\n gl_Position = viewProjection * world * vec4(position, 1.0);\n vec4 worldPos = world * vec4(position, 1.0);\n vPositionW = vec3(worldPos);\n \n#include<clipPlaneVertex>\n \n#include<fogVertex>\n \n#ifdef VERTEXCOLOR\n vColor = color;\n#endif\n \n#ifdef POINTSIZE\n gl_PointSize = pointSize;\n#endif\n}\n";
BABYLON.Effect.ShadersStore['skyPixelShader'] = "precision highp float;\n\nvarying vec3 vPositionW;\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<clipPlaneFragmentDeclaration>\n\nuniform float luminance;\nuniform float turbidity;\nuniform float rayleigh;\nuniform float mieCoefficient;\nuniform float mieDirectionalG;\nuniform vec3 sunPosition;\n\n#include<fogFragmentDeclaration>\n\nconst float e = 2.71828182845904523536028747135266249775724709369995957;\nconst float pi = 3.141592653589793238462643383279502884197169;\nconst float n = 1.0003;\nconst float N = 2.545E25;\nconst float pn = 0.035;\nconst vec3 lambda = vec3(680E-9, 550E-9, 450E-9);\nconst vec3 K = vec3(0.686, 0.678, 0.666);\nconst float v = 4.0;\nconst float rayleighZenithLength = 8.4E3;\nconst float mieZenithLength = 1.25E3;\nconst vec3 up = vec3(0.0, 1.0, 0.0);\nconst float EE = 1000.0;\nconst float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;\nconst float cutoffAngle = pi/1.95;\nconst float steepness = 1.5;\nvec3 totalRayleigh(vec3 lambda)\n{\n return (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn));\n}\nvec3 simplifiedRayleigh()\n{\n return 0.0005 / vec3(94, 40, 18);\n}\nfloat rayleighPhase(float cosTheta)\n{ \n return (3.0 / (16.0*pi)) * (1.0 + pow(cosTheta, 2.0));\n}\nvec3 totalMie(vec3 lambda, vec3 K, float T)\n{\n float c = (0.2 * T ) * 10E-18;\n return 0.434 * c * pi * pow((2.0 * pi) / lambda, vec3(v - 2.0)) * K;\n}\nfloat hgPhase(float cosTheta, float g)\n{\n return (1.0 / (4.0*pi)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0*g*cosTheta + pow(g, 2.0), 1.5));\n}\nfloat sunIntensity(float zenithAngleCos)\n{\n return EE * max(0.0, 1.0 - exp(-((cutoffAngle - acos(zenithAngleCos))/steepness)));\n}\nfloat A = 0.15;\nfloat B = 0.50;\nfloat C = 0.10;\nfloat D = 0.20;\nfloat EEE = 0.02;\nfloat F = 0.30;\nfloat W = 1000.0;\nvec3 Uncharted2Tonemap(vec3 x)\n{\n return ((x*(A*x+C*B)+D*EEE)/(x*(A*x+B)+D*F))-EEE/F;\n}\nvoid main(void) {\n \n#include<clipPlaneFragment>\n \n const vec3 cameraPos = vec3(0.0, 0.0, 0.0);\n float sunfade = 1.0 - clamp(1.0 - exp((sunPosition.y / 450000.0)), 0.0, 1.0);\n float rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));\n vec3 sunDirection = normalize(sunPosition);\n float sunE = sunIntensity(dot(sunDirection, up));\n vec3 betaR = simplifiedRayleigh() * rayleighCoefficient;\n vec3 betaM = totalMie(lambda, K, turbidity) * mieCoefficient;\n float zenithAngle = acos(max(0.0, dot(up, normalize(vPositionW - cameraPos))));\n float sR = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));\n float sM = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));\n vec3 Fex = exp(-(betaR * sR + betaM * sM));\n float cosTheta = dot(normalize(vPositionW - cameraPos), sunDirection);\n float rPhase = rayleighPhase(cosTheta*0.5+0.5);\n vec3 betaRTheta = betaR * rPhase;\n float mPhase = hgPhase(cosTheta, mieDirectionalG);\n vec3 betaMTheta = betaM * mPhase;\n vec3 Lin = pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * (1.0 - Fex),vec3(1.5));\n Lin *= mix(vec3(1.0), pow(sunE * ((betaRTheta + betaMTheta) / (betaR + betaM)) * Fex, vec3(1.0 / 2.0)), clamp(pow(1.0-dot(up, sunDirection), 5.0), 0.0, 1.0));\n vec3 direction = normalize(vPositionW - cameraPos);\n float theta = acos(direction.y);\n float phi = atan(direction.z, direction.x);\n vec2 uv = vec2(phi, theta) / vec2(2.0 * pi, pi) + vec2(0.5, 0.0);\n vec3 L0 = vec3(0.1) * Fex;\n float sundisk = smoothstep(sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta);\n L0 += (sunE * 19000.0 * Fex) * sundisk;\n vec3 whiteScale = 1.0/Uncharted2Tonemap(vec3(W));\n vec3 texColor = (Lin+L0); \n texColor *= 0.04 ;\n texColor += vec3(0.0,0.001,0.0025)*0.3;\n float g_fMaxLuminance = 1.0;\n float fLumScaled = 0.1 / luminance; \n float fLumCompressed = (fLumScaled * (1.0 + (fLumScaled / (g_fMaxLuminance * g_fMaxLuminance)))) / (1.0 + fLumScaled); \n float ExposureBias = fLumCompressed;\n vec3 curr = Uncharted2Tonemap((log2(2.0/pow(luminance,4.0)))*texColor);\n vec3 skyColor = curr * whiteScale;\n vec3 retColor = pow(skyColor,vec3(1.0/(1.2+(1.2*sunfade))));\n vec4 baseColor = vec4(retColor, 1.0);\n \n \n float alpha = 1.0;\n#ifdef VERTEXCOLOR\n baseColor.rgb *= vColor.rgb;\n#endif\n \n vec3 diffuseBase = vec3(1.0, 1.0, 1.0);\n#ifdef VERTEXALPHA\n alpha *= vColor.a;\n#endif\n \n vec4 color = vec4(baseColor.rgb, alpha);\n \n#include<fogFragment>\n gl_FragColor = color;\n}";
