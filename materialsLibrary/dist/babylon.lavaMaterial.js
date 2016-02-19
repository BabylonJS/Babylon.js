/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var maxSimultaneousLights = 4;
    var LavaMaterialDefines = (function (_super) {
        __extends(LavaMaterialDefines, _super);
        function LavaMaterialDefines() {
            _super.call(this);
            this.DIFFUSE = false;
            this.CLIPPLANE = false;
            this.ALPHATEST = false;
            this.POINTSIZE = false;
            this.FOG = false;
            this.LIGHT0 = false;
            this.LIGHT1 = false;
            this.LIGHT2 = false;
            this.LIGHT3 = false;
            this.SPOTLIGHT0 = false;
            this.SPOTLIGHT1 = false;
            this.SPOTLIGHT2 = false;
            this.SPOTLIGHT3 = false;
            this.HEMILIGHT0 = false;
            this.HEMILIGHT1 = false;
            this.HEMILIGHT2 = false;
            this.HEMILIGHT3 = false;
            this.DIRLIGHT0 = false;
            this.DIRLIGHT1 = false;
            this.DIRLIGHT2 = false;
            this.DIRLIGHT3 = false;
            this.POINTLIGHT0 = false;
            this.POINTLIGHT1 = false;
            this.POINTLIGHT2 = false;
            this.POINTLIGHT3 = false;
            this.SHADOW0 = false;
            this.SHADOW1 = false;
            this.SHADOW2 = false;
            this.SHADOW3 = false;
            this.SHADOWS = false;
            this.SHADOWVSM0 = false;
            this.SHADOWVSM1 = false;
            this.SHADOWVSM2 = false;
            this.SHADOWVSM3 = false;
            this.SHADOWPCF0 = false;
            this.SHADOWPCF1 = false;
            this.SHADOWPCF2 = false;
            this.SHADOWPCF3 = false;
            this.NORMAL = false;
            this.UV1 = false;
            this.UV2 = false;
            this.VERTEXCOLOR = false;
            this.VERTEXALPHA = false;
            this.NUM_BONE_INFLUENCERS = 0;
            this.BonesPerMesh = 0;
            this.INSTANCES = false;
            this._keys = Object.keys(this);
        }
        return LavaMaterialDefines;
    })(BABYLON.MaterialDefines);
    var LavaMaterial = (function (_super) {
        __extends(LavaMaterial, _super);
        function LavaMaterial(name, scene) {
            _super.call(this, name, scene);
            this.speed = 1;
            this.movingSpeed = 1;
            this.lowFrequencySpeed = 1;
            this.fogDensity = 0.15;
            this._lastTime = 0;
            this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.disableLighting = false;
            this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
            this._scaledDiffuse = new BABYLON.Color3();
            this._defines = new LavaMaterialDefines();
            this._cachedDefines = new LavaMaterialDefines();
            this._cachedDefines.BonesPerMesh = -1;
        }
        LavaMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        LavaMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        LavaMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        LavaMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
            if (!mesh) {
                return true;
            }
            if (this._defines.INSTANCES !== useInstances) {
                return false;
            }
            if (mesh._materialDefines && mesh._materialDefines.isEqual(this._defines)) {
                return true;
            }
            return false;
        };
        LavaMaterial.prototype.isReady = function (mesh, useInstances) {
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
            var needUVs = false;
            this._defines.reset();
            // Textures
            if (scene.texturesEnabled) {
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    }
                    else {
                        needUVs = true;
                        this._defines.DIFFUSE = true;
                    }
                }
            }
            // Effect
            if (scene.clipPlane) {
                this._defines.CLIPPLANE = true;
            }
            if (engine.getAlphaTesting()) {
                this._defines.ALPHATEST = true;
            }
            // Point size
            if (this.pointsCloud || scene.forcePointsCloud) {
                this._defines.POINTSIZE = true;
            }
            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }
            var lightIndex = 0;
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines);
            }
            // Attribs
            if (mesh) {
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                }
                if (needUVs) {
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        this._defines.UV1 = true;
                    }
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                        this._defines.UV2 = true;
                    }
                }
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                    this._defines.VERTEXCOLOR = true;
                    if (mesh.hasVertexAlpha) {
                        this._defines.VERTEXALPHA = true;
                    }
                }
                if (mesh.useBones && mesh.computeBonesUsingShaders) {
                    this._defines.NUM_BONE_INFLUENCERS = mesh.numBoneInfluencers;
                    this._defines.BonesPerMesh = (mesh.skeleton.bones.length + 1);
                }
                // Instances
                if (useInstances) {
                    this._defines.INSTANCES = true;
                }
            }
            // Get correct effect      
            if (!this._defines.isEqual(this._cachedDefines)) {
                this._defines.cloneTo(this._cachedDefines);
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (this._defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                BABYLON.MaterialHelper.HandleFallbacksForShadows(this._defines, fallbacks);
                if (this._defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (this._defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (this._defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (this._defines.UV2) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                }
                if (this._defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, this._defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, this._defines);
                // Legacy browser patch
                var shaderName = "lava";
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName, attribs, ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                    "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                    "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                    "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                    "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix",
                    "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3", "depthValues",
                    "time", "speed", "movingSpeed",
                    "fogColor", "fogDensity", "lowFrequencySpeed"
                ], ["diffuseSampler",
                    "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3", "noiseTexture"
                ], join, fallbacks, this.onCompiled, this.onError);
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new LavaMaterialDefines();
                }
                this._defines.cloneTo(mesh._materialDefines);
            }
            return true;
        };
        LavaMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        LavaMaterial.prototype.bind = function (world, mesh) {
            var scene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._effect);
            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._effect.setTexture("diffuseSampler", this.diffuseTexture);
                    this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                    this._effect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
                }
                if (this.noiseTexture) {
                    this._effect.setTexture("noiseTexture", this.noiseTexture);
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._effect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }
                this._effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._effect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.BindLights(scene, mesh, this._effect, this._defines);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._effect);
            this._lastTime += scene.getEngine().getDeltaTime();
            this._effect.setFloat("time", this._lastTime * this.speed / 1000);
            if (!this.fogColor) {
                this.fogColor = BABYLON.Color3.Black();
            }
            this._effect.setColor3("fogColor", this.fogColor);
            this._effect.setFloat("fogDensity", this.fogDensity);
            this._effect.setFloat("lowFrequencySpeed", this.lowFrequencySpeed);
            this._effect.setFloat("movingSpeed", this.movingSpeed);
            _super.prototype.bind.call(this, world, mesh);
        };
        LavaMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }
            if (this.noiseTexture && this.noiseTexture.animations && this.noiseTexture.animations.length > 0) {
                results.push(this.noiseTexture);
            }
            return results;
        };
        LavaMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }
            if (this.noiseTexture) {
                this.noiseTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        LavaMaterial.prototype.clone = function (name) {
            var newMaterial = new LavaMaterial(name, this.getScene());
            // Base material
            this.copyTo(newMaterial);
            // Lava material
            if (this.diffuseTexture && this.diffuseTexture.clone) {
                newMaterial.diffuseTexture = this.diffuseTexture.clone();
            }
            if (this.noiseTexture && this.noiseTexture.clone) {
                newMaterial.noiseTexture = this.noiseTexture.clone();
            }
            if (this.fogColor && this.fogColor.clone) {
                newMaterial.fogColor = this.fogColor.clone();
            }
            return newMaterial;
        };
        LavaMaterial.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.customType = "BABYLON.LavaMaterial";
            serializationObject.diffuseColor = this.diffuseColor.asArray();
            serializationObject.fogColor = this.fogColor.asArray();
            serializationObject.speed = this.speed;
            serializationObject.movingSpeed = this.movingSpeed;
            serializationObject.lowFrequencySpeed = this.lowFrequencySpeed;
            serializationObject.fogDensity = this.fogDensity;
            serializationObject.checkReadyOnlyOnce = this.checkReadyOnlyOnce;
            if (this.diffuseTexture) {
                serializationObject.diffuseTexture = this.diffuseTexture.serialize();
            }
            if (this.noiseTexture) {
                serializationObject.noiseTexture = this.noiseTexture.serialize();
            }
            return serializationObject;
        };
        LavaMaterial.Parse = function (source, scene, rootUrl) {
            var material = new LavaMaterial(source.name, scene);
            material.diffuseColor = BABYLON.Color3.FromArray(source.diffuseColor);
            material.speed = source.speed;
            material.fogColor = BABYLON.Color3.FromArray(source.fogColor);
            material.movingSpeed = source.movingSpeed;
            material.lowFrequencySpeed = source.lowFrequencySpeed;
            material.fogDensity = source.lowFrequencySpeed;
            material.alpha = source.alpha;
            material.id = source.id;
            BABYLON.Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;
            if (source.diffuseTexture) {
                material.diffuseTexture = BABYLON.Texture.Parse(source.diffuseTexture, scene, rootUrl);
            }
            if (source.noiseTexture) {
                material.noiseTexture = BABYLON.Texture.Parse(source.noiseTexture, scene, rootUrl);
            }
            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }
            return material;
        };
        return LavaMaterial;
    })(BABYLON.Material);
    BABYLON.LavaMaterial = LavaMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['lavaVertexShader'] = "precision highp float;\n// Inputs\nuniform float time;\nuniform float lowFrequencySpeed;\n// Varying\nvarying float noise;\n\n// Attributes\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n\n#include<bonesDeclaration>\n\n// Uniforms\n#include<instancesDeclaration>\n\nuniform mat4 view;\nuniform mat4 viewProjection;\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\n// Output\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n\n#include<clipPlaneVertexDeclaration>\n\n#include<fogVertexDeclaration>\n#include<shadowsVertexDeclaration>\n\n/* NOISE FUNCTIONS */\n////// ASHIMA webgl noise\n////// https://github.com/ashima/webgl-noise/blob/master/src/classicnoise3D.glsl\nvec3 mod289(vec3 x)\n{\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 mod289(vec4 x)\n{\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 permute(vec4 x)\n{\n  return mod289(((x*34.0)+1.0)*x);\n}\n\nvec4 taylorInvSqrt(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nvec3 fade(vec3 t) {\n  return t*t*t*(t*(t*6.0-15.0)+10.0);\n}\n\n// Classic Perlin noise, periodic variant\nfloat pnoise(vec3 P, vec3 rep)\n{\n  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period\n  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period\n  Pi0 = mod289(Pi0);\n  Pi1 = mod289(Pi1);\n  vec3 Pf0 = fract(P); // Fractional part for interpolation\n  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0\n  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);\n  vec4 iy = vec4(Pi0.yy, Pi1.yy);\n  vec4 iz0 = Pi0.zzzz;\n  vec4 iz1 = Pi1.zzzz;\n\n  vec4 ixy = permute(permute(ix) + iy);\n  vec4 ixy0 = permute(ixy + iz0);\n  vec4 ixy1 = permute(ixy + iz1);\n\n  vec4 gx0 = ixy0 * (1.0 / 7.0);\n  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;\n  gx0 = fract(gx0);\n  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);\n  vec4 sz0 = step(gz0, vec4(0.0));\n  gx0 -= sz0 * (step(0.0, gx0) - 0.5);\n  gy0 -= sz0 * (step(0.0, gy0) - 0.5);\n\n  vec4 gx1 = ixy1 * (1.0 / 7.0);\n  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;\n  gx1 = fract(gx1);\n  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);\n  vec4 sz1 = step(gz1, vec4(0.0));\n  gx1 -= sz1 * (step(0.0, gx1) - 0.5);\n  gy1 -= sz1 * (step(0.0, gy1) - 0.5);\n\n  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);\n  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);\n  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);\n  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);\n  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);\n  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);\n  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);\n  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);\n\n  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));\n  g000 *= norm0.x;\n  g010 *= norm0.y;\n  g100 *= norm0.z;\n  g110 *= norm0.w;\n  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));\n  g001 *= norm1.x;\n  g011 *= norm1.y;\n  g101 *= norm1.z;\n  g111 *= norm1.w;\n\n  float n000 = dot(g000, Pf0);\n  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));\n  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));\n  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));\n  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));\n  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));\n  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));\n  float n111 = dot(g111, Pf1);\n\n  vec3 fade_xyz = fade(Pf0);\n  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);\n  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);\n  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);\n  return 2.2 * n_xyz;\n}\n/* END FUNCTION */\n\nfloat turbulence( vec3 p ) {\n    float w = 100.0;\n    float t = -.5;\n    for (float f = 1.0 ; f <= 10.0 ; f++ ){\n        float power = pow( 2.0, f );\n        t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );\n    }\n    return t;\n}\n\nvoid main(void) {\n\n#include<instancesVertex>\n#include<bonesVertex>\n\n#ifdef NORMAL\n    // get a turbulent 3d noise using the normal, normal to high freq\n    noise = 10.0 *  -.10 * turbulence( .5 * normal + time*1.15 );\n    // get a 3d noise using the position, low frequency\n    float b = lowFrequencySpeed * 5.0 * pnoise( 0.05 * position +vec3(time*1.025), vec3( 100.0 ) );\n    // compose both noises\n    float displacement = - 1.5 * noise + b;\n\n    // move the position along the normal and transform it\n    vec3 newPosition = position + normal * displacement;\n    gl_Position = viewProjection * finalWorld * vec4( newPosition, 1.0 );\n\n\n\tvec4 worldPos = finalWorld * vec4(newPosition, 1.0);\n\tvPositionW = vec3(worldPos);\n\n\tvNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));\n#endif\n\n\t// Texture coordinates\n#ifndef UV1\n\tvec2 uv = vec2(0., 0.);\n#endif\n#ifndef UV2\n\tvec2 uv2 = vec2(0., 0.);\n#endif\n\n#ifdef DIFFUSE\n\tif (vDiffuseInfos.x == 0.)\n\t{\n\t\tvDiffuseUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));\n\t}\n\telse\n\t{\n\t\tvDiffuseUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));\n\t}\n#endif\n\n\t// Clip plane\n#include<clipPlaneVertex>\n\n\t// Fog\n#include<fogVertex>\n#include<shadowsVertex>\n\n\t// Vertex color\n#ifdef VERTEXCOLOR\n\tvColor = color;\n#endif\n\n\t// Point size\n#ifdef POINTSIZE\n\tgl_PointSize = pointSize;\n#endif\n}";
BABYLON.Effect.ShadersStore['lavaPixelShader'] = "precision highp float;\n\n// Constants\nuniform vec3 vEyePosition;\nuniform vec4 vDiffuseColor;\n\n// Input\nvarying vec3 vPositionW;\n\n// MAGMAAAA\nuniform float time;\nuniform float speed;\nuniform float movingSpeed;\nuniform vec3 fogColor;\nuniform sampler2D noiseTexture;\nuniform float fogDensity;\n\n// Varying\nvarying float noise;\n\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n// Lights\n#include<light0FragmentDeclaration>\n#include<light1FragmentDeclaration>\n#include<light2FragmentDeclaration>\n#include<light3FragmentDeclaration>\n\n\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n// Samplers\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n\n#include<clipPlaneFragmentDeclaration>\n\n// Fog\n#include<fogFragmentDeclaration>\n\n\nfloat random( vec3 scale, float seed ){\n    return fract( sin( dot( gl_FragCoord.xyz + seed, scale ) ) * 43758.5453 + seed ) ;\n}\n\n\nvoid main(void) {\n#include<clipPlaneFragment>\n\n\tvec3 viewDirectionW = normalize(vEyePosition - vPositionW);\n\n\t// Base color\n\tvec4 baseColor = vec4(1., 1., 1., 1.);\n\tvec3 diffuseColor = vDiffuseColor.rgb;\n\n\t// Alpha\n\tfloat alpha = vDiffuseColor.a;\n\n\n\n#ifdef DIFFUSE\n    ////// MAGMA ///\n\n\tvec4 noiseTex = texture2D( noiseTexture, vDiffuseUV );\n\tvec2 T1 = vDiffuseUV + vec2( 1.5, -1.5 ) * time  * 0.02;\n\tvec2 T2 = vDiffuseUV + vec2( -0.5, 2.0 ) * time * 0.01 * speed;\n\n\tT1.x += noiseTex.x * 2.0;\n\tT1.y += noiseTex.y * 2.0;\n\tT2.x -= noiseTex.y * 0.2 + time*0.001*movingSpeed;\n\tT2.y += noiseTex.z * 0.2 + time*0.002*movingSpeed;\n\n\tfloat p = texture2D( noiseTexture, T1 * 3.0 ).a;\n\n\tvec4 lavaColor = texture2D( diffuseSampler, T2 * 4.0);\n\tvec4 temp = lavaColor * ( vec4( p, p, p, p ) * 2. ) + ( lavaColor * lavaColor - 0.1 );\n\n\tbaseColor = temp;\n\n\tfloat depth = gl_FragCoord.z * 4.0;\n\tconst float LOG2 = 1.442695;\n    float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );\n    fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );\n\n    baseColor = mix( baseColor, vec4( fogColor, baseColor.w ), fogFactor );\n    diffuseColor = baseColor.rgb;\n    ///// END MAGMA ////\n\n\n\n//\tbaseColor = texture2D(diffuseSampler, vDiffuseUV);\n\n#ifdef ALPHATEST\n\tif (baseColor.a < 0.4)\n\t\tdiscard;\n#endif\n\n\tbaseColor.rgb *= vDiffuseInfos.y;\n#endif\n\n#ifdef VERTEXCOLOR\n\tbaseColor.rgb *= vColor.rgb;\n#endif\n\n\t// Bump\n#ifdef NORMAL\n\tvec3 normalW = normalize(vNormalW);\n#else\n\tvec3 normalW = vec3(1.0, 1.0, 1.0);\n#endif\n\n\t// Lighting\n\tvec3 diffuseBase = vec3(0., 0., 0.);\n\tfloat shadow = 1.;\n    float glossiness = 0.;\n    \n#include<light0Fragment>\n#include<light1Fragment>\n#include<light2Fragment>\n#include<light3Fragment>\n\n\n#ifdef VERTEXALPHA\n\talpha *= vColor.a;\n#endif\n\n\tvec3 finalDiffuse = clamp(diffuseBase * diffuseColor, 0.0, 1.0) * baseColor.rgb;\n\n\t// Composition\n\tvec4 color = vec4(finalDiffuse, alpha);\n\n#include<fogFragment>\n\n\tgl_FragColor = color;\n}";
