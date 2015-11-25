/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    var maxSimultaneousLights = 4;

    class LavaMaterialDefines extends MaterialDefines {
        public DIFFUSE = false;
        public CLIPPLANE = false;
        public ALPHATEST = false;
        public POINTSIZE = false;
        public FOG = false;
        public LIGHT0 = false;
        public LIGHT1 = false;
        public LIGHT2 = false;
        public LIGHT3 = false;
        public SPOTLIGHT0 = false;
        public SPOTLIGHT1 = false;
        public SPOTLIGHT2 = false;
        public SPOTLIGHT3 = false;
        public HEMILIGHT0 = false;
        public HEMILIGHT1 = false;
        public HEMILIGHT2 = false;
        public HEMILIGHT3 = false;
        public DIRLIGHT0 = false;
        public DIRLIGHT1 = false;
        public DIRLIGHT2 = false;
        public DIRLIGHT3 = false;
        public POINTLIGHT0 = false;
        public POINTLIGHT1 = false;
        public POINTLIGHT2 = false;
        public POINTLIGHT3 = false;
        public SHADOW0 = false;
        public SHADOW1 = false;
        public SHADOW2 = false;
        public SHADOW3 = false;
        public SHADOWS = false;
        public SHADOWVSM0 = false;
        public SHADOWVSM1 = false;
        public SHADOWVSM2 = false;
        public SHADOWVSM3 = false;
        public SHADOWPCF0 = false;
        public SHADOWPCF1 = false;
        public SHADOWPCF2 = false;
        public SHADOWPCF3 = false;
        public NORMAL = false;
        public UV1 = false;
        public UV2 = false;
        public VERTEXCOLOR = false;
        public VERTEXALPHA = false;
        public NUM_BONE_INFLUENCERS = 0;
        public BonesPerMesh = 0;
        public INSTANCES = false;

        constructor() {
            super();
            this._keys = Object.keys(this);
        }
    }

    export class LavaMaterial extends Material {
        public diffuseTexture: BaseTexture;
        public noiseTexture: BaseTexture;
        public fogColor: Color3;
        public speed : number = 1;
        public movingSpeed : number = 1;
        public lowFrequencySpeed : number = 1;
        public fogDensity : number = 0.15;

        private _lastTime : number = 0;

        public diffuseColor = new Color3(1, 1, 1);
        public disableLighting = false;

        private _worldViewProjectionMatrix = Matrix.Zero();
        private _scaledDiffuse = new Color3();
        private _renderId: number;

        private _defines = new LavaMaterialDefines();
        private _cachedDefines = new LavaMaterialDefines();

        constructor(name: string, scene: Scene) {
            super(name, scene);

            this._cachedDefines.BonesPerMesh = -1;
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

        // Methods   
        private _checkCache(scene: Scene, mesh?: AbstractMesh, useInstances?: boolean): boolean {
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
            var needNormals = false;
            var needUVs = false;

            this._defines.reset();

            // Textures
            if (scene.texturesEnabled) {
                if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    } else {
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
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }

            var lightIndex = 0;
            if (scene.lightsEnabled && !this.disableLighting) {
                for (var index = 0; index < scene.lights.length; index++) {
                    var light = scene.lights[index];

                    if (!light.isEnabled()) {
                        continue;
                    }

                    // Excluded check
                    if (light._excludedMeshesIds.length > 0) {
                        for (var excludedIndex = 0; excludedIndex < light._excludedMeshesIds.length; excludedIndex++) {
                            var excludedMesh = scene.getMeshByID(light._excludedMeshesIds[excludedIndex]);

                            if (excludedMesh) {
                                light.excludedMeshes.push(excludedMesh);
                            }
                        }

                        light._excludedMeshesIds = [];
                    }

                    // Included check
                    if (light._includedOnlyMeshesIds.length > 0) {
                        for (var includedOnlyIndex = 0; includedOnlyIndex < light._includedOnlyMeshesIds.length; includedOnlyIndex++) {
                            var includedOnlyMesh = scene.getMeshByID(light._includedOnlyMeshesIds[includedOnlyIndex]);

                            if (includedOnlyMesh) {
                                light.includedOnlyMeshes.push(includedOnlyMesh);
                            }
                        }

                        light._includedOnlyMeshesIds = [];
                    }

                    if (!light.canAffectMesh(mesh)) {
                        continue;
                    }
                    needNormals = true;
                    this._defines["LIGHT" + lightIndex] = true;

                    var type;
                    if (light instanceof SpotLight) {
                        type = "SPOTLIGHT" + lightIndex;
                    } else if (light instanceof HemisphericLight) {
                        type = "HEMILIGHT" + lightIndex;
                    } else if (light instanceof PointLight) {
                        type = "POINTLIGHT" + lightIndex;
                    } else {
                        type = "DIRLIGHT" + lightIndex;
                    }

                    this._defines[type] = true;

                    // Shadows
                    if (scene.shadowsEnabled) {
                        var shadowGenerator = light.getShadowGenerator();
                        if (mesh && mesh.receiveShadows && shadowGenerator) {
                            this._defines["SHADOW" + lightIndex] = true;

                            this._defines.SHADOWS = true;

                            if (shadowGenerator.useVarianceShadowMap || shadowGenerator.useBlurVarianceShadowMap) {
                                this._defines["SHADOWVSM" + lightIndex] = true;
                            }

                            if (shadowGenerator.usePoissonSampling) {
                                this._defines["SHADOWPCF" + lightIndex] = true;
                            }
                        }
                    }

                    lightIndex++;
                    if (lightIndex === maxSimultaneousLights)
                        break;
                }
            }

            // Attribs
            if (mesh) {
                if (needNormals && mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                }
                if (needUVs) {
                    if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                        this._defines.UV1 = true;
                    }
                    if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                        this._defines.UV2 = true;
                    }
                }
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind)) {
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
                var fallbacks = new EffectFallbacks();
                if (this._defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }

                for (lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
                    if (!this._defines["LIGHT" + lightIndex]) {
                        continue;
                    }

                    if (lightIndex > 0) {
                        fallbacks.addFallback(lightIndex, "LIGHT" + lightIndex);
                    }

                    if (this._defines["SHADOW" + lightIndex]) {
                        fallbacks.addFallback(0, "SHADOW" + lightIndex);
                    }

                    if (this._defines["SHADOWPCF" + lightIndex]) {
                        fallbacks.addFallback(0, "SHADOWPCF" + lightIndex);
                    }

                    if (this._defines["SHADOWVSM" + lightIndex]) {
                        fallbacks.addFallback(0, "SHADOWVSM" + lightIndex);
                    }
                }

                if (this._defines.NUM_BONE_INFLUENCERS > 0){
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }

                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (this._defines.NORMAL) {
                    attribs.push(VertexBuffer.NormalKind);
                }

                if (this._defines.UV1) {
                    attribs.push(VertexBuffer.UVKind);
                }

                if (this._defines.UV2) {
                    attribs.push(VertexBuffer.UV2Kind);
                }

                if (this._defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                if (this._defines.NUM_BONE_INFLUENCERS > 0) {
                    attribs.push(VertexBuffer.MatricesIndicesKind);
                    attribs.push(VertexBuffer.MatricesWeightsKind);
                    if (this._defines.NUM_BONE_INFLUENCERS > 4) {
                        attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                        attribs.push(VertexBuffer.MatricesWeightsExtraKind);
                    }
                }

                if (this._defines.INSTANCES) {
                    attribs.push("world0");
                    attribs.push("world1");
                    attribs.push("world2");
                    attribs.push("world3");
                }

                // Legacy browser patch
                var shaderName = "lava";
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs,
                    ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                        "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                        "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                        "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                        "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                        "vFogInfos", "vFogColor", "pointSize",
                        "vDiffuseInfos",
                        "mBones",
                        "vClipPlane", "diffuseMatrix",
                        "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3","time", "speed","movingSpeed",
                        "fogColor","fogDensity", "lowFrequencySpeed"
                    ],
                    ["diffuseSampler",
                        "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3", "noiseTexture"
                    ],
                    join, fallbacks, this.onCompiled, this.onError);
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
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
            this._effect.setMatrix("world", world);
        }

        public bind(world: Matrix, mesh?: Mesh): void {
            var scene = this.getScene();

            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());

            // Bones
            if (mesh && mesh.useBones && mesh.computeBonesUsingShaders) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
            }

            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    this._effect.setTexture("diffuseSampler", this.diffuseTexture);

                    this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                    this._effect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
                }

                if (this.noiseTexture) {
                    this._effect.setTexture("noiseTexture", this.noiseTexture);
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

            if (scene.lightsEnabled && !this.disableLighting) {
                var lightIndex = 0;
                for (var index = 0; index < scene.lights.length; index++) {
                    var light = scene.lights[index];

                    if (!light.isEnabled()) {
                        continue;
                    }

                    if (!light.canAffectMesh(mesh)) {
                        continue;
                    }

                    if (light instanceof PointLight) {
                        // Point Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex);
                    } else if (light instanceof DirectionalLight) {
                        // Directional Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex);
                    } else if (light instanceof SpotLight) {
                        // Spot Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex, "vLightDirection" + lightIndex);
                    } else if (light instanceof HemisphericLight) {
                        // Hemispheric Light
                        light.transferToEffect(this._effect, "vLightData" + lightIndex, "vLightGround" + lightIndex);
                    }

                    light.diffuse.scaleToRef(light.intensity, this._scaledDiffuse);
                    this._effect.setColor4("vLightDiffuse" + lightIndex, this._scaledDiffuse, light.range);

                    // Shadows
                    if (scene.shadowsEnabled) {
                        var shadowGenerator = light.getShadowGenerator();
                        if (mesh.receiveShadows && shadowGenerator) {
                            this._effect.setMatrix("lightMatrix" + lightIndex, shadowGenerator.getTransformMatrix());
                            this._effect.setTexture("shadowSampler" + lightIndex, shadowGenerator.getShadowMapForRendering());
                            this._effect.setFloat3("shadowsInfo" + lightIndex, shadowGenerator.getDarkness(), shadowGenerator.getShadowMap().getSize().width, shadowGenerator.bias);
                        }
                    }

                    lightIndex++;

                    if (lightIndex === maxSimultaneousLights)
                        break;
                }
            }

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }

            // Fog
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
                this._effect.setColor3("vFogColor", scene.fogColor);
            }


            this._lastTime += scene.getEngine().getDeltaTime();
            this._effect.setFloat("time", this._lastTime * this.speed / 1000);

            if (! this.fogColor) {
                this.fogColor = Color3.Black();
            }
            this._effect.setColor3("fogColor", this.fogColor);
            this._effect.setFloat("fogDensity", this.fogDensity);

            this._effect.setFloat("lowFrequencySpeed", this.lowFrequencySpeed);
            this._effect.setFloat("movingSpeed", this.movingSpeed);


            super.bind(world, mesh);
        }

        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }

            if (this.noiseTexture && this.noiseTexture.animations && this.noiseTexture.animations.length > 0) {
                results.push(this.noiseTexture);
            }

            return results;
        }

        public dispose(forceDisposeEffect?: boolean): void {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }
            if (this.noiseTexture) {
                this.noiseTexture.dispose();
            }

            super.dispose(forceDisposeEffect);
        }

        public clone(name: string): LavaMaterial {
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
        }


        public serialize(): any {
            var serializationObject = super.serialize();
            serializationObject.customType = "lava";
            serializationObject.diffuseColor    = this.diffuseColor.asArray();
            serializationObject.fogColor        = this.fogColor.asArray();
            serializationObject.speed           = this.speed;
            serializationObject.movingSpeed     = this.movingSpeed;
            serializationObject.lowFrequencySpeed = this.lowFrequencySpeed;
            serializationObject.fogDensity      = this.fogDensity;
            serializationObject.checkReadyOnlyOnce = this.checkReadyOnlyOnce;

            if (this.diffuseTexture) {
                serializationObject.diffuseTexture = this.diffuseTexture.serialize();
            }
            if (this.noiseTexture) {
                serializationObject.noiseTexture = this.noiseTexture.serialize();
            }

            return serializationObject;
        }

        public static Parse(source: any, scene: Scene, rootUrl: string): LavaMaterial {
            var material = new LavaMaterial(source.name, scene);

            material.diffuseColor   = Color3.FromArray(source.diffuseColor);
            material.speed          = source.speed;
            material.fogColor       = Color3.FromArray(source.fogColor);
            material.movingSpeed    = source.movingSpeed;
            material.lowFrequencySpeed = source.lowFrequencySpeed;
            material.fogDensity     =  source.lowFrequencySpeed;

            material.alpha          = source.alpha;

            material.id             = source.id;

            Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;

            if (source.diffuseTexture) {
                material.diffuseTexture = Texture.Parse(source.diffuseTexture, scene, rootUrl);
            }

            if (source.noiseTexture) {
                material.noiseTexture = Texture.Parse(source.noiseTexture, scene, rootUrl);
            }

            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }

            return material;
        }
    }
} 
