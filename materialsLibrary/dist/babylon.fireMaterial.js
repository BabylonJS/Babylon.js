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

BABYLON.Effect.ShadersStore['fireVertexShader'] = "precision highp float;\n\n// Attributes\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#ifdef BONES\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#endif\n\n// Uniforms\n\n#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif\n\nuniform mat4 view;\nuniform mat4 viewProjection;\n\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\n#endif\n\n#ifdef BONES\nuniform mat4 mBones[BonesPerMesh];\n#endif\n\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\n// Output\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif\n\n#ifdef FOG\nvarying float fFogDistance;\n#endif\n\n// Fire\nuniform float time;\nuniform float speed;\n\nvarying vec2 vDistortionCoords1;\nvarying vec2 vDistortionCoords2;\nvarying vec2 vDistortionCoords3;\n\nvoid main(void) {\n\tmat4 finalWorld;\n\n#ifdef INSTANCES\n\tfinalWorld = mat4(world0, world1, world2, world3);\n#else\n\tfinalWorld = world;\n#endif\n\n#ifdef BONES\n\tmat4 m0 = mBones[int(matricesIndices.x)] * matricesWeights.x;\n\tmat4 m1 = mBones[int(matricesIndices.y)] * matricesWeights.y;\n\tmat4 m2 = mBones[int(matricesIndices.z)] * matricesWeights.z;\n\n#ifdef BONES4\n\tmat4 m3 = mBones[int(matricesIndices.w)] * matricesWeights.w;\n\tfinalWorld = finalWorld * (m0 + m1 + m2 + m3);\n#else\n\tfinalWorld = finalWorld * (m0 + m1 + m2);\n#endif \n\n#endif\n\tgl_Position = viewProjection * finalWorld * vec4(position, 1.0);\n\n\tvec4 worldPos = finalWorld * vec4(position, 1.0);\n\tvPositionW = vec3(worldPos);\n\n#ifdef NORMAL\n\tvNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));\n#endif\n\n\t// Texture coordinates\n#ifdef DIFFUSE\n\tvDiffuseUV = uv;\n\tvDiffuseUV.y -= 0.2;\n#endif\n\n\t// Clip plane\n#ifdef CLIPPLANE\n\tfClipDistance = dot(worldPos, vClipPlane);\n#endif\n\n\t// Fog\n#ifdef FOG\n\tfFogDistance = (view * worldPos).z;\n#endif\n\n\t// Vertex color\n#ifdef VERTEXCOLOR\n\tvColor = color;\n#endif\n\n\t// Point size\n#ifdef POINTSIZE\n\tgl_PointSize = pointSize;\n#endif\n\n\t// Fire\n\tvec3 layerSpeed = vec3(-0.2, -0.52, -0.1) * speed;\n\t\n\tvDistortionCoords1.x = uv.x;\n\tvDistortionCoords1.y = uv.y + layerSpeed.x * time / 1000.0;\n\t\n\tvDistortionCoords2.x = uv.x;\n\tvDistortionCoords2.y = uv.y + layerSpeed.y * time / 1000.0;\n\t\n\tvDistortionCoords3.x = uv.x;\n\tvDistortionCoords3.y = uv.y + layerSpeed.z * time / 1000.0;\n}\n";
BABYLON.Effect.ShadersStore['firePixelShader'] = "precision highp float;\n\n// Constants\nuniform vec3 vEyePosition;\n\n// Input\nvarying vec3 vPositionW;\n\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n// Samplers\n#ifdef DIFFUSE\nvarying vec2 vDiffuseUV;\nuniform sampler2D diffuseSampler;\nuniform vec2 vDiffuseInfos;\n#endif\n\n// Fire\nuniform sampler2D distortionSampler;\nuniform sampler2D opacitySampler;\n\nvarying vec2 vDistortionCoords1;\nvarying vec2 vDistortionCoords2;\nvarying vec2 vDistortionCoords3;\n\n#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif\n\n// Fog\n#ifdef FOG\n\n#define FOGMODE_NONE    0.\n#define FOGMODE_EXP     1.\n#define FOGMODE_EXP2    2.\n#define FOGMODE_LINEAR  3.\n#define E 2.71828\n\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying float fFogDistance;\n\nfloat CalcFogFactor()\n{\n\tfloat fogCoeff = 1.0;\n\tfloat fogStart = vFogInfos.y;\n\tfloat fogEnd = vFogInfos.z;\n\tfloat fogDensity = vFogInfos.w;\n\n\tif (FOGMODE_LINEAR == vFogInfos.x)\n\t{\n\t\tfogCoeff = (fogEnd - fFogDistance) / (fogEnd - fogStart);\n\t}\n\telse if (FOGMODE_EXP == vFogInfos.x)\n\t{\n\t\tfogCoeff = 1.0 / pow(E, fFogDistance * fogDensity);\n\t}\n\telse if (FOGMODE_EXP2 == vFogInfos.x)\n\t{\n\t\tfogCoeff = 1.0 / pow(E, fFogDistance * fFogDistance * fogDensity * fogDensity);\n\t}\n\n\treturn clamp(fogCoeff, 0.0, 1.0);\n}\n#endif\n\nvec4 bx2(vec4 x)\n{\n   return vec4(2.0) * x - vec4(1.0);\n}\n\nvoid main(void) {\n\t// Clip plane\n#ifdef CLIPPLANE\n\tif (fClipDistance > 0.0)\n\t\tdiscard;\n#endif\n\n\tvec3 viewDirectionW = normalize(vEyePosition - vPositionW);\n\n\t// Base color\n\tvec4 baseColor = vec4(1., 1., 1., 1.);\n\n\t// Alpha\n\tfloat alpha = 1.0;\n\n#ifdef DIFFUSE\n\t// Fire\n\tconst float distortionAmount0  = 0.092;\n\tconst float distortionAmount1  = 0.092;\n\tconst float distortionAmount2  = 0.092;\n\t\n\tvec2 heightAttenuation = vec2(0.3, 0.39);\n\t\n\tvec4 noise0 = texture2D(distortionSampler, vDistortionCoords1);\n\tvec4 noise1 = texture2D(distortionSampler, vDistortionCoords2);\n\tvec4 noise2 = texture2D(distortionSampler, vDistortionCoords3);\n\t\n\tvec4 noiseSum = bx2(noise0) * distortionAmount0 + bx2(noise1) * distortionAmount1 + bx2(noise2) * distortionAmount2;\n\t\n\tvec4 perturbedBaseCoords = vec4(vDiffuseUV, 0.0, 1.0) + noiseSum * (vDiffuseUV.y * heightAttenuation.x + heightAttenuation.y);\n\t\n\tvec4 opacityColor = texture2D(opacitySampler, perturbedBaseCoords.xy);\n\t\n#ifdef ALPHATEST\n\tif (opacityColor.r < 0.1)\n\t\tdiscard;\n#endif\n\t\n\tbaseColor = texture2D(diffuseSampler, perturbedBaseCoords.xy) * 2.0;\n\tbaseColor *= opacityColor;\n\n\tbaseColor.rgb *= vDiffuseInfos.y;\n#endif\n\n#ifdef VERTEXCOLOR\n\tbaseColor.rgb *= vColor.rgb;\n#endif\n\n\t// Bump\n#ifdef NORMAL\n\tvec3 normalW = normalize(vNormalW);\n#else\n\tvec3 normalW = vec3(1.0, 1.0, 1.0);\n#endif\n\n\t// Lighting\n\tvec3 diffuseBase = vec3(1.0, 1.0, 1.0);\n\n#ifdef VERTEXALPHA\n\talpha *= vColor.a;\n#endif\n\n\t// Composition\n\tvec4 color = vec4(baseColor.rgb, alpha);\n\n#ifdef FOG\n\tfloat fog = CalcFogFactor();\n\tcolor.rgb = fog * color.rgb + (1.0 - fog) * vFogColor;\n#endif\n\n\tgl_FragColor = color;\n}";
