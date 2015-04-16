﻿module BABYLON {
    export class ShadowGenerator {
        private static _FILTER_NONE = 0;
        private static _FILTER_VARIANCESHADOWMAP = 1;
        private static _FILTER_POISSONSAMPLING = 2;
        private static _FILTER_BLURVARIANCESHADOWMAP = 3;

        // Static
        public static get FILTER_NONE(): number {
            return ShadowGenerator._FILTER_NONE;
        }

        public static get FILTER_VARIANCESHADOWMAP(): number {
            return ShadowGenerator._FILTER_VARIANCESHADOWMAP;
        }

        public static get FILTER_POISSONSAMPLING(): number {
            return ShadowGenerator._FILTER_POISSONSAMPLING;
        }

        public static get FILTER_BLURVARIANCESHADOWMAP(): number {
            return ShadowGenerator._FILTER_BLURVARIANCESHADOWMAP;
        }

        // Members
        private _filter = ShadowGenerator.FILTER_NONE;
        public blurScale = 2;
        private _blurBoxOffset = 0;
        private _bias = 0.00005;

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

            this._boxBlurPostprocess = new PostProcess("DepthBoxBlur", "depthBoxBlur", ["screenSize", "boxOffset"], [], 1.0 / this.blurScale, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define OFFSET " + value);
            this._boxBlurPostprocess.onApply = effect => {
                effect.setFloat2("screenSize", this._mapSize / this.blurScale, this._mapSize / this.blurScale);
            };
        }

        public get filter(): number {
            return this._filter;
        }

        public set filter(value: number) {
            if (this._filter === value) {
                return;
            }

            this._filter = value;

            if (this.useVarianceShadowMap || this.useBlurVarianceShadowMap) {
                this._shadowMap.anisotropicFilteringLevel = 16;
                this._shadowMap.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
            } else {
                this._shadowMap.anisotropicFilteringLevel = 1;
                this._shadowMap.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE);
            }
        }

        public get useVarianceShadowMap(): boolean {
            return this.filter === ShadowGenerator.FILTER_VARIANCESHADOWMAP && this._light.supportsVSM();
        }
        public set useVarianceShadowMap(value: boolean) {
            this.filter = (value ? ShadowGenerator.FILTER_VARIANCESHADOWMAP : ShadowGenerator.FILTER_NONE);
        }

        public get usePoissonSampling(): boolean {
            return this.filter === ShadowGenerator.FILTER_POISSONSAMPLING ||
                (!this._light.supportsVSM() && (
                    this.filter === ShadowGenerator.FILTER_VARIANCESHADOWMAP ||
                    this.filter === ShadowGenerator.FILTER_BLURVARIANCESHADOWMAP
                    ));
        }
        public set usePoissonSampling(value: boolean) {
            this.filter = (value ? ShadowGenerator.FILTER_POISSONSAMPLING : ShadowGenerator.FILTER_NONE);
        }

        public get useBlurVarianceShadowMap(): boolean {
            return this.filter === ShadowGenerator.FILTER_BLURVARIANCESHADOWMAP && this._light.supportsVSM();
        }
        public set useBlurVarianceShadowMap(value: boolean) {
            this.filter = (value ? ShadowGenerator.FILTER_BLURVARIANCESHADOWMAP : ShadowGenerator.FILTER_NONE);
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

        constructor(mapSize: number, light: IShadowLight) {
            this._light = light;
            this._scene = light.getScene();
            this._mapSize = mapSize;

            light._shadowGenerator = this;

            // Render target
            this._shadowMap = new RenderTargetTexture(light.name + "_shadowMap", mapSize, this._scene, false);
            this._shadowMap.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.anisotropicFilteringLevel = 1;
            this._shadowMap.updateSamplingMode(Texture.NEAREST_SAMPLINGMODE);
            this._shadowMap.renderParticles = false;

            this._shadowMap.onAfterUnbind = () => {
                if (!this.useBlurVarianceShadowMap) {
                    return;
                }

                if (!this._shadowMap2) {
                    this._shadowMap2 = new RenderTargetTexture(light.name + "_shadowMap", mapSize, this._scene, false);
                    this._shadowMap2.wrapU = Texture.CLAMP_ADDRESSMODE;
                    this._shadowMap2.wrapV = Texture.CLAMP_ADDRESSMODE;
                    this._shadowMap2.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);

                    this._downSamplePostprocess = new PassPostProcess("downScale", 1.0 / this.blurScale, null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
                    this._downSamplePostprocess.onApply = effect => {
                        effect.setTexture("textureSampler", this._shadowMap);
                    };

                    this.blurBoxOffset = 1;
                }

                this._scene.postProcessManager.directRender([this._downSamplePostprocess, this._boxBlurPostprocess], this._shadowMap2.getInternalTexture());
            }

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

                var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null);

                if (this.isReady(subMesh, hardwareInstancedRendering)) {
                    engine.enableEffect(this._effect);
                    mesh._bind(subMesh, this._effect, Material.TriangleFillMode);
                    var material = subMesh.getMaterial();

                    this._effect.setMatrix("viewProjection", this.getTransformMatrix());

                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        var alphaTexture = material.getAlphaTestTexture();
                        this._effect.setTexture("diffuseSampler", alphaTexture);
                        this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }

                    // Bones
                    if (mesh.useBones) {
                        this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
                    }

                    // Draw
                    mesh._processRendering(subMesh, this._effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                        (isInstance, world) => this._effect.setMatrix("world", world));
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

            this._shadowMap.onClear = (engine: Engine) => {
                if (this.useBlurVarianceShadowMap || this.useVarianceShadowMap) {
                    engine.clear(new Color4(0, 0, 0, 0), true, true);
                } else {
                    engine.clear(new Color4(1.0, 1.0, 1.0, 1.0), true, true);
                }
            }
        }

        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var defines = [];

            if (this.useVarianceShadowMap || this.useBlurVarianceShadowMap) {
                defines.push("#define VSM");
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
                    attribs.push(VertexBuffer.UV2Kind);
                    defines.push("#define UV2");
                }
            }

            // Bones
            if (mesh.useBones) {
                attribs.push(VertexBuffer.MatricesIndicesKind);
                attribs.push(VertexBuffer.MatricesWeightsKind);
                defines.push("#define BONES");
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
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
                    ["world", "mBones", "viewProjection", "diffuseMatrix"],
                    ["diffuseSampler"], join);
            }

            return this._effect.isReady();
        }

        public getShadowMap(): RenderTargetTexture {
            return this._shadowMap;
        }

        public getShadowMapForRendering(): RenderTargetTexture {
            if (this._shadowMap2) {
                return this._shadowMap2;
            }

            return this._shadowMap;
        }

        public getLight(): IShadowLight {
            return this._light;
        }

        // Methods
        public getTransformMatrix(): Matrix {
            var scene = this._scene;
            if (this._currentRenderID === scene.getRenderId()) {
                return this._transformMatrix;
            }

            this._currentRenderID = scene.getRenderId();

            var lightPosition = this._light.position;
            var lightDirection = this._light.direction;

            if (this._light.computeTransformedPosition()) {
                lightPosition = this._light.transformedPosition;
            }

            if (this._light.needRefreshPerFrame() || !this._cachedPosition || !this._cachedDirection || !lightPosition.equals(this._cachedPosition) || !lightDirection.equals(this._cachedDirection)) {

                this._cachedPosition = lightPosition.clone();
                this._cachedDirection = lightDirection.clone();

                Matrix.LookAtLHToRef(lightPosition, this._light.position.add(lightDirection), Vector3.Up(), this._viewMatrix);

                this._light.setShadowProjectionMatrix(this._projectionMatrix, this._viewMatrix, this.getShadowMap().renderList);

                this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
            }

            return this._transformMatrix;
        }

        public getDarkness(): number {
            return this._darkness;
        }

        public setDarkness(darkness: number): void {
            if (darkness >= 1.0)
                this._darkness = 1.0;
            else if (darkness <= 0.0)
                this._darkness = 0.0;
            else
                this._darkness = darkness;
        }

        public setTransparencyShadow(hasShadow: boolean): void {
            this._transparencyShadow = hasShadow;
        }

        private _packHalf(depth: number): Vector2 {
            var scale = depth * 255.0;
            var fract = scale - Math.floor(scale);

            return new Vector2(depth - fract / 255.0, fract);
        }

        public dispose(): void {
            this._shadowMap.dispose();

            if (this._shadowMap2) {
                this._shadowMap2.dispose();
            }

            if (this._downSamplePostprocess) {
                this._downSamplePostprocess.dispose();
            }

            if (this._boxBlurPostprocess) {
                this._boxBlurPostprocess.dispose();
            }
        }
    }
} 