/// <reference path="../../../dist/preview release/babylon.d.ts"/>
/// <reference path="../simple/babylon.simpleMaterial.ts"/>

module BABYLON {
    class WaterMaterialDefines extends MaterialDefines {
        public BUMP = false;
        public REFLECTION = false;
        public CLIPPLANE = false;
        public ALPHATEST = false;
        public POINTSIZE = false;
        public FOG = false;
        public NORMAL = false;
        public UV1 = false;
        public UV2 = false;
        public VERTEXCOLOR = false;
        public VERTEXALPHA = false;
        public NUM_BONE_INFLUENCERS = 0;
        public BonesPerMesh = 0;
        public INSTANCES = false;
        public SPECULARTERM = false;
        public LOGARITHMICDEPTH = false;
        public FRESNELSEPARATE = false;
        public BUMPSUPERIMPOSE = false;
        public BUMPAFFECTSREFLECTION = false;


        constructor() {
            super();
            this.rebuild();
        }
    }
	
	export class WaterMaterial extends Material {
		/*
		* Public members
		*/
        @serializeAsTexture()
        public bumpTexture: BaseTexture;
        
        @serializeAsColor3()
        public diffuseColor = new Color3(1, 1, 1);
        
        @serializeAsColor3()
        public specularColor = new Color3(0, 0, 0);
        
        @serialize()
        public specularPower = 64;
        
        @serialize()
        public disableLighting = false;
        
        @serialize()
        public maxSimultaneousLights = 4;
        
        /**
        * @param {number}: Represents the wind force
        */
        @serialize()
		public windForce: number = 6;
        /**
        * @param {Vector2}: The direction of the wind in the plane (X, Z)
        */
        @serializeAsVector2()
		public windDirection: Vector2 = new Vector2(0, 1);
        /**
        * @param {number}: Wave height, represents the height of the waves
        */
        @serialize()
		public waveHeight: number = 0.4;
        /**
        * @param {number}: Bump height, represents the bump height related to the bump map
        */
        @serialize()
		public bumpHeight: number = 0.4;
        /**
         * @param {boolean}: Add a smaller moving bump to less steady waves.
         */
        @serialize()
        public bumpSuperimpose = false;
        /**
         * @param {boolean}: Color refraction and reflection differently with .waterColor2 and .colorBlendFactor2. Non-linear (physically correct) fresnel.
         */
        @serialize()
        public fresnelSeparate = false;
        /**
         * @param {boolean}: bump Waves modify the reflection.
         */
        @serialize()
        public bumpAffectsReflection = false;

        /**
        * @param {number}: The water color blended with the refraction (near)
        */
        @serializeAsColor3()
		public waterColor: Color3 = new Color3(0.1, 0.1, 0.6);
        /**
        * @param {number}: The blend factor related to the water color (refraction, near)
        */
        @serialize()
		public colorBlendFactor: number = 0.2;
        /**
         * @param {number}: The water color blended with the reflection (far)
         */
        @serializeAsColor3()
        public waterColor2: Color3 = new Color3(0.1, 0.1, 0.6);
        /**
         * @param {number}: The blend factor related to the water color (reflection, far)
         */
        @serialize()
        public colorBlendFactor2: number = 0.2;
        /**
        * @param {number}: Represents the maximum length of a wave
        */
        @serialize()
		public waveLength: number = 0.1;
        
        /**
        * @param {number}: Defines the waves speed
        */
        @serialize()
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
        
        private _renderId: number;

        private _defines = new WaterMaterialDefines();
        private _cachedDefines = new WaterMaterialDefines();

        private _useLogarithmicDepth: boolean;

        /**
		* Constructor
		*/
		constructor(name: string, scene: Scene, public renderTargetSize: Vector2 = new Vector2(512, 512)) {
            super(name, scene);
			
			// Create render targets
			this._createRenderTargets(scene, renderTargetSize);
        }

        @serialize()
        public get useLogarithmicDepth(): boolean {
            return this._useLogarithmicDepth;
        }

        public set useLogarithmicDepth(value: boolean) {
            this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
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
        
        public getRenderList(): AbstractMesh[] {
            return this._refractionRTT.renderList;
        }
        
        public get renderTargetsEnabled(): boolean {
            return !(this._refractionRTT.refreshRate === 0);
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

            if (this.useLogarithmicDepth) {
                this._defines.LOGARITHMICDEPTH = true;
            }

            if (this.fresnelSeparate) {
                this._defines.FRESNELSEPARATE = true;
            }

            if (this.bumpSuperimpose) {
                this._defines.BUMPSUPERIMPOSE = true;
            }

            if (this.bumpAffectsReflection) {
                this._defines.BUMPAFFECTSREFLECTION = true;
            }

            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }
            
            // Lights
            if (scene.lightsEnabled && !this.disableLighting) {
                needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, this.maxSimultaneousLights);
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

                if (this._defines.LOGARITHMICDEPTH) {
                    fallbacks.addFallback(0, "LOGARITHMICDEPTH");
                }

                MaterialHelper.HandleFallbacksForShadows(this._defines, fallbacks, this.maxSimultaneousLights);
             
                if (this._defines.NUM_BONE_INFLUENCERS > 0) {
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

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, this._defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, this._defines);

                // Legacy browser patch
                var shaderName = "water";
                var join = this._defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vNormalInfos", 
                    "mBones",
                    "vClipPlane", "normalMatrix",
                    "logarithmicDepthConstant",

                    // Water
                    "worldReflectionViewProjection", "windDirection", "waveLength", "time", "windForce",
                    "cameraPosition", "bumpHeight", "waveHeight", "waterColor", "waterColor2", "colorBlendFactor", "colorBlendFactor2", "waveSpeed"
                ]
                var samplers = ["normalSampler",
                    // Water
                    "refractionSampler", "reflectionSampler"
                ];
                
                MaterialHelper.PrepareUniformsAndSamplersList(uniforms, samplers, this._defines, this.maxSimultaneousLights);
                
                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs, uniforms, samplers,
                    join, fallbacks, this.onCompiled, this.onError, { maxSimultaneousLights: this.maxSimultaneousLights });
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
            MaterialHelper.BindBonesParameters(mesh, this._effect);

            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.bumpTexture && StandardMaterial.BumpTextureEnabled) {
                    this._effect.setTexture("normalSampler", this.bumpTexture);

                    this._effect.setFloat2("vNormalInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
                    this._effect.setMatrix("normalMatrix", this.bumpTexture.getTextureMatrix());
                }
                // Clip plane
                MaterialHelper.BindClipPlane(this._effect, scene);

                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }

                this._effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);                
            }

            this._effect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
            
            if (this._defines.SPECULARTERM) {
                this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
            }

            if (scene.lightsEnabled && !this.disableLighting) {
                MaterialHelper.BindLights(scene, mesh, this._effect, this._defines, this.maxSimultaneousLights);
            }

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._effect);

            // Log. depth
            MaterialHelper.BindLogDepth(this._defines, this._effect, scene);

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
            this._effect.setColor4("waterColor2", this.waterColor2, 1.0);
            this._effect.setFloat("colorBlendFactor2", this.colorBlendFactor2);
            this._effect.setFloat("waveSpeed", this.waveSpeed);

            super.bind(world, mesh);
		}
		
		private _createRenderTargets(scene: Scene, renderTargetSize: Vector2): void {
			// Render targets
			this._refractionRTT = new RenderTargetTexture(name + "_refraction", {width: renderTargetSize.x, height: renderTargetSize.y}, scene, false, true);
            this._refractionRTT.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
            this._refractionRTT.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;

			this._reflectionRTT = new RenderTargetTexture(name + "_reflection", {width: renderTargetSize.x, height: renderTargetSize.y}, scene, false, true);
            this._reflectionRTT.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
            this._reflectionRTT.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;

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

            var index = this.getScene().customRenderTargets.indexOf(this._refractionRTT);
            if (index != -1){
                this.getScene().customRenderTargets.splice(index, 1);
            }
            index = -1;
            index = this.getScene().customRenderTargets.indexOf(this._reflectionRTT);
            if (index != -1){
                this.getScene().customRenderTargets.splice(index, 1);
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
            return SerializationHelper.Clone(() => new WaterMaterial(name, this.getScene()), this);
        }

        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.WaterMaterial";
            serializationObject.reflectionTexture.isRenderTarget = true;
            serializationObject.refractionTexture.isRenderTarget = true;
            return serializationObject;
        }

        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): WaterMaterial {
            return SerializationHelper.Parse(() => new WaterMaterial(source.name, scene), source, scene, rootUrl);
        }
		
		public static CreateDefaultMesh(name: string, scene: Scene): Mesh {
			var mesh = Mesh.CreateGround(name, 512, 512, 32, scene, false);
			return mesh;
		}
	}
}