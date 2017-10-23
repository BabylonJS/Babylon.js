module BABYLON {
    /**
     * Interface to implement to create a shadow generator compatible with BJS.
     */
    export interface IShadowGenerator {
        getShadowMap(): Nullable<RenderTargetTexture>;
        getShadowMapForRendering(): Nullable<RenderTargetTexture>;

        isReady(subMesh: SubMesh, useInstances: boolean): boolean;

        prepareDefines(defines: MaterialDefines, lightIndex: number): void;
        bindShadowLight(lightIndex: string, effect: Effect): void;
        getTransformMatrix(): Matrix;

        recreateShadowMap(): void;

        forceCompilation(onCompiled: (generator: ShadowGenerator) => void, options?: { useInstances: boolean }): void;

        serialize(): any;
        dispose(): void;
    }

    export class ShadowGenerator implements IShadowGenerator {
        private static _FILTER_NONE = 0;
        private static _FILTER_EXPONENTIALSHADOWMAP = 1;
        private static _FILTER_POISSONSAMPLING = 2;
        private static _FILTER_BLUREXPONENTIALSHADOWMAP = 3;
        private static _FILTER_CLOSEEXPONENTIALSHADOWMAP = 4;
        private static _FILTER_BLURCLOSEEXPONENTIALSHADOWMAP = 5;

        // Static
        public static get FILTER_NONE(): number {
            return ShadowGenerator._FILTER_NONE;
        }

        public static get FILTER_POISSONSAMPLING(): number {
            return ShadowGenerator._FILTER_POISSONSAMPLING;
        }

        public static get FILTER_EXPONENTIALSHADOWMAP(): number {
            return ShadowGenerator._FILTER_EXPONENTIALSHADOWMAP;
        }

        public static get FILTER_BLUREXPONENTIALSHADOWMAP(): number {
            return ShadowGenerator._FILTER_BLUREXPONENTIALSHADOWMAP;
        }

        public static get FILTER_CLOSEEXPONENTIALSHADOWMAP(): number {
            return ShadowGenerator._FILTER_CLOSEEXPONENTIALSHADOWMAP;
        }

        public static get FILTER_BLURCLOSEEXPONENTIALSHADOWMAP(): number {
            return ShadowGenerator._FILTER_BLURCLOSEEXPONENTIALSHADOWMAP;
        }

        // Members
        private _bias = 0.00005;
        public get bias(): number {
            return this._bias;
        }
        public set bias(bias: number) {
            this._bias = bias;
        }

        private _blurBoxOffset = 1;
        public get blurBoxOffset(): number {
            return this._blurBoxOffset;
        }
        public set blurBoxOffset(value: number) {
            if (this._blurBoxOffset === value) {
                return;
            }

            this._blurBoxOffset = value;
            this._disposeBlurPostProcesses();
        }

        private _blurScale = 2;
        public get blurScale(): number {
            return this._blurScale;
        }
        public set blurScale(value: number) {
            if (this._blurScale === value) {
                return;
            }

            this._blurScale = value;
            this._disposeBlurPostProcesses();
        }

        private _blurKernel = 1;
        public get blurKernel(): number {
            return this._blurKernel;
        }
        public set blurKernel(value: number) {
            if (this._blurKernel === value) {
                return;
            }

            this._blurKernel = value;
            this._disposeBlurPostProcesses();
        }

        private _useKernelBlur = false;
        public get useKernelBlur(): boolean {
            return this._useKernelBlur;
        }
        public set useKernelBlur(value: boolean) {
            if (this._useKernelBlur === value) {
                return;
            }

            this._useKernelBlur = value;
            this._disposeBlurPostProcesses();
        }

        private _depthScale: number;
        public get depthScale(): number {
            return this._depthScale !== undefined ? this._depthScale : this._light.getDepthScale();
        }
        public set depthScale(value: number) {
            this._depthScale = value;
        }

        private _filter = ShadowGenerator.FILTER_NONE;
        public get filter(): number {
            return this._filter;
        }
        public set filter(value: number) {
            // Blurring the cubemap is going to be too expensive. Reverting to unblurred version
            if (this._light.needCube()) {
                if (value === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP) {
                    this.useExponentialShadowMap = true;
                    return;
                }
                else if (value === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) {
                    this.useCloseExponentialShadowMap = true;
                    return;
                }
            }

            if (this._filter === value) {
                return;
            }

            this._filter = value;
            this._disposeBlurPostProcesses();
            this._applyFilterValues();
            this._light._markMeshesAsLightDirty();
        }

        public get usePoissonSampling(): boolean {
            return this.filter === ShadowGenerator.FILTER_POISSONSAMPLING;
        }

        public set usePoissonSampling(value: boolean) {
            if (!value && this.filter !== ShadowGenerator.FILTER_POISSONSAMPLING) {
                return;
            }

            this.filter = (value ? ShadowGenerator.FILTER_POISSONSAMPLING : ShadowGenerator.FILTER_NONE);
        }

        public get useVarianceShadowMap(): boolean {
            Tools.Warn("VSM are now replaced by ESM. Please use useExponentialShadowMap instead.");
            return this.useExponentialShadowMap;
        }
        public set useVarianceShadowMap(value: boolean) {
            Tools.Warn("VSM are now replaced by ESM. Please use useExponentialShadowMap instead.");
            this.useExponentialShadowMap = value;
        }

        public get useBlurVarianceShadowMap(): boolean {
            Tools.Warn("VSM are now replaced by ESM. Please use useBlurExponentialShadowMap instead.");
            return this.useBlurExponentialShadowMap;
        }
        public set useBlurVarianceShadowMap(value: boolean) {
            Tools.Warn("VSM are now replaced by ESM. Please use useBlurExponentialShadowMap instead.");
            this.useBlurExponentialShadowMap = value;
        }

        public get useExponentialShadowMap(): boolean {
            return this.filter === ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP;
        }
        public set useExponentialShadowMap(value: boolean) {
            if (!value && this.filter !== ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP) {
                return;
            }
            this.filter = (value ? ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP : ShadowGenerator.FILTER_NONE);
        }

        public get useBlurExponentialShadowMap(): boolean {
            return this.filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP;
        }
        public set useBlurExponentialShadowMap(value: boolean) {
            if (!value && this.filter !== ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP) {
                return;
            }
            this.filter = (value ? ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP : ShadowGenerator.FILTER_NONE);
        }

        public get useCloseExponentialShadowMap(): boolean {
            return this.filter === ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP;
        }
        public set useCloseExponentialShadowMap(value: boolean) {
            if (!value && this.filter !== ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP) {
                return;
            }
            this.filter = (value ? ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP : ShadowGenerator.FILTER_NONE);
        }

        public get useBlurCloseExponentialShadowMap(): boolean {
            return this.filter === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP;
        }
        public set useBlurCloseExponentialShadowMap(value: boolean) {
            if (!value && this.filter !== ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) {
                return;
            }
            this.filter = (value ? ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP : ShadowGenerator.FILTER_NONE);
        }

        private _darkness = 0;
        /**
         * Returns the darkness value (float).  
         */
        public getDarkness(): number {
            return this._darkness;
        }
        /**
         * Sets the ShadowGenerator darkness value (float <= 1.0).  
         * Returns the ShadowGenerator.  
         */
        public setDarkness(darkness: number): ShadowGenerator {
            if (darkness >= 1.0)
                this._darkness = 1.0;
            else if (darkness <= 0.0)
                this._darkness = 0.0;
            else
                this._darkness = darkness;
            return this;
        }

        private _transparencyShadow = false;
        /**
         * Sets the ability to have transparent shadow (boolean).  
         * Returns the ShadowGenerator.  
         */
        public setTransparencyShadow(hasShadow: boolean): ShadowGenerator {
            this._transparencyShadow = hasShadow;
            return this;
        }

        private _shadowMap: Nullable<RenderTargetTexture>;
        private _shadowMap2: Nullable<RenderTargetTexture>;
        /**
         * Returns a RenderTargetTexture object : the shadow map texture.  
         */
        public getShadowMap(): Nullable<RenderTargetTexture> {
            return this._shadowMap;
        }
        /**
         * Returns the most ready computed shadow map as a RenderTargetTexture object.  
         */
        public getShadowMapForRendering(): Nullable<RenderTargetTexture> {
            if (this._shadowMap2) {
                return this._shadowMap2;
            }

            return this._shadowMap;
        }

        /**
         * Helper function to add a mesh and its descendants to the list of shadow casters
         * @param mesh Mesh to add
         * @param includeDescendants boolean indicating if the descendants should be added. Default to true
         */
        public addShadowCaster(mesh: AbstractMesh, includeDescendants = true): ShadowGenerator {
            if (!this._shadowMap) {
                return this;
            }

            if (!this._shadowMap.renderList) {
                this._shadowMap.renderList = [];
            }

            this._shadowMap.renderList.push(mesh);

            if (includeDescendants) {
                this._shadowMap.renderList.push(...mesh.getChildMeshes());
            }

            return this;
        }

        /**
         * Helper function to remove a mesh and its descendants from the list of shadow casters
         * @param mesh Mesh to remove
         * @param includeDescendants boolean indicating if the descendants should be removed. Default to true
         */
        public removeShadowCaster(mesh: AbstractMesh, includeDescendants = true): ShadowGenerator {
            if (!this._shadowMap || !this._shadowMap.renderList) {
                return this;
            }

            var index = this._shadowMap.renderList.indexOf(mesh);

            if (index !== -1) {
                this._shadowMap.renderList.splice(index, 1);
            }

            if (includeDescendants) {
                for (var child of mesh.getChildren()) {
                    this.removeShadowCaster(<any>child);
                }
            }

            return this;
        }

        /**
		 * Controls the extent to which the shadows fade out at the edge of the frustum
         * Used only by directionals and spots
		 */
        public frustumEdgeFalloff = 0;

        private _light: IShadowLight;
        /**
         * Returns the associated light object.  
         */
        public getLight(): IShadowLight {
            return this._light;
        }

        public forceBackFacesOnly = false;

        private _scene: Scene;
        private _lightDirection = Vector3.Zero();

        private _effect: Effect;

        private _viewMatrix = Matrix.Zero();
        private _projectionMatrix = Matrix.Zero();
        private _transformMatrix = Matrix.Zero();
        private _cachedPosition: Vector3;
        private _cachedDirection: Vector3;
        private _cachedDefines: string;
        private _currentRenderID: number;
        private _downSamplePostprocess: Nullable<PassPostProcess>;
        private _boxBlurPostprocess: Nullable<PostProcess>;
        private _kernelBlurXPostprocess: Nullable<PostProcess>;
        private _kernelBlurYPostprocess: Nullable<PostProcess>;
        private _blurPostProcesses: PostProcess[];
        private _mapSize: number;
        private _currentFaceIndex = 0;
        private _currentFaceIndexCache = 0;
        private _textureType: number;
        private _defaultTextureMatrix = Matrix.Identity();

        /**
         * Creates a ShadowGenerator object.  
         * A ShadowGenerator is the required tool to use the shadows.  
         * Each light casting shadows needs to use its own ShadowGenerator.  
         * Required parameters : 
         * - `mapSize` (integer): the size of the texture what stores the shadows. Example : 1024.    
         * - `light`: the light object generating the shadows.  
         * - `useFullFloatFirst`: by default the generator will try to use half float textures but if you need precision (for self shadowing for instance), you can use this option to enforce full float texture.
         * Documentation : http://doc.babylonjs.com/tutorials/shadows  
         */
        constructor(mapSize: number, light: IShadowLight, useFullFloatFirst?: boolean) {
            this._mapSize = mapSize;
            this._light = light;
            this._scene = light.getScene();
            light._shadowGenerator = this;

            // Texture type fallback from float to int if not supported.
            var caps = this._scene.getEngine().getCaps();

            if (!useFullFloatFirst) {
                if (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering) {
                    this._textureType = Engine.TEXTURETYPE_HALF_FLOAT;
                }
                else if (caps.textureFloatRender && caps.textureFloatLinearFiltering) {
                    this._textureType = Engine.TEXTURETYPE_FLOAT;
                }
                else {
                    this._textureType = Engine.TEXTURETYPE_UNSIGNED_INT;
                }
            } else {
                if (caps.textureFloatRender && caps.textureFloatLinearFiltering) {
                    this._textureType = Engine.TEXTURETYPE_FLOAT;
                }
                else if (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering) {
                    this._textureType = Engine.TEXTURETYPE_HALF_FLOAT;
                }
                else {
                    this._textureType = Engine.TEXTURETYPE_UNSIGNED_INT;
                }
            }

            this._initializeGenerator();
        }

        private _initializeGenerator(): void {
            this._light._markMeshesAsLightDirty();
            this._initializeShadowMap();
        }

        private _initializeShadowMap(): void {
            // Render target
            this._shadowMap = new RenderTargetTexture(this._light.name + "_shadowMap", this._mapSize, this._scene, false, true, this._textureType, this._light.needCube());
            this._shadowMap.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.anisotropicFilteringLevel = 1;
            this._shadowMap.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
            this._shadowMap.renderParticles = false;
            this._shadowMap.ignoreCameraViewport = true;

            // Record Face Index before render.
            this._shadowMap.onBeforeRenderObservable.add((faceIndex: number) => {
                this._currentFaceIndex = faceIndex;
            });

            // Custom render function.
            this._shadowMap.customRenderFunction = this._renderForShadowMap.bind(this);

            // Blur if required afer render.
            this._shadowMap.onAfterUnbindObservable.add(() => {
                if (!this.useBlurExponentialShadowMap && !this.useBlurCloseExponentialShadowMap) {
                    return;
                }

                if (!this._blurPostProcesses || !this._blurPostProcesses.length) {
                    this._initializeBlurRTTAndPostProcesses();
                }
                let shadowMap = this.getShadowMapForRendering();

                if (shadowMap) {
                    this._scene.postProcessManager.directRender(this._blurPostProcesses, shadowMap.getInternalTexture(), true);
                }
            });

            // Clear according to the chosen filter.
            this._shadowMap.onClearObservable.add((engine: Engine) => {
                if (this.useExponentialShadowMap || this.useBlurExponentialShadowMap) {
                    engine.clear(new Color4(0, 0, 0, 0), true, true, true);
                }
                else {
                    engine.clear(new Color4(1.0, 1.0, 1.0, 1.0), true, true, true);
                }
            });
        }

        private _initializeBlurRTTAndPostProcesses(): void {
            var engine = this._scene.getEngine();
            var targetSize = this._mapSize / this.blurScale;

            if (!this.useKernelBlur || this.blurScale !== 1.0) {
                this._shadowMap2 = new RenderTargetTexture(this._light.name + "_shadowMap2", targetSize, this._scene, false, true, this._textureType);
                this._shadowMap2.wrapU = Texture.CLAMP_ADDRESSMODE;
                this._shadowMap2.wrapV = Texture.CLAMP_ADDRESSMODE;
                this._shadowMap2.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
            }

            if (this.useKernelBlur) {
                this._kernelBlurXPostprocess = new BlurPostProcess(this._light.name + "KernelBlurX", new Vector2(1, 0), this.blurKernel, 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._textureType);
                this._kernelBlurXPostprocess.width = targetSize;
                this._kernelBlurXPostprocess.height = targetSize;
                this._kernelBlurXPostprocess.onApplyObservable.add(effect => {
                    effect.setTexture("textureSampler", this._shadowMap);
                });

                this._kernelBlurYPostprocess = new BlurPostProcess(this._light.name + "KernelBlurY", new Vector2(0, 1), this.blurKernel, 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, this._textureType);

                this._kernelBlurXPostprocess.autoClear = false;
                this._kernelBlurYPostprocess.autoClear = false;

                if (this._textureType === Engine.TEXTURETYPE_UNSIGNED_INT) {
                    (<BlurPostProcess>this._kernelBlurXPostprocess).packedFloat = true;
                    (<BlurPostProcess>this._kernelBlurYPostprocess).packedFloat = true;
                }

                this._blurPostProcesses = [this._kernelBlurXPostprocess, this._kernelBlurYPostprocess];
            }
            else {
                this._boxBlurPostprocess = new PostProcess(this._light.name + "DepthBoxBlur", "depthBoxBlur", ["screenSize", "boxOffset"], [], 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, "#define OFFSET " + this._blurBoxOffset, this._textureType);
                this._boxBlurPostprocess.onApplyObservable.add(effect => {
                    effect.setFloat2("screenSize", targetSize, targetSize);
                    effect.setTexture("textureSampler", this._shadowMap);
                });

                this._boxBlurPostprocess.autoClear = false;

                this._blurPostProcesses = [this._boxBlurPostprocess];
            }
        }

        private _renderForShadowMap(opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void {
            var index: number;
            let engine = this._scene.getEngine();

            if (depthOnlySubMeshes.length) {
                engine.setColorWrite(false);
                for (index = 0; index < depthOnlySubMeshes.length; index++) {
                    this._renderSubMeshForShadowMap(depthOnlySubMeshes.data[index]);
                }
                engine.setColorWrite(true);
            }

            for (index = 0; index < opaqueSubMeshes.length; index++) {
                this._renderSubMeshForShadowMap(opaqueSubMeshes.data[index]);
            }

            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                this._renderSubMeshForShadowMap(alphaTestSubMeshes.data[index]);
            }

            if (this._transparencyShadow) {
                for (index = 0; index < transparentSubMeshes.length; index++) {
                    this._renderSubMeshForShadowMap(transparentSubMeshes.data[index]);
                }
            }
        }

        private _renderSubMeshForShadowMap(subMesh: SubMesh): void {
            var mesh = subMesh.getRenderingMesh();
            var scene = this._scene;
            var engine = scene.getEngine();

            // Culling
            engine.setState(subMesh.getMaterial().backFaceCulling);

            // Managing instances
            var batch = mesh._getInstancesRenderList(subMesh._id);
            if (batch.mustReturn) {
                return;
            }

            var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);
            if (this.isReady(subMesh, hardwareInstancedRendering)) {
                engine.enableEffect(this._effect);
                mesh._bind(subMesh, this._effect, Material.TriangleFillMode);
                var material = subMesh.getMaterial();

                this._effect.setFloat2("biasAndScale", this.bias, this.depthScale);

                this._effect.setMatrix("viewProjection", this.getTransformMatrix());
                this._effect.setVector3("lightPosition", this.getLight().position);

                if (scene.activeCamera) {
                    this._effect.setFloat2("depthValues", this.getLight().getDepthMinZ(scene.activeCamera), this.getLight().getDepthMinZ(scene.activeCamera) + this.getLight().getDepthMaxZ(scene.activeCamera));
                }

                // Alpha test
                if (material && material.needAlphaTesting()) {
                    var alphaTexture = material.getAlphaTestTexture();
                    if (alphaTexture) {
                        this._effect.setTexture("diffuseSampler", alphaTexture);
                        this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix() || this._defaultTextureMatrix);
                    }
                }

                // Bones
                if (mesh.useBones && mesh.computeBonesUsingShaders) {
                    this._effect.setMatrices("mBones", (<Skeleton>mesh.skeleton).getTransformMatrices((mesh)));
                }

                if (this.forceBackFacesOnly) {
                    engine.setState(true, 0, false, true);
                }

                // Draw
                mesh._processRendering(subMesh, this._effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                    (isInstance, world) => this._effect.setMatrix("world", world));

                if (this.forceBackFacesOnly) {
                    engine.setState(true, 0, false, false);
                }
            } else {
                // Need to reset refresh rate of the shadowMap
                if (this._shadowMap) {
                    this._shadowMap.resetRefreshCounter();
                }
            }
        }

        private _applyFilterValues(): void {
            if (!this._shadowMap) {
                return;
            }

            if (this.filter === ShadowGenerator.FILTER_NONE) {
                this._shadowMap.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE);
            } else {
                this._shadowMap.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
            }
        }

        /**
         * Force shader compilation including textures ready check
         */
        public forceCompilation(onCompiled: (generator: ShadowGenerator) => void, options?: { useInstances: boolean }): void {
            let shadowMap = this.getShadowMap();
            if (!shadowMap) {
                return;
            }

            var subMeshes = new Array<SubMesh>();
            var currentIndex = 0;

            let renderList = shadowMap.renderList;

            if (!renderList) {
                return;
            }

            for (var mesh of renderList) {
                subMeshes.push(...mesh.subMeshes);
            }

            var checkReady = () => {
                if (!this._scene || !this._scene.getEngine()) {
                    return;
                }

                let subMesh = subMeshes[currentIndex];

                if (this.isReady(subMesh, options ? options.useInstances : false)) {
                    currentIndex++;
                    if (currentIndex >= subMeshes.length) {
                        if (onCompiled) {
                            onCompiled(this);
                        }
                        return;
                    }
                }
                setTimeout(checkReady, 16);
            };

            if (subMeshes.length > 0) {
                checkReady();
            }
        }

        /**
         * Boolean : true when the ShadowGenerator is finally computed.  
         */
        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var defines = [];

            if (this._textureType !== Engine.TEXTURETYPE_UNSIGNED_INT) {
                defines.push("#define FLOAT");
            }

            if (this.useExponentialShadowMap || this.useBlurExponentialShadowMap) {
                defines.push("#define ESM");
            }

            var attribs = [VertexBuffer.PositionKind];

            var mesh = subMesh.getMesh();
            var material = subMesh.getMaterial();

            // Alpha test
            if (material && material.needAlphaTesting()) {
                var alphaTexture = material.getAlphaTestTexture();
                if (alphaTexture) {
                    defines.push("#define ALPHATEST");
                    if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                        attribs.push(VertexBuffer.UVKind);
                        defines.push("#define UV1");
                    }
                    if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                        if (alphaTexture.coordinatesIndex === 1) {
                            attribs.push(VertexBuffer.UV2Kind);
                            defines.push("#define UV2");
                        }
                    }
                }
            }

            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders) {
                attribs.push(VertexBuffer.MatricesIndicesKind);
                attribs.push(VertexBuffer.MatricesWeightsKind);
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(VertexBuffer.MatricesWeightsExtraKind);
                }
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BonesPerMesh " + ((<Skeleton>mesh.skeleton).bones.length + 1));
            } else {
                defines.push("#define NUM_BONE_INFLUENCERS 0");
            }

            // Instances
            if (useInstances) {
                defines.push("#define INSTANCES");
                attribs.push("world0");
                attribs.push("world1");
                attribs.push("world2");
                attribs.push("world3");
            }

            // Get correct effect
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;
                this._effect = this._scene.getEngine().createEffect("shadowMap",
                    attribs,
                    ["world", "mBones", "viewProjection", "diffuseMatrix", "lightPosition", "depthValues", "biasAndScale"],
                    ["diffuseSampler"], join);
            }

            return this._effect.isReady();
        }

        /**
         * This creates the defines related to the standard BJS materials.
         */
        public prepareDefines(defines: any, lightIndex: number): void {
            var scene = this._scene;
            var light = this._light;

            if (!scene.shadowsEnabled || !light.shadowEnabled) {
                return;
            }

            defines["SHADOW" + lightIndex] = true;

            if (this.usePoissonSampling) {
                defines["SHADOWPCF" + lightIndex] = true;
            }
            else if (this.useExponentialShadowMap || this.useBlurExponentialShadowMap) {
                defines["SHADOWESM" + lightIndex] = true;
            }
            else if (this.useCloseExponentialShadowMap || this.useBlurCloseExponentialShadowMap) {
                defines["SHADOWCLOSEESM" + lightIndex] = true;
            }

            if (light.needCube()) {
                defines["SHADOWCUBE" + lightIndex] = true;
            }
        }

        /**
         * This binds shadow lights related to the standard BJS materials.
         * It implies the unifroms available on the materials are the standard BJS ones.
         */
        public bindShadowLight(lightIndex: string, effect: Effect): void {
            var light = this._light;
            var scene = this._scene;

            if (!scene.shadowsEnabled || !light.shadowEnabled) {
                return;
            }

            let camera = scene.activeCamera;
            if (!camera) {
                return;
            }

            let shadowMap = this.getShadowMap();

            if (!shadowMap) {
                return;
            }

            if (!light.needCube()) {
                effect.setMatrix("lightMatrix" + lightIndex, this.getTransformMatrix());
            }
            effect.setTexture("shadowSampler" + lightIndex, this.getShadowMapForRendering());
            light._uniformBuffer.updateFloat4("shadowsInfo", this.getDarkness(), this.blurScale / shadowMap.getSize().width, this.depthScale, this.frustumEdgeFalloff, lightIndex);
            light._uniformBuffer.updateFloat2("depthValues", this.getLight().getDepthMinZ(camera), this.getLight().getDepthMinZ(camera) + this.getLight().getDepthMaxZ(camera), lightIndex);
        }

        // Methods
        /**
         * Returns a Matrix object : the updated transformation matrix.  
         */
        public getTransformMatrix(): Matrix {
            var scene = this._scene;
            if (this._currentRenderID === scene.getRenderId() && this._currentFaceIndexCache === this._currentFaceIndex) {
                return this._transformMatrix;
            }

            this._currentRenderID = scene.getRenderId();
            this._currentFaceIndexCache = this._currentFaceIndex;

            var lightPosition = this._light.position;
            if (this._light.computeTransformedInformation()) {
                lightPosition = this._light.transformedPosition;
            }

            Vector3.NormalizeToRef(this._light.getShadowDirection(this._currentFaceIndex), this._lightDirection);
            if (Math.abs(Vector3.Dot(this._lightDirection, Vector3.Up())) === 1.0) {
                this._lightDirection.z = 0.0000000000001; // Required to avoid perfectly perpendicular light
            }

            if (this._light.needProjectionMatrixCompute() || !this._cachedPosition || !this._cachedDirection || !lightPosition.equals(this._cachedPosition) || !this._lightDirection.equals(this._cachedDirection)) {

                this._cachedPosition = lightPosition.clone();
                this._cachedDirection = this._lightDirection.clone();

                Matrix.LookAtLHToRef(lightPosition, lightPosition.add(this._lightDirection), Vector3.Up(), this._viewMatrix);

                let shadowMap = this.getShadowMap();

                if (shadowMap) {
                    let renderList = shadowMap.renderList;

                    if (renderList) {
                        this._light.setShadowProjectionMatrix(this._projectionMatrix, this._viewMatrix, renderList);
                    }
                }

                this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
            }

            return this._transformMatrix;
        }

        public recreateShadowMap(): void {
            let shadowMap = this._shadowMap;

            if (!shadowMap) {
                return;
            }

            // Track render list.
            var renderList = shadowMap.renderList;
            // Clean up existing data.
            this._disposeRTTandPostProcesses();
            // Reinitializes.
            this._initializeGenerator();
            // Reaffect the filter to ensure a correct fallback if necessary.
            this.filter = this.filter;
            // Reaffect the filter.
            this._applyFilterValues();
            // Reaffect Render List.
            shadowMap.renderList = renderList;
        }

        private _disposeBlurPostProcesses(): void {
            if (this._shadowMap2) {
                this._shadowMap2.dispose();
                this._shadowMap2 = null;
            }

            if (this._downSamplePostprocess) {
                this._downSamplePostprocess.dispose();
                this._downSamplePostprocess = null;
            }

            if (this._boxBlurPostprocess) {
                this._boxBlurPostprocess.dispose();
                this._boxBlurPostprocess = null;
            }

            if (this._kernelBlurXPostprocess) {
                this._kernelBlurXPostprocess.dispose();
                this._kernelBlurXPostprocess = null;
            }

            if (this._kernelBlurYPostprocess) {
                this._kernelBlurYPostprocess.dispose();
                this._kernelBlurYPostprocess = null;
            }

            this._blurPostProcesses = [];
        }

        private _disposeRTTandPostProcesses(): void {
            if (this._shadowMap) {
                this._shadowMap.dispose();
                this._shadowMap = null;
            }

            this._disposeBlurPostProcesses();
        }

        /**
         * Disposes the ShadowGenerator.  
         * Returns nothing.  
         */
        public dispose(): void {
            this._disposeRTTandPostProcesses();

            if (this._light) {
                this._light._shadowGenerator = null;
                this._light._markMeshesAsLightDirty();
            }
        }
        /**
         * Serializes the ShadowGenerator and returns a serializationObject.  
         */
        public serialize(): any {
            var serializationObject: any = {};
            var shadowMap = this.getShadowMap();

            if (!shadowMap) {
                return serializationObject;
            }

            serializationObject.lightId = this._light.id;
            serializationObject.mapSize = shadowMap.getRenderSize();
            serializationObject.useExponentialShadowMap = this.useExponentialShadowMap;
            serializationObject.useBlurExponentialShadowMap = this.useBlurExponentialShadowMap;
            serializationObject.useCloseExponentialShadowMap = this.useBlurExponentialShadowMap;
            serializationObject.useBlurCloseExponentialShadowMap = this.useBlurExponentialShadowMap;
            serializationObject.usePoissonSampling = this.usePoissonSampling;
            serializationObject.forceBackFacesOnly = this.forceBackFacesOnly;
            serializationObject.depthScale = this.depthScale;
            serializationObject.darkness = this.getDarkness();
            serializationObject.blurBoxOffset = this.blurBoxOffset;
            serializationObject.blurKernel = this.blurKernel;
            serializationObject.blurScale = this.blurScale;
            serializationObject.useKernelBlur = this.useKernelBlur;
            serializationObject.transparencyShadow = this._transparencyShadow;

            serializationObject.renderList = [];
            if (shadowMap.renderList) {
                for (var meshIndex = 0; meshIndex < shadowMap.renderList.length; meshIndex++) {
                    var mesh = shadowMap.renderList[meshIndex];

                    serializationObject.renderList.push(mesh.id);
                }
            }

            return serializationObject;
        }
        /**
         * Parses a serialized ShadowGenerator and returns a new ShadowGenerator.  
         */
        public static Parse(parsedShadowGenerator: any, scene: Scene): ShadowGenerator {
            //casting to point light, as light is missing the position attr and typescript complains.
            var light = <PointLight>scene.getLightByID(parsedShadowGenerator.lightId);
            var shadowGenerator = new ShadowGenerator(parsedShadowGenerator.mapSize, light);
            var shadowMap = shadowGenerator.getShadowMap();

            for (var meshIndex = 0; meshIndex < parsedShadowGenerator.renderList.length; meshIndex++) {
                var meshes = scene.getMeshesByID(parsedShadowGenerator.renderList[meshIndex]);
                meshes.forEach(function (mesh) {
                    if (!shadowMap) {
                        return;
                    }
                    if (!shadowMap.renderList) {
                        shadowMap.renderList = [];
                    }
                    shadowMap.renderList.push(mesh);
                });
            }

            if (parsedShadowGenerator.usePoissonSampling) {
                shadowGenerator.usePoissonSampling = true;
            }
            else if (parsedShadowGenerator.useExponentialShadowMap) {
                shadowGenerator.useExponentialShadowMap = true;
            }
            else if (parsedShadowGenerator.useBlurExponentialShadowMap) {
                shadowGenerator.useBlurExponentialShadowMap = true;
            }
            else if (parsedShadowGenerator.useCloseExponentialShadowMap) {
                shadowGenerator.useCloseExponentialShadowMap = true;
            }
            else if (parsedShadowGenerator.useBlurCloseExponentialShadowMap) {
                shadowGenerator.useBlurCloseExponentialShadowMap = true;
            }

            // Backward compat
            else if (parsedShadowGenerator.useVarianceShadowMap) {
                shadowGenerator.useExponentialShadowMap = true;
            }
            else if (parsedShadowGenerator.useBlurVarianceShadowMap) {
                shadowGenerator.useBlurExponentialShadowMap = true;
            }

            if (parsedShadowGenerator.depthScale) {
                shadowGenerator.depthScale = parsedShadowGenerator.depthScale;
            }

            if (parsedShadowGenerator.blurScale) {
                shadowGenerator.blurScale = parsedShadowGenerator.blurScale;
            }

            if (parsedShadowGenerator.blurBoxOffset) {
                shadowGenerator.blurBoxOffset = parsedShadowGenerator.blurBoxOffset;
            }

            if (parsedShadowGenerator.useKernelBlur) {
                shadowGenerator.useKernelBlur = parsedShadowGenerator.useKernelBlur;
            }

            if (parsedShadowGenerator.blurKernel) {
                shadowGenerator.blurKernel = parsedShadowGenerator.blurKernel;
            }

            if (parsedShadowGenerator.bias !== undefined) {
                shadowGenerator.bias = parsedShadowGenerator.bias;
            }

            if (parsedShadowGenerator.darkness) {
                shadowGenerator.setDarkness(parsedShadowGenerator.darkness);
            }

            if (parsedShadowGenerator.transparencyShadow) {
                shadowGenerator.setTransparencyShadow(true);
            }

            shadowGenerator.forceBackFacesOnly = parsedShadowGenerator.forceBackFacesOnly;

            return shadowGenerator;
        }
    }
} 