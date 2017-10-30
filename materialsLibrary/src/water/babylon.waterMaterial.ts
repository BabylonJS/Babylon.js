/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    class WaterMaterialDefines extends MaterialDefines {
        public BUMP = false;
        public REFLECTION = false;
        public CLIPPLANE = false;
        public ALPHATEST = false;
        public DEPTHPREPASS = false;
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

    export class WaterMaterial extends PushMaterial {
		/*
		* Public members
		*/
        @serializeAsTexture("bumpTexture")
        private _bumpTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public bumpTexture: BaseTexture;

        @serializeAsColor3()
        public diffuseColor = new Color3(1, 1, 1);

        @serializeAsColor3()
        public specularColor = new Color3(0, 0, 0);

        @serialize()
        public specularPower = 64;

        @serialize("disableLighting")
        private _disableLighting = false;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public disableLighting: boolean;

        @serialize("maxSimultaneousLights")
        private _maxSimultaneousLights = 4;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public maxSimultaneousLights: number;

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
        @serialize("bumpSuperimpose")
        private _bumpSuperimpose = false;
        @expandToProperty("_markAllSubMeshesAsMiscDirty")
        public bumpSuperimpose: boolean;

        /**
         * @param {boolean}: Color refraction and reflection differently with .waterColor2 and .colorBlendFactor2. Non-linear (physically correct) fresnel.
         */
        @serialize("fresnelSeparate")
        private _fresnelSeparate = false;
        @expandToProperty("_markAllSubMeshesAsMiscDirty")
        public fresnelSeparate: boolean;

        /**
         * @param {boolean}: bump Waves modify the reflection.
         */
        @serialize("bumpAffectsReflection")
        private _bumpAffectsReflection = false;
        @expandToProperty("_markAllSubMeshesAsMiscDirty")
        public bumpAffectsReflection: boolean;

        /**
        * @param {number}: The water color blended with the refraction (near)
        */
        @serializeAsColor3()
        public waterColor: Color3 = new Color3(0.1, 0.1, 0.6);
        /**
        * @param {number}: The blend factor related to the water color
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

        protected _renderTargets = new SmartArray<RenderTargetTexture>(16);

		/*
		* Private members
		*/
        private _mesh: Nullable<AbstractMesh> = null;

        private _refractionRTT: RenderTargetTexture;
        private _reflectionRTT: RenderTargetTexture;

        private _reflectionTransform: Matrix = Matrix.Zero();
        private _lastTime: number = 0;
        private _lastDeltaTime: number = 0;

        private _renderId: number;

        private _useLogarithmicDepth: boolean;

        /**
		* Constructor
		*/
        constructor(name: string, scene: Scene, public renderTargetSize: Vector2 = new Vector2(512, 512)) {
            super(name, scene);

            this._createRenderTargets(scene, renderTargetSize);

            // Create render targets
            this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
                this._renderTargets.reset();
                this._renderTargets.push(this._reflectionRTT);
                this._renderTargets.push(this._refractionRTT);

                return this._renderTargets;
            }

        }

        @serialize()
        public get useLogarithmicDepth(): boolean {
            return this._useLogarithmicDepth;
        }

        public set useLogarithmicDepth(value: boolean) {
            this._useLogarithmicDepth = value && this.getScene().getEngine().getCaps().fragmentDepthSupported;
            this._markAllSubMeshesAsMiscDirty();
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
            if (this._refractionRTT.renderList) {
                this._refractionRTT.renderList.push(node);
            }

            if (this._reflectionRTT.renderList) {
                this._reflectionRTT.renderList.push(node);
            }
        }

        public enableRenderTargets(enable: boolean): void {
            var refreshRate = enable ? 1 : 0;

            this._refractionRTT.refreshRate = refreshRate;
            this._reflectionRTT.refreshRate = refreshRate;
        }

        public getRenderList(): Nullable<AbstractMesh[]> {
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

        public getAlphaTestTexture(): Nullable<BaseTexture> {
            return null;
        }

        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }

            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new WaterMaterialDefines();
            }

            var defines = <WaterMaterialDefines>subMesh._materialDefines;
            var scene = this.getScene();

            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            var engine = scene.getEngine();

            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (this.bumpTexture && StandardMaterial.BumpTextureEnabled) {
                        if (!this.bumpTexture.isReady()) {
                            return false;
                        } else {
                            defines._needUVs = true;
                            defines.BUMP = true;
                        }
                    }

                    if (StandardMaterial.ReflectionTextureEnabled) {
                        defines.REFLECTION = true;
                    }
                }
            }

            MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);

            MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, defines);

            if (defines._areMiscDirty) {
                if (this._fresnelSeparate) {
                    defines.FRESNELSEPARATE = true;
                }

                if (this._bumpSuperimpose) {
                    defines.BUMPSUPERIMPOSE = true;
                }

                if (this._bumpAffectsReflection) {
                    defines.BUMPAFFECTSREFLECTION = true;
                }
            }

            // Lights
            defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);

            // Attribs
            MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);

            this._mesh = mesh;

            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();

                // Fallbacks
                var fallbacks = new EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }

                if (defines.LOGARITHMICDEPTH) {
                    fallbacks.addFallback(0, "LOGARITHMICDEPTH");
                }

                MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);

                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }

                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (defines.NORMAL) {
                    attribs.push(VertexBuffer.NormalKind);
                }

                if (defines.UV1) {
                    attribs.push(VertexBuffer.UVKind);
                }

                if (defines.UV2) {
                    attribs.push(VertexBuffer.UV2Kind);
                }

                if (defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, defines);

                // Legacy browser patch
                var shaderName = "water";
                var join = defines.toString();
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
                var uniformBuffers = new Array<string>()

                MaterialHelper.PrepareUniformsAndSamplersList(<EffectCreationOptions>{
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: defines,
                    maxSimultaneousLights: this.maxSimultaneousLights
                });
                subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                    <EffectCreationOptions>{
                        attributes: attribs,
                        uniformsNames: uniforms,
                        uniformBuffersNames: uniformBuffers,
                        samplers: samplers,
                        defines: join,
                        fallbacks: fallbacks,
                        onCompiled: this.onCompiled,
                        onError: this.onError,
                        indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights }
                    }, engine), defines);

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

            var defines = <WaterMaterialDefines>subMesh._materialDefines;
            if (!defines) {
                return;
            }

            var effect = subMesh.effect;
            if (!effect || !this._mesh) {
                return;
            }
            this._activeEffect = effect;

            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());

            // Bones
            MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this.bumpTexture && StandardMaterial.BumpTextureEnabled) {
                    this._activeEffect.setTexture("normalSampler", this.bumpTexture);

                    this._activeEffect.setFloat2("vNormalInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
                    this._activeEffect.setMatrix("normalMatrix", this.bumpTexture.getTextureMatrix());
                }
                // Clip plane
                MaterialHelper.BindClipPlane(this._activeEffect, scene);

                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }

                MaterialHelper.BindEyePosition(effect, scene);
            }

            this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);

            if (defines.SPECULARTERM) {
                this._activeEffect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
            }

            if (scene.lightsEnabled && !this.disableLighting) {
                MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
            }

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

            // Log. depth
            MaterialHelper.BindLogDepth(defines, this._activeEffect, scene);

            // Water
            if (StandardMaterial.ReflectionTextureEnabled) {
                this._activeEffect.setTexture("refractionSampler", this._refractionRTT);
                this._activeEffect.setTexture("reflectionSampler", this._reflectionRTT);
            }

            var wrvp = this._mesh.getWorldMatrix().multiply(this._reflectionTransform).multiply(scene.getProjectionMatrix());

            // Add delta time. Prevent adding delta time if it hasn't changed.
            let deltaTime = scene.getEngine().getDeltaTime();
            if (deltaTime !== this._lastDeltaTime) {
                this._lastDeltaTime = deltaTime;
                this._lastTime += this._lastDeltaTime;
            }

            this._activeEffect.setMatrix("worldReflectionViewProjection", wrvp);
            this._activeEffect.setVector2("windDirection", this.windDirection);
            this._activeEffect.setFloat("waveLength", this.waveLength);
            this._activeEffect.setFloat("time", this._lastTime / 100000);
            this._activeEffect.setFloat("windForce", this.windForce);
            this._activeEffect.setFloat("waveHeight", this.waveHeight);
            this._activeEffect.setFloat("bumpHeight", this.bumpHeight);
            this._activeEffect.setColor4("waterColor", this.waterColor, 1.0);
            this._activeEffect.setFloat("colorBlendFactor", this.colorBlendFactor);
            this._activeEffect.setColor4("waterColor2", this.waterColor2, 1.0);
            this._activeEffect.setFloat("colorBlendFactor2", this.colorBlendFactor2);
            this._activeEffect.setFloat("waveSpeed", this.waveSpeed);

            this._afterBind(mesh, this._activeEffect);
        }

        private _createRenderTargets(scene: Scene, renderTargetSize: Vector2): void {
            // Render targets
            this._refractionRTT = new RenderTargetTexture(name + "_refraction", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
            this._refractionRTT.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
            this._refractionRTT.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
            this._refractionRTT.ignoreCameraViewport = true;

            this._reflectionRTT = new RenderTargetTexture(name + "_reflection", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
            this._reflectionRTT.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
            this._reflectionRTT.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
            this._reflectionRTT.ignoreCameraViewport = true;

            var isVisible: boolean;
            var clipPlane: Nullable<Plane> = null;
            var savedViewMatrix: Matrix;
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
                scene._mirroredCameraPosition = Vector3.TransformCoordinates((<Camera>scene.activeCamera).position, mirrorMatrix);
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

        public getActiveTextures(): BaseTexture[] {
            var activeTextures = super.getActiveTextures();

            if (this._bumpTexture) {
                activeTextures.push(this._bumpTexture);
            }

            return activeTextures;
        }

        public hasTexture(texture: BaseTexture): boolean {
            if (super.hasTexture(texture)) {
                return true;
            }

            if (this._bumpTexture === texture) {
                return true;
            }

            return false;
        }

        public dispose(forceDisposeEffect?: boolean): void {
            if (this.bumpTexture) {
                this.bumpTexture.dispose();
            }

            var index = this.getScene().customRenderTargets.indexOf(this._refractionRTT);
            if (index != -1) {
                this.getScene().customRenderTargets.splice(index, 1);
            }
            index = -1;
            index = this.getScene().customRenderTargets.indexOf(this._reflectionRTT);
            if (index != -1) {
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

        public getClassName(): string {
            return "WaterMaterial";
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