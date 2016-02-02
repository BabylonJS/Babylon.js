/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var BABYLON;
(function (BABYLON) {
    var maxSimultaneousLights = 4;
    var FireMaterialDefines = (function (_super) {
        __extends(FireMaterialDefines, _super);
        function FireMaterialDefines() {
            _super.call(this);
            this.DIFFUSE = false;
            this.CLIPPLANE = false;
            this.ALPHATEST = false;
            this.POINTSIZE = false;
            this.FOG = false;
            this.UV1 = false;
            this.NORMAL = false;
            this.VERTEXCOLOR = false;
            this.VERTEXALPHA = false;
            this.BONES = false;
            this.BONES4 = false;
            this.BonesPerMesh = 0;
            this.INSTANCES = false;
            this._keys = Object.keys(this);
        }
        return FireMaterialDefines;
    })(BABYLON.MaterialDefines);
    var FireMaterial = (function (_super) {
        __extends(FireMaterial, _super);
        function FireMaterial(name, scene) {
            _super.call(this, name, scene);
            this.diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.disableLighting = false;
            this.speed = 1.0;
            this._scaledDiffuse = new BABYLON.Color3();
            this._defines = new FireMaterialDefines();
            this._cachedDefines = new FireMaterialDefines();
            this._lastTime = 0;
            this._cachedDefines.BonesPerMesh = -1;
        }
        FireMaterial.prototype.needAlphaBlending = function () {
            return (this.alpha < 1.0);
        };
        FireMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        FireMaterial.prototype.getAlphaTestTexture = function () {
            return null;
        };
        // Methods   
        FireMaterial.prototype._checkCache = function (scene, mesh, useInstances) {
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
        FireMaterial.prototype.isReady = function (mesh, useInstances) {
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
            var needNormals = false;
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
            this._defines.ALPHATEST = true;
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
                if (needNormals && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                }
                if (needUVs) {
                    if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        this._defines.UV1 = true;
                    }
                }
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                    this._defines.VERTEXCOLOR = true;
                    if (mesh.hasVertexAlpha) {
                        this._defines.VERTEXALPHA = true;
                    }
                }
                if (mesh.useBones && mesh.computeBonesUsingShaders) {
                    this._defines.BONES = true;
                    this._defines.BonesPerMesh = (mesh.skeleton.bones.length + 1);
                    this._defines.BONES4 = true;
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
                if (this._defines.BONES4) {
                    fallbacks.addFallback(0, "BONES4");
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (this._defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (this._defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (this._defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                if (this._defines.BONES) {
                    attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                    attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                }
                if (this._defines.INSTANCES) {
                    attribs.push("world0");
                    attribs.push("world1");
                    attribs.push("world2");
                    attribs.push("world3");
                }
                // Legacy browser patch
                var shaderName = "fire";
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName, attribs, ["world", "view", "viewProjection", "vEyePosition",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos",
                    "mBones",
                    "vClipPlane", "diffuseMatrix",
                    // Fire
                    "time", "speed"
                ], ["diffuseSampler",
                    // Fire
                    "distortionSampler", "opacitySampler"
                ], join, fallbacks, this.onCompiled, this.onError);
            }
            if (!this._effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new FireMaterialDefines();
                }
                this._defines.cloneTo(mesh._materialDefines);
            }
            return true;
        };
        FireMaterial.prototype.bindOnlyWorldMatrix = function (world) {
            this._effect.setMatrix("world", world);
        };
        FireMaterial.prototype.bind = function (world, mesh) {
            var scene = this.getScene();
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
            }
            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._effect.setTexture("diffuseSampler", this.diffuseTexture);
                    this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                    this._effect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
                    this._effect.setTexture("distortionSampler", this.distortionTexture);
                    this._effect.setTexture("opacitySampler", this.opacityTexture);
                }
                // Clip plane
                if (scene.clipPlane) {
                    var clipPlane = scene.clipPlane;
                    this._effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }
                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }
                this._effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._effect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
                this._effect.setColor3("vFogColor", scene.fogColor);
            }
            // Time
            this._lastTime += scene.getEngine().getDeltaTime();
            this._effect.setFloat("time", this._lastTime);
            // Speed
            this._effect.setFloat("speed", this.speed);
            _super.prototype.bind.call(this, world, mesh);
        };
        FireMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }
            if (this.distortionTexture && this.distortionTexture.animations && this.distortionTexture.animations.length > 0) {
                results.push(this.distortionTexture);
            }
            if (this.opacityTexture && this.opacityTexture.animations && this.opacityTexture.animations.length > 0) {
                results.push(this.opacityTexture);
            }
            return results;
        };
        FireMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }
            if (this.distortionTexture) {
                this.distortionTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        FireMaterial.prototype.clone = function (name) {
            var newMaterial = new FireMaterial(name, this.getScene());
            // Base material
            this.copyTo(newMaterial);
            // Fire material
            if (this.diffuseTexture && this.diffuseTexture.clone) {
                newMaterial.diffuseTexture = this.diffuseTexture.clone();
            }
            if (this.distortionTexture && this.distortionTexture.clone) {
                newMaterial.distortionTexture = this.distortionTexture.clone();
            }
            if (this.opacityTexture && this.opacityTexture.clone) {
                newMaterial.opacityTexture = this.opacityTexture.clone();
            }
            newMaterial.diffuseColor = this.diffuseColor.clone();
            return newMaterial;
        };
        FireMaterial.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.customType = "BABYLON.FireMaterial";
            serializationObject.diffuseColor = this.diffuseColor.asArray();
            serializationObject.speed = this.speed;
            serializationObject.disableLighting = this.disableLighting;
            if (this.diffuseTexture) {
                serializationObject.diffuseTexture = this.diffuseTexture.serialize();
            }
            if (this.distortionTexture) {
                serializationObject.distortionTexture = this.distortionTexture.serialize();
            }
            if (this.opacityTexture) {
                serializationObject.opacityTexture = this.opacityTexture.serialize();
            }
            return serializationObject;
        };
        FireMaterial.Parse = function (source, scene, rootUrl) {
            var material = new FireMaterial(source.name, scene);
            material.diffuseColor = BABYLON.Color3.FromArray(source.diffuseColor);
            material.speed = source.speed;
            material.disableLighting = source.disableLighting;
            material.alpha = source.alpha;
            material.id = source.id;
            BABYLON.Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;
            if (source.diffuseTexture) {
                material.diffuseTexture = BABYLON.Texture.Parse(source.diffuseTexture, scene, rootUrl);
            }
            if (source.distortionTexture) {
                material.distortionTexture = BABYLON.Texture.Parse(source.distortionTexture, scene, rootUrl);
            }
            if (source.opacityTexture) {
                material.opacityTexture = BABYLON.Texture.Parse(source.opacityTexture, scene, rootUrl);
            }
            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }
            return material;
        };
        return FireMaterial;
    })(BABYLON.Material);
    BABYLON.FireMaterial = FireMaterial;
})(BABYLON || (BABYLON = {}));

BABYLON.Effect.ShadersStore['fireVertexShader'] = "precision highp float;\r\n\r\n// Attributes\r\nattribute vec3 position;\r\n#ifdef NORMAL\r\nattribute vec3 normal;\r\n#endif\r\n#ifdef UV1\r\nattribute vec2 uv;\r\n#endif\r\n#ifdef UV2\r\nattribute vec2 uv2;\r\n#endif\r\n#ifdef VERTEXCOLOR\r\nattribute vec4 color;\r\n#endif\r\n#ifdef BONES\r\nattribute vec4 matricesIndices;\r\nattribute vec4 matricesWeights;\r\n#endif\r\n\r\n// Uniforms\r\n\r\n#ifdef INSTANCES\r\nattribute vec4 world0;\r\nattribute vec4 world1;\r\nattribute vec4 world2;\r\nattribute vec4 world3;\r\n#else\r\nuniform mat4 world;\r\n#endif\r\n\r\nuniform mat4 view;\r\nuniform mat4 viewProjection;\r\n\r\n#ifdef DIFFUSE\r\nvarying vec2 vDiffuseUV;\r\n#endif\r\n\r\n#ifdef BONES\r\nuniform mat4 mBones[BonesPerMesh];\r\n#endif\r\n\r\n#ifdef POINTSIZE\r\nuniform float pointSize;\r\n#endif\r\n\r\n// Output\r\nvarying vec3 vPositionW;\r\n#ifdef NORMAL\r\nvarying vec3 vNormalW;\r\n#endif\r\n\r\n#ifdef VERTEXCOLOR\r\nvarying vec4 vColor;\r\n#endif\r\n\r\n#ifdef CLIPPLANE\r\nuniform vec4 vClipPlane;\r\nvarying float fClipDistance;\r\n#endif\r\n\r\n#ifdef FOG\r\nvarying float fFogDistance;\r\n#endif\r\n\r\n// Fire\r\nuniform float time;\r\nuniform float speed;\r\n\r\nvarying vec2 vDistortionCoords1;\r\nvarying vec2 vDistortionCoords2;\r\nvarying vec2 vDistortionCoords3;\r\n\r\nvoid main(void) {\r\n\tmat4 finalWorld;\r\n\r\n#ifdef INSTANCES\r\n\tfinalWorld = mat4(world0, world1, world2, world3);\r\n#else\r\n\tfinalWorld = world;\r\n#endif\r\n\r\n#ifdef BONES\r\n\tmat4 m0 = mBones[int(matricesIndices.x)] * matricesWeights.x;\r\n\tmat4 m1 = mBones[int(matricesIndices.y)] * matricesWeights.y;\r\n\tmat4 m2 = mBones[int(matricesIndices.z)] * matricesWeights.z;\r\n\r\n#ifdef BONES4\r\n\tmat4 m3 = mBones[int(matricesIndices.w)] * matricesWeights.w;\r\n\tfinalWorld = finalWorld * (m0 + m1 + m2 + m3);\r\n#else\r\n\tfinalWorld = finalWorld * (m0 + m1 + m2);\r\n#endif \r\n\r\n#endif\r\n\tgl_Position = viewProjection * finalWorld * vec4(position, 1.0);\r\n\r\n\tvec4 worldPos = finalWorld * vec4(position, 1.0);\r\n\tvPositionW = vec3(worldPos);\r\n\r\n#ifdef NORMAL\r\n\tvNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));\r\n#endif\r\n\r\n\t// Texture coordinates\r\n#ifdef DIFFUSE\r\n\tvDiffuseUV = uv;\r\n\tvDiffuseUV.y -= 0.2;\r\n#endif\r\n\r\n\t// Clip plane\r\n#ifdef CLIPPLANE\r\n\tfClipDistance = dot(worldPos, vClipPlane);\r\n#endif\r\n\r\n\t// Fog\r\n#ifdef FOG\r\n\tfFogDistance = (view * worldPos).z;\r\n#endif\r\n\r\n\t// Vertex color\r\n#ifdef VERTEXCOLOR\r\n\tvColor = color;\r\n#endif\r\n\r\n\t// Point size\r\n#ifdef POINTSIZE\r\n\tgl_PointSize = pointSize;\r\n#endif\r\n\r\n\t// Fire\r\n\tvec3 layerSpeed = vec3(-0.2, -0.52, -0.1) * speed;\r\n\t\r\n\tvDistortionCoords1.x = uv.x;\r\n\tvDistortionCoords1.y = uv.y + layerSpeed.x * time / 1000.0;\r\n\t\r\n\tvDistortionCoords2.x = uv.x;\r\n\tvDistortionCoords2.y = uv.y + layerSpeed.y * time / 1000.0;\r\n\t\r\n\tvDistortionCoords3.x = uv.x;\r\n\tvDistortionCoords3.y = uv.y + layerSpeed.z * time / 1000.0;\r\n}\r\n";
BABYLON.Effect.ShadersStore['firePixelShader'] = "precision highp float;\r\n\r\n// Constants\r\nuniform vec3 vEyePosition;\r\n\r\n// Input\r\nvarying vec3 vPositionW;\r\n\r\n#ifdef NORMAL\r\nvarying vec3 vNormalW;\r\n#endif\r\n\r\n#ifdef VERTEXCOLOR\r\nvarying vec4 vColor;\r\n#endif\r\n\r\n// Samplers\r\n#ifdef DIFFUSE\r\nvarying vec2 vDiffuseUV;\r\nuniform sampler2D diffuseSampler;\r\nuniform vec2 vDiffuseInfos;\r\n#endif\r\n\r\n// Fire\r\nuniform sampler2D distortionSampler;\r\nuniform sampler2D opacitySampler;\r\n\r\nvarying vec2 vDistortionCoords1;\r\nvarying vec2 vDistortionCoords2;\r\nvarying vec2 vDistortionCoords3;\r\n\r\n#ifdef CLIPPLANE\r\nvarying float fClipDistance;\r\n#endif\r\n\r\n// Fog\r\n#ifdef FOG\r\n\r\n#define FOGMODE_NONE    0.\r\n#define FOGMODE_EXP     1.\r\n#define FOGMODE_EXP2    2.\r\n#define FOGMODE_LINEAR  3.\r\n#define E 2.71828\r\n\r\nuniform vec4 vFogInfos;\r\nuniform vec3 vFogColor;\r\nvarying float fFogDistance;\r\n\r\nfloat CalcFogFactor()\r\n{\r\n\tfloat fogCoeff = 1.0;\r\n\tfloat fogStart = vFogInfos.y;\r\n\tfloat fogEnd = vFogInfos.z;\r\n\tfloat fogDensity = vFogInfos.w;\r\n\r\n\tif (FOGMODE_LINEAR == vFogInfos.x)\r\n\t{\r\n\t\tfogCoeff = (fogEnd - fFogDistance) / (fogEnd - fogStart);\r\n\t}\r\n\telse if (FOGMODE_EXP == vFogInfos.x)\r\n\t{\r\n\t\tfogCoeff = 1.0 / pow(E, fFogDistance * fogDensity);\r\n\t}\r\n\telse if (FOGMODE_EXP2 == vFogInfos.x)\r\n\t{\r\n\t\tfogCoeff = 1.0 / pow(E, fFogDistance * fFogDistance * fogDensity * fogDensity);\r\n\t}\r\n\r\n\treturn clamp(fogCoeff, 0.0, 1.0);\r\n}\r\n#endif\r\n\r\nvec4 bx2(vec4 x)\r\n{\r\n   return vec4(2.0) * x - vec4(1.0);\r\n}\r\n\r\nvoid main(void) {\r\n\t// Clip plane\r\n#ifdef CLIPPLANE\r\n\tif (fClipDistance > 0.0)\r\n\t\tdiscard;\r\n#endif\r\n\r\n\tvec3 viewDirectionW = normalize(vEyePosition - vPositionW);\r\n\r\n\t// Base color\r\n\tvec4 baseColor = vec4(1., 1., 1., 1.);\r\n\r\n\t// Alpha\r\n\tfloat alpha = 1.0;\r\n\r\n#ifdef DIFFUSE\r\n\t// Fire\r\n\tconst float distortionAmount0  = 0.092;\r\n\tconst float distortionAmount1  = 0.092;\r\n\tconst float distortionAmount2  = 0.092;\r\n\t\r\n\tvec2 heightAttenuation = vec2(0.3, 0.39);\r\n\t\r\n\tvec4 noise0 = texture2D(distortionSampler, vDistortionCoords1);\r\n\tvec4 noise1 = texture2D(distortionSampler, vDistortionCoords2);\r\n\tvec4 noise2 = texture2D(distortionSampler, vDistortionCoords3);\r\n\t\r\n\tvec4 noiseSum = bx2(noise0) * distortionAmount0 + bx2(noise1) * distortionAmount1 + bx2(noise2) * distortionAmount2;\r\n\t\r\n\tvec4 perturbedBaseCoords = vec4(vDiffuseUV, 0.0, 1.0) + noiseSum * (vDiffuseUV.y * heightAttenuation.x + heightAttenuation.y);\r\n\t\r\n\tvec4 opacityColor = texture2D(opacitySampler, perturbedBaseCoords.xy);\r\n\t\r\n#ifdef ALPHATEST\r\n\tif (opacityColor.r < 0.1)\r\n\t\tdiscard;\r\n#endif\r\n\t\r\n\tbaseColor = texture2D(diffuseSampler, perturbedBaseCoords.xy) * 2.0;\r\n\tbaseColor *= opacityColor;\r\n\r\n\tbaseColor.rgb *= vDiffuseInfos.y;\r\n#endif\r\n\r\n#ifdef VERTEXCOLOR\r\n\tbaseColor.rgb *= vColor.rgb;\r\n#endif\r\n\r\n\t// Bump\r\n#ifdef NORMAL\r\n\tvec3 normalW = normalize(vNormalW);\r\n#else\r\n\tvec3 normalW = vec3(1.0, 1.0, 1.0);\r\n#endif\r\n\r\n\t// Lighting\r\n\tvec3 diffuseBase = vec3(1.0, 1.0, 1.0);\r\n\r\n#ifdef VERTEXALPHA\r\n\talpha *= vColor.a;\r\n#endif\r\n\r\n\t// Composition\r\n\tvec4 color = vec4(baseColor.rgb, alpha);\r\n\r\n#ifdef FOG\r\n\tfloat fog = CalcFogFactor();\r\n\tcolor.rgb = fog * color.rgb + (1.0 - fog) * vFogColor;\r\n#endif\r\n\r\n\tgl_FragColor = color;\r\n}";
