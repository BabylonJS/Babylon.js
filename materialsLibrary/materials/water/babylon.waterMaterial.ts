/// <reference path="../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../simple/babylon.simpleMaterial.ts"/>

module BABYLON {
	var maxSimultaneousLights = 4;

    class WaterMaterialDefines extends MaterialDefines {
        public BUMP = false;
        public REFLECTION = false;
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
        public BONES = false;
        public BONES4 = false;
        public BonesPerMesh = 0;
        public INSTANCES = false;
        public SPECULARTERM = false;

        constructor() {
            super();
            this._keys = Object.keys(this);
        }
    }
	
	export class WaterMaterial extends Material {
		/*
		* Public members
		*/
        public bumpTexture: BaseTexture;
        public diffuseColor = new Color3(1, 1, 1);
        public specularColor = new Color3(0, 0, 0);
        public specularPower = 64;
        public disableLighting = false;
        
        /**
        * @param {number}: Represents the wind force
        */
		public windForce: number = 6;
        /**
        * @param {Vector2}: The direction of the wind in the plane (X, Z)
        */
		public windDirection: Vector2 = new Vector2(0, 1);
        /**
        * @param {number}: Wave height, represents the height of the waves
        */
		public waveHeight: number = 0.4;
        /**
        * @param {number}: Bump height, represents the bump height related to the bump map
        */
		public bumpHeight: number = 0.4;
        /**
        * @param {number}: The water color blended with the reflection and refraction samplers
        */
		public waterColor: Color3 = new Color3(0.1, 0.1, 0.6);
        /**
        * @param {number}: The blend factor related to the water color
        */
		public colorBlendFactor: number = 0.2;
        /**
        * @param {number}: Represents the maximum length of a wave
        */
		public waveLength: number = 0.1;
        
        /**
        * @param {number}: Defines the waves speed
        */
        public waveSpeed: number = 1.0;
		
		/*
		* Private members
		*/
		private _mesh: AbstractMesh = null;
		
		private _refractionRTT: RenderTargetTexture;
		private _reflectionRTT: RenderTargetTexture;
		
		private _material: ShaderMaterial;
		
		private _reflectionTransform: Matrix = Matrix.Zero();
		private _lastTime: number = 0;
        
        private _scaledDiffuse = new Color3();
        private _scaledSpecular = new Color3();
        private _renderId: number;

        private _defines = new WaterMaterialDefines();
        private _cachedDefines = new WaterMaterialDefines();
		
		/**
		* Constructor
		*/
		constructor(name: string, scene: Scene, public renderTargetSize: Vector2 = new Vector2(512, 512)) {
            super(name, scene);
			
			// Create render targets
			this._createRenderTargets(scene, renderTargetSize);
        }
		
        // Get / Set
        public get refractionTexture(): RenderTargetTexture {
            return this._refractionRTT;
        }
        
        public get reflectionTexture(): RenderTargetTexture {
            return this._reflectionRTT;
        }
		
        // Methods
        public addToRenderList(node: any): void {
            this._refractionRTT.renderList.push(node);
            this._reflectionRTT.renderList.push(node);
        }
        
        public enableRenderTargets(enable: boolean): void {
            var refreshRate = enable ? 1 : 0;
            
            this._refractionRTT.refreshRate = refreshRate;
            this._reflectionRTT.refreshRate = refreshRate;
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
                if (this.bumpTexture && StandardMaterial.BumpTextureEnabled) {
                    if (!this.bumpTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.BUMP = true;
                    }
                }
                
                if (StandardMaterial.ReflectionTextureEnabled) {
                    this._defines.REFLECTION = true;
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
                    
                    // Specular
                    if (!light.specular.equalsFloats(0, 0, 0)) {
                        this._defines.SPECULARTERM = true;
                    }

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
                    this._defines.BONES = true;
                    this._defines.BonesPerMesh = (mesh.skeleton.bones.length + 1);
                    this._defines.BONES4 = true;
                }

                // Instances
                if (useInstances) {
                    this._defines.INSTANCES = true;
                }
            }
            
            this._mesh = mesh;

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
             
                if (this._defines.BONES4) {
                    fallbacks.addFallback(0, "BONES4");
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

                if (this._defines.BONES) {
                    attribs.push(VertexBuffer.MatricesIndicesKind);
                    attribs.push(VertexBuffer.MatricesWeightsKind);
                }

                if (this._defines.INSTANCES) {
                    attribs.push("world0");
                    attribs.push("world1");
                    attribs.push("world2");
                    attribs.push("world3");
                }

                // Legacy browser patch
                var shaderName = "water";
                var join = this._defines.toString();
				
                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs,
                    ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                        "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                        "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                        "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                        "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                        "vFogInfos", "vFogColor", "pointSize",
                        "vNormalInfos", 
                        "mBones",
                        "vClipPlane", "normalMatrix",
                        "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3",
						// Water
						"worldReflectionViewProjection", "windDirection", "waveLength", "time", "windForce",
						"cameraPosition", "bumpHeight", "waveHeight", "waterColor", "colorBlendFactor", "waveSpeed"
                    ],
                    ["normalSampler",
                        "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3",
						// Water
						"refractionSampler", "reflectionSampler"
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
                    mesh._materialDefines = new WaterMaterialDefines();
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
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
            }

            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.bumpTexture && StandardMaterial.BumpTextureEnabled) {
                    this._effect.setTexture("normalSampler", this.bumpTexture);

                    this._effect.setFloat2("vNormalInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
                    this._effect.setMatrix("normalMatrix", this.bumpTexture.getTextureMatrix());
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
            
            if (this._defines.SPECULARTERM) {
                this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
            }

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
                    
                    if (this._defines.SPECULARTERM) {
                        light.specular.scaleToRef(light.intensity, this._scaledSpecular);
                        this._effect.setColor3("vLightSpecular" + lightIndex, this._scaledSpecular);
                    }

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
            
            // Water
            if (StandardMaterial.ReflectionTextureEnabled) {
                this._effect.setTexture("refractionSampler", this._refractionRTT);
                this._effect.setTexture("reflectionSampler", this._reflectionRTT);
            }
            
			var wrvp = this._mesh.getWorldMatrix().multiply(this._reflectionTransform).multiply(scene.getProjectionMatrix());
			this._lastTime += scene.getEngine().getDeltaTime();
			
			this._effect.setMatrix("worldReflectionViewProjection", wrvp);
			this._effect.setVector2("windDirection", this.windDirection);
			this._effect.setFloat("waveLength", this.waveLength);
			this._effect.setFloat("time", this._lastTime / 100000);
			this._effect.setFloat("windForce", this.windForce);
			this._effect.setFloat("waveHeight", this.waveHeight);
            this._effect.setFloat("bumpHeight", this.bumpHeight);
			this._effect.setColor4("waterColor", this.waterColor, 1.0);
			this._effect.setFloat("colorBlendFactor", this.colorBlendFactor);
            this._effect.setFloat("waveSpeed", this.waveSpeed);

            super.bind(world, mesh);
		}
		
		private _createRenderTargets(scene: Scene, renderTargetSize: Vector2): void {
			// Render targets
			this._refractionRTT = new RenderTargetTexture(name + "_refraction", {width: renderTargetSize.x, height: renderTargetSize.y}, scene, false, true);
			this._reflectionRTT = new RenderTargetTexture(name + "_reflection", {width: renderTargetSize.x, height: renderTargetSize.y}, scene, false, true);
			
			scene.customRenderTargets.push(this._refractionRTT);
			scene.customRenderTargets.push(this._reflectionRTT);
			
			var isVisible: boolean;
			var clipPlane = null;
			var savedViewMatrix;
			var mirrorMatrix = Matrix.Zero();
            
			this._refractionRTT.onBeforeRender = () => {
                if (this._mesh) {
                    isVisible = this._mesh.isVisible;
                    this._mesh.isVisible = false;
                }
				// Clip plane
				clipPlane = scene.clipPlane;
                
                var positiony = this._mesh ? this._mesh.position.y : 0.0;
				scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, positiony + 0.05, 0), new Vector3(0, 1, 0));
			};
			
			this._refractionRTT.onAfterRender = () => {
                if (this._mesh) {
				    this._mesh.isVisible = isVisible;
                }
                
				// Clip plane
				scene.clipPlane = clipPlane;
			};
			
			this._reflectionRTT.onBeforeRender = () => {
                if (this._mesh) {
                    isVisible = this._mesh.isVisible;
                    this._mesh.isVisible = false;
                }
                
				// Clip plane
				clipPlane = scene.clipPlane;
                
                var positiony = this._mesh ? this._mesh.position.y : 0.0;
				scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, positiony - 0.05, 0), new Vector3(0, -1, 0));
				
				// Transform
				Matrix.ReflectionToRef(scene.clipPlane, mirrorMatrix);
				savedViewMatrix = scene.getViewMatrix();
				
				mirrorMatrix.multiplyToRef(savedViewMatrix, this._reflectionTransform);
				scene.setTransformMatrix(this._reflectionTransform, scene.getProjectionMatrix());
				scene.getEngine().cullBackFaces = false;
                scene._mirroredCameraPosition = Vector3.TransformCoordinates(scene.activeCamera.position, mirrorMatrix);
			};
			
			this._reflectionRTT.onAfterRender = () => {
                if (this._mesh) {
				    this._mesh.isVisible = isVisible;
                }
                
				// Clip plane
				scene.clipPlane = clipPlane;
				
				// Transform
				scene.setTransformMatrix(savedViewMatrix, scene.getProjectionMatrix());
                scene.getEngine().cullBackFaces = true;
                scene._mirroredCameraPosition = null;
			};
		}
        
        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
                results.push(this.bumpTexture);
            }
            if (this._reflectionRTT && this._reflectionRTT.animations && this._reflectionRTT.animations.length > 0) {
                results.push(this._reflectionRTT);
            }
            if (this._refractionRTT && this._refractionRTT.animations && this._refractionRTT.animations.length > 0) {
                results.push(this._refractionRTT);
            }

            return results;
        }

        public dispose(forceDisposeEffect?: boolean): void {
            if (this.bumpTexture) {
                this.bumpTexture.dispose();
            }
            if (this._reflectionRTT) {
                this._reflectionRTT.dispose();
            }
            if (this._refractionRTT) {
                this._refractionRTT.dispose();
            }

            super.dispose(forceDisposeEffect);
        }

        public clone(name: string): WaterMaterial {
            var newMaterial = new WaterMaterial(name, this.getScene());

            // Base material
            this.copyTo(newMaterial);

            // water material
            if (this.bumpTexture && this.bumpTexture.clone) {
                newMaterial.bumpTexture = this.bumpTexture.clone();
            }

            newMaterial.diffuseColor = this.diffuseColor.clone();
            return newMaterial;
        }
        
		public serialize(): any {
		        		
            var serializationObject = super.serialize();
			
             serializationObject.customType         = "BABYLON.WaterMaterial";
            serializationObject.diffuseColor    	= this.diffuseColor.asArray();
			serializationObject.specularColor   	= this.specularColor.asArray();
            serializationObject.specularPower   	= this.specularPower;
            serializationObject.disableLighting 	= this.disableLighting;
            serializationObject.windForce     		= this.windForce;
            serializationObject.windDirection 		= this.windDirection.asArray();
            serializationObject.waveHeight      	= this.waveHeight;
            serializationObject.bumpHeight 			= this.bumpHeight;
			serializationObject.waterColor 			= this.waterColor.asArray();
			serializationObject.colorBlendFactor	= this.colorBlendFactor;
			serializationObject.waveLength 			= this.waveLength;
			serializationObject.renderTargetSize	= this.renderTargetSize.asArray();
			
            if (this.bumpTexture) {
                serializationObject.bumpTexture 	= this.bumpTexture.serialize();
            }

            return serializationObject;
        }

        public static Parse(source: any, scene: Scene, rootUrl: string): WaterMaterial {
		
			var renderTargetSize = source.renderTargetSize ? Vector2.FromArray(source.renderTargetSize) : null;
		
            var material = new WaterMaterial(source.name, scene, renderTargetSize);

            material.diffuseColor    	= Color3.FromArray(source.diffuseColor);
			material.specularColor   	= Color3.FromArray(source.specularColor);
            material.specularPower   	= source.specularPower;
            material.disableLighting 	= source.disableLighting;
            material.windForce     		= source.windForce;
            material.windDirection 		= Vector2.FromArray(source.windDirection);
            material.waveHeight      	= source.waveHeight;
            material.bumpHeight 		= source.bumpHeight;
			material.waterColor 		= Color3.FromArray(source.waterColor);
			material.colorBlendFactor	= source.colorBlendFactor;
			material.waveLength 		= source.waveLength;
			material.renderTargetSize	= Vector2.FromArray(source.renderTargetSize);

            material.alpha          = source.alpha;

            material.id             = source.id;

            Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;

            if (source.bumpTexture) {
                material.bumpTexture = Texture.Parse(source.bumpTexture, scene, rootUrl);
            }

            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }

            return material;
        }
		
		public static CreateDefaultMesh(name: string, scene: Scene): Mesh {
			var mesh = Mesh.CreateGround(name, 512, 512, 32, scene, false);
			return mesh;
		}
	}
}