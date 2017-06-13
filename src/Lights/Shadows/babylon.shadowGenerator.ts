module BABYLON {
    export interface IShadowGenerator {
        getShadowMap(): RenderTargetTexture;
 
        isReady(subMesh: SubMesh, useInstances: boolean): boolean;

        prepareDefines(defines: MaterialDefines, lightIndex: number): void;
        bindShadowLight(lightIndex: string, effect: Effect, depthValuesAlreadySet: boolean): boolean;

        recreateShadowMap(): void;

        serialize(): any;
        dispose(): void;
    }
 
    export class ShadowGenerator implements IShadowGenerator {
        private static _FILTER_NONE = 0;
        private static _FILTER_EXPONENTIALSHADOWMAP = 1;
        private static _FILTER_POISSONSAMPLING = 2;
        private static _FILTER_BLUREXPONENTIALSHADOWMAP = 3;

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

        // Members
        private _filter = ShadowGenerator.FILTER_NONE;
        public blurScale = 2;
        private _blurBoxOffset = 0;
        private _bias = 0.00005;
        private _lightDirection = Vector3.Zero();
        private _depthScale: number;

        public forceBackFacesOnly = false;

        public get bias(): number {
            return this._bias;
        }

        public set bias(bias: number) {
            this._bias = bias;
        }

        public get blurBoxOffset(): number {
            return this._blurBoxOffset;
        }

        public set blurBoxOffset(value: number) {
            if (this._blurBoxOffset === value) {
                return;
            }

            this._blurBoxOffset = value;

            if (this._boxBlurPostprocess) {
                this._boxBlurPostprocess.dispose();
            }

            var textureType: number;
            var caps = this._scene.getEngine().getCaps();
            if (this._useFullFloat) {
                textureType = Engine.TEXTURETYPE_FLOAT;
            }
            else {
                textureType = Engine.TEXTURETYPE_UNSIGNED_INT;
            }

            this._boxBlurPostprocess = new PostProcess("DepthBoxBlur", "depthBoxBlur", ["screenSize", "boxOffset"], [], 1.0 / this.blurScale, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define OFFSET " + value, textureType);
            this._boxBlurPostprocess.onApplyObservable.add(effect => {
                effect.setFloat2("screenSize", this._mapSize / this.blurScale, this._mapSize / this.blurScale);
            });
        }

        public get depthScale(): number {
            return this._depthScale !== undefined ? this._depthScale : this._light.getDepthScale();
        }

        public set depthScale(value: number) {
            this._depthScale = value;
        }

        public get filter(): number {
            return this._filter;
        }

        public set filter(value: number) {
            if (this._filter === value) {
                return;
            }

            this._filter = value;
            this._applyFilterValues();
            this._light._markMeshesAsLightDirty();
        }

        public get useVarianceShadowMap(): boolean {
            Tools.Warn("VSM are now replaced by ESM. Please use useExponentialShadowMap instead.");
            return this.useExponentialShadowMap;
        }
        public set useVarianceShadowMap(value: boolean) {
            Tools.Warn("VSM are now replaced by ESM. Please use useExponentialShadowMap instead.");
            this.useExponentialShadowMap = value;
        }

        public get useExponentialShadowMap(): boolean {
            return this.filter === ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP;
        }
        public set useExponentialShadowMap(value: boolean) {
            this.filter = (value ? ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP : ShadowGenerator.FILTER_NONE);
        }

        public get usePoissonSampling(): boolean {
            return this.filter === ShadowGenerator.FILTER_POISSONSAMPLING;
        }

        public set usePoissonSampling(value: boolean) {
            this.filter = (value ? ShadowGenerator.FILTER_POISSONSAMPLING : ShadowGenerator.FILTER_NONE);
        }

        public get useBlurVarianceShadowMap(): boolean {
            Tools.Warn("VSM are now replaced by ESM. Please use useBlurExponentialShadowMap instead.");
            return this.useBlurExponentialShadowMap;
        }
        public set useBlurVarianceShadowMap(value: boolean) {
            Tools.Warn("VSM are now replaced by ESM. Please use useBlurExponentialShadowMap instead.");
            this.useBlurExponentialShadowMap = value;
        }

        public get useBlurExponentialShadowMap(): boolean {
            return this.filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP;
        }
        public set useBlurExponentialShadowMap(value: boolean) {
            if (this._light.needCube() && value) {
                this.useExponentialShadowMap = true; // Blurring the cubemap is going to be too expensive. Reverting to unblurred version
            } else {
                this.filter = (value ? ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP : ShadowGenerator.FILTER_NONE);
            }
        }

        private _light: IShadowLight;
        private _scene: Scene;
        private _shadowMap: RenderTargetTexture;
        private _shadowMap2: RenderTargetTexture;
        private _darkness = 0;
        private _transparencyShadow = false;
        private _effect: Effect;

        private _viewMatrix = Matrix.Zero();
        private _projectionMatrix = Matrix.Zero();
        private _transformMatrix = Matrix.Zero();
        private _worldViewProjection = Matrix.Zero();
        private _cachedPosition: Vector3;
        private _cachedDirection: Vector3;
        private _cachedDefines: string;
        private _currentRenderID: number;
        private _downSamplePostprocess: PassPostProcess;
        private _boxBlurPostprocess: PostProcess;
        private _mapSize: number;
        private _currentFaceIndex = 0;
        private _currentFaceIndexCache = 0;

        private _useFullFloat = true;
        private _textureType: number;
        private _isCube = false;

        /**
         * Creates a ShadowGenerator object.  
         * A ShadowGenerator is the required tool to use the shadows.  
         * Each light casting shadows needs to use its own ShadowGenerator.  
         * Required parameters : 
         * -  `mapSize` (integer), the size of the texture what stores the shadows. Example : 1024.    
         * - `light` : the light object generating the shadows.  
         * Documentation : http://doc.babylonjs.com/tutorials/shadows  
         */
        constructor(mapSize: number, light: IShadowLight) {
            this._mapSize = mapSize;
            this._light = light;
            this._scene = light.getScene();
            light._shadowGenerator = this;

            // Texture type fallback from float to int if not supported.
            var caps = this._scene.getEngine().getCaps();
            if (caps.textureFloat && caps.textureFloatLinearFiltering && caps.textureFloatRender) {
                this._useFullFloat = true;
                this._textureType = Engine.TEXTURETYPE_FLOAT;
            }
            else {
                this._useFullFloat = false;
                this._textureType = Engine.TEXTURETYPE_UNSIGNED_INT;
            }

            this._initializeGenerator(1);
        }
        
        private _initializeGenerator(boxBlurOffset: number): void {
            var light = this._light;
            var scene = this._scene;
            var textureType = this._textureType;

            light._markMeshesAsLightDirty();

            // Render target
            this._shadowMap = new RenderTargetTexture(light.name + "_shadowMap", this._mapSize, this._scene, false, true, textureType, light.needCube());
            this._shadowMap.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.anisotropicFilteringLevel = 1;
            this._shadowMap.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
            this._shadowMap.renderParticles = false;

            this._shadowMap.onBeforeRenderObservable.add((faceIndex: number) => {
                this._currentFaceIndex = faceIndex;
            });

            this._shadowMap.onAfterUnbindObservable.add(() => {
                if (!this.useBlurExponentialShadowMap) {
                    return;
                }

                if (!this._shadowMap2) {
                    this._shadowMap2 = new RenderTargetTexture(light.name + "_shadowMap", this._mapSize, this._scene, false, true, textureType);
                    this._shadowMap2.wrapU = Texture.CLAMP_ADDRESSMODE;
                    this._shadowMap2.wrapV = Texture.CLAMP_ADDRESSMODE;
                    this._shadowMap2.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);

                    this._downSamplePostprocess = new PassPostProcess("downScale", 1.0 / this.blurScale, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, textureType);
                    this._downSamplePostprocess.onApplyObservable.add(effect => {
                        effect.setTexture("textureSampler", this._shadowMap);
                    });

                    this.blurBoxOffset = boxBlurOffset;
                }

                this._scene.postProcessManager.directRender([this._downSamplePostprocess, this._boxBlurPostprocess], this._shadowMap2.getInternalTexture());
            });

            // Custom render function
            var renderSubMesh = (subMesh: SubMesh): void => {
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

                var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);

                if (this.isReady(subMesh, hardwareInstancedRendering)) {
                    engine.enableEffect(this._effect);
                    mesh._bind(subMesh, this._effect, Material.TriangleFillMode);
                    var material = subMesh.getMaterial();

                    this._effect.setFloat2("biasAndScale", this.bias, this.depthScale);

                    this._effect.setMatrix("viewProjection", this.getTransformMatrix());
                    this._effect.setVector3("lightPosition", this.getLight().position);

                    if (this.getLight().needCube()) {
                        this._effect.setFloat2("depthValues", scene.activeCamera.minZ, scene.activeCamera.maxZ);
                    }

                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        var alphaTexture = material.getAlphaTestTexture();
                        this._effect.setTexture("diffuseSampler", alphaTexture);
                        this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }

                    // Bones
                    if (mesh.useBones && mesh.computeBonesUsingShaders) {
                        this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
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
                    this._shadowMap.resetRefreshCounter();
                }
            };

            this._shadowMap.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>): void => {
                var index: number;

                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }

                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }

                if (this._transparencyShadow) {
                    for (index = 0; index < transparentSubMeshes.length; index++) {
                        renderSubMesh(transparentSubMeshes.data[index]);
                    }
                }
            };

            this._shadowMap.onClearObservable.add((engine: Engine) => {
                if (this.useExponentialShadowMap || this.useBlurExponentialShadowMap) {
                    engine.clear(new Color4(0, 0, 0, 0), true, true, true);
                } else {
                    engine.clear(new Color4(1.0, 1.0, 1.0, 1.0), true, true, true);
                }
            });
        }

        private _applyFilterValues(): void {
            if (this.usePoissonSampling || this.useExponentialShadowMap || this.useBlurExponentialShadowMap) {
                this._shadowMap.anisotropicFilteringLevel = 16;
                this._shadowMap.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
            } else {
                this._shadowMap.anisotropicFilteringLevel = 1;
                this._shadowMap.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE);
            }
        }

        public recreateShadowMap(): void {
            // Track render list.
            var renderList = this._shadowMap.renderList;
            // Clean up existing data.
            this._disposeRTTandPostProcesses();
            // Reinitializes.
            this._initializeGenerator(this.blurBoxOffset);
            // Reaffect the blur to ensure a correct fallback if necessary.
            this.useBlurExponentialShadowMap = this.useBlurExponentialShadowMap;
            // Reaffect the filter.
            this._applyFilterValues();
            // Reaffect Render List.
            this._shadowMap.renderList = renderList;
        }

        /**
         * Boolean : true when the ShadowGenerator is finally computed.  
         */
        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var defines = [];

            if (this._useFullFloat) {
                defines.push("#define FULLFLOAT");
            }

            if (this.useExponentialShadowMap || this.useBlurExponentialShadowMap) {
                defines.push("#define ESM");
            }

            if (this.getLight().needCube()) {
                defines.push("#define CUBEMAP");
            }

            var attribs = [VertexBuffer.PositionKind];

            var mesh = subMesh.getMesh();
            var material = subMesh.getMaterial();

            // Alpha test
            if (material && material.needAlphaTesting()) {
                defines.push("#define ALPHATEST");
                if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    attribs.push(VertexBuffer.UVKind);
                    defines.push("#define UV1");
                }
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                    var alphaTexture = material.getAlphaTestTexture();

                    if (alphaTexture.coordinatesIndex === 1) {
                        attribs.push(VertexBuffer.UV2Kind);
                        defines.push("#define UV2");
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
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
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
         * Returns a RenderTargetTexture object : the shadow map texture.  
         */
        public getShadowMap(): RenderTargetTexture {
            return this._shadowMap;
        }

        /**
         * Returns the most ready computed shadow map as a RenderTargetTexture object.  
         */
        public getShadowMapForRendering(): RenderTargetTexture {
            if (this._shadowMap2) {
                return this._shadowMap2;
            }

            return this._shadowMap;
        }

        /**
         * Returns the associated light object.  
         */
        public getLight(): IShadowLight {
            return this._light;
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

                this._light.setShadowProjectionMatrix(this._projectionMatrix, this._viewMatrix, this.getShadowMap().renderList);

                this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
            }

            return this._transformMatrix;
        }

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
        /**
         * Sets the ability to have transparent shadow (boolean).  
         * Returns the ShadowGenerator.  
         */
        public setTransparencyShadow(hasShadow: boolean): ShadowGenerator {
            this._transparencyShadow = hasShadow;
            return this;
        }

        private _packHalf(depth: number): Vector2 {
            var scale = depth * 255.0;
            var fract = scale - Math.floor(scale);

            return new Vector2(depth - fract / 255.0, fract);
        }

        private _disposeRTTandPostProcesses(): void {
            if (this._shadowMap) {
                this._shadowMap.dispose();
                this._shadowMap = null;
            }

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
        }

        /**
         * Disposes the ShadowGenerator.  
         * Returns nothing.  
         */
        public dispose(): void {
            this._disposeRTTandPostProcesses();

            this._light._shadowGenerator = null;
            this._light._markMeshesAsLightDirty();
        }
        /**
         * Serializes the ShadowGenerator and returns a serializationObject.  
         */
        public serialize(): any {
            var serializationObject: any = {};
            var shadowMap = this.getShadowMap();

            serializationObject.lightId = this._light.id;
            serializationObject.mapSize = shadowMap.getRenderSize();
            serializationObject.useExponentialShadowMap = this.useExponentialShadowMap;
            serializationObject.useBlurExponentialShadowMap = this.useBlurExponentialShadowMap;
            serializationObject.usePoissonSampling = this.usePoissonSampling;
            serializationObject.forceBackFacesOnly = this.forceBackFacesOnly;
            serializationObject.depthScale = this.depthScale;
            serializationObject.darkness = this.getDarkness();

            serializationObject.renderList = [];
            for (var meshIndex = 0; meshIndex < shadowMap.renderList.length; meshIndex++) {
                var mesh = shadowMap.renderList[meshIndex];

                serializationObject.renderList.push(mesh.id);
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
                
            if (parsedShadowGenerator.bias !== undefined) {
                shadowGenerator.bias = parsedShadowGenerator.bias;
            }

            if (parsedShadowGenerator.darkness) {
                shadowGenerator.setDarkness(parsedShadowGenerator.darkness);
            }

            shadowGenerator.forceBackFacesOnly = parsedShadowGenerator.forceBackFacesOnly;

            return shadowGenerator;
        }

        /**
         * This creates the defines related to the standard BJS materials.
         */
        public prepareDefines(defines: MaterialDefines, lightIndex: number): void {
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

            if (light.needCube()) {
                defines["SHADOWCUBE" + lightIndex] = true;
            }
        }

        /**
         * This binds shadow lights related to the standard BJS materials.
         * It implies the unifroms available on the materials are the standard BJS ones.
         */
        public bindShadowLight(lightIndex: string, effect: Effect, depthValuesAlreadySet: boolean): boolean {
            var light = this._light;
            var scene = this._scene;

            if (!scene.shadowsEnabled || !light.shadowEnabled) {
                return;
            }

            if (!light.needCube()) {
                effect.setMatrix("lightMatrix" + lightIndex, this.getTransformMatrix());
            } else {
                if (!depthValuesAlreadySet) {
                    depthValuesAlreadySet = true;
                    effect.setFloat2("depthValues", scene.activeCamera.minZ, scene.activeCamera.maxZ);
                }
            }
            effect.setTexture("shadowSampler" + lightIndex, this.getShadowMapForRendering());
            light._uniformBuffer.updateFloat3("shadowsInfo", this.getDarkness(), this.blurScale / this.getShadowMap().getSize().width, this.depthScale, lightIndex);

            return depthValuesAlreadySet;
        }
    }
} 