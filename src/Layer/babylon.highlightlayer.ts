/// <reference path="..\PostProcess\babylon.postProcess.ts" />
/// <reference path="..\Math\babylon.math.ts" />

module BABYLON {
    /**
     * Special Glow Blur post process only blurring the alpha channel
     * It enforces keeping the most luminous color in the color channel.
     */
    class GlowBlurPostProcess extends PostProcess {
        constructor(name: string, public direction: Vector2, public kernel: number, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode: number = Texture.BILINEAR_SAMPLINGMODE, engine?: Engine, reusable?: boolean) {
            super(name, "glowBlurPostProcess", ["screenSize", "direction", "blurWidth"], null, options, camera, samplingMode, engine, reusable);

            this.onApplyObservable.add((effect: Effect) => {
                effect.setFloat2("screenSize", this.width, this.height);
                effect.setVector2("direction", this.direction);
                effect.setFloat("blurWidth", this.kernel);
            });
        }
    }

    /**
     * Highlight layer options. This helps customizing the behaviour
     * of the highlight layer.
     */
    export interface IHighlightLayerOptions {
        /**
         * Multiplication factor apply to the canvas size to compute the render target size
         * used to generated the glowing objects (the smaller the faster).
         */
        mainTextureRatio: number;

        /**
         * Enforces a fixed size texture to ensure resize independant blur.
         */
        mainTextureFixedSize?: number;

        /**
         * Multiplication factor apply to the main texture size in the first step of the blur to reduce the size 
         * of the picture to blur (the smaller the faster).
         */
        blurTextureSizeRatio: number;

        /**
         * How big in texel of the blur texture is the vertical blur.
         */
        blurVerticalSize: number;

        /**
         * How big in texel of the blur texture is the horizontal blur.
         */
        blurHorizontalSize: number;

        /**
         * Alpha blending mode used to apply the blur. Default is combine.
         */
        alphaBlendingMode: number

        /**
         * The camera attached to the layer.
         */
        camera: Nullable<Camera>;
    }

    /**
     * Storage interface grouping all the information required for glowing a mesh.
     */
    interface IHighlightLayerMesh {
        /** 
         * The glowy mesh
         */
        mesh: Mesh;
        /**
         * The color of the glow
         */
        color: Color3;
        /**
         * The mesh render callback use to insert stencil information
         */
        observerHighlight: Nullable<Observer<Mesh>>;
        /**
         * The mesh render callback use to come to the default behavior
         */
        observerDefault: Nullable<Observer<Mesh>>;
        /**
         * If it exists, the emissive color of the material will be used to generate the glow.
         * Else it falls back to the current color.
         */
        glowEmissiveOnly: boolean;
    }

    /**
     * Storage interface grouping all the information required for an excluded mesh.
     */
    interface IHighlightLayerExcludedMesh {
        /** 
         * The glowy mesh
         */
        mesh: Mesh;
        /**
         * The mesh render callback use to prevent stencil use
         */
        beforeRender: Nullable<Observer<Mesh>>;
        /**
         * The mesh render callback use to restore previous stencil use
         */
        afterRender: Nullable<Observer<Mesh>>;
    }

    /**
     * The highlight layer Helps adding a glow effect around a mesh.
     * 
     * Once instantiated in a scene, simply use the pushMesh or removeMesh method to add or remove
     * glowy meshes to your scene.
     * 
     * !!! THIS REQUIRES AN ACTIVE STENCIL BUFFER ON THE CANVAS !!!
     */
    export class HighlightLayer {
        /**
         * The neutral color used during the preparation of the glow effect.
         * This is black by default as the blend operation is a blend operation. 
         */
        public static neutralColor: Color4 = new Color4(0, 0, 0, 0);

        /**
         * Stencil value used for glowing meshes.
         */
        public static glowingMeshStencilReference = 0x02;

        /**
         * Stencil value used for the other meshes in the scene.
         */
        public static normalMeshStencilReference = 0x01;

        private _scene: Scene;
        private _engine: Engine;
        private _options: IHighlightLayerOptions;
        private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
        private _indexBuffer: Nullable<WebGLBuffer>;
        private _downSamplePostprocess: PassPostProcess;
        private _horizontalBlurPostprocess: GlowBlurPostProcess;
        private _verticalBlurPostprocess: GlowBlurPostProcess;
        private _cachedDefines: string;
        private _glowMapGenerationEffect: Effect;
        private _glowMapMergeEffect: Effect;
        private _blurTexture: RenderTargetTexture;
        private _mainTexture: RenderTargetTexture;
        private _mainTextureDesiredSize: ISize = { width: 0, height: 0 };
        private _meshes: Nullable<{ [id: string]: Nullable<IHighlightLayerMesh> }> = {};
        private _maxSize: number = 0;
        private _shouldRender = false;
        private _instanceGlowingMeshStencilReference = HighlightLayer.glowingMeshStencilReference++;
        private _excludedMeshes: Nullable<{ [id: string]: Nullable<IHighlightLayerExcludedMesh> }> = {};

        /**
         * Specifies whether or not the inner glow is ACTIVE in the layer.
         */
        public innerGlow: boolean = true;

        /**
         * Specifies whether or not the outer glow is ACTIVE in the layer.
         */
        public outerGlow: boolean = true;

        /**
         * Specifies wether the highlight layer is enabled or not.
         */
        public isEnabled: boolean = true;

        /**
         * Specifies the horizontal size of the blur.
         */
        public set blurHorizontalSize(value: number) {
            this._horizontalBlurPostprocess.kernel = value;
        }

        /**
         * Specifies the vertical size of the blur.
         */
        public set blurVerticalSize(value: number) {
            this._verticalBlurPostprocess.kernel = value;
        }

        /**
         * Gets the horizontal size of the blur.
         */
        public get blurHorizontalSize(): number {
            return this._horizontalBlurPostprocess.kernel
        }

        /**
         * Gets the vertical size of the blur.
         */
        public get blurVerticalSize(): number {
            return this._verticalBlurPostprocess.kernel;
        }

        /**
         * Gets the camera attached to the layer.
         */
        public get camera(): Nullable<Camera> {
            return this._options.camera;
        }

        /**
         * An event triggered when the highlight layer has been disposed.
         * @type {BABYLON.Observable}
         */
        public onDisposeObservable = new Observable<HighlightLayer>();

        /**
         * An event triggered when the highlight layer is about rendering the main texture with the glowy parts.
         * @type {BABYLON.Observable}
         */
        public onBeforeRenderMainTextureObservable = new Observable<HighlightLayer>();

        /**
         * An event triggered when the highlight layer is being blurred.
         * @type {BABYLON.Observable}
         */
        public onBeforeBlurObservable = new Observable<HighlightLayer>();

        /**
         * An event triggered when the highlight layer has been blurred.
         * @type {BABYLON.Observable}
         */
        public onAfterBlurObservable = new Observable<HighlightLayer>();

        /**
         * An event triggered when the glowing blurred texture is being merged in the scene.
         * @type {BABYLON.Observable}
         */
        public onBeforeComposeObservable = new Observable<HighlightLayer>();

        /**
         * An event triggered when the glowing blurred texture has been merged in the scene.
         * @type {BABYLON.Observable}
         */
        public onAfterComposeObservable = new Observable<HighlightLayer>();

        /**
         * An event triggered when the highlight layer changes its size.
         * @type {BABYLON.Observable}
         */
        public onSizeChangedObservable = new Observable<HighlightLayer>();

        /**
         * Instantiates a new highlight Layer and references it to the scene..
         * @param name The name of the layer
         * @param scene The scene to use the layer in
         * @param options Sets of none mandatory options to use with the layer (see IHighlightLayerOptions for more information)
         */
        constructor(public name: string, scene: Scene, options?: IHighlightLayerOptions) {
            this._scene = scene || Engine.LastCreatedScene;
            var engine = scene.getEngine();
            this._engine = engine;
            this._maxSize = this._engine.getCaps().maxTextureSize;
            this._scene.highlightLayers.push(this);

            // Warn on stencil.
            if (!this._engine.isStencilEnable) {
                Tools.Warn("Rendering the Highlight Layer requires the stencil to be active on the canvas. var engine = new BABYLON.Engine(canvas, antialias, { stencil: true }");
            }

            // Adapt options
            this._options = options || {
                mainTextureRatio: 0.5,
                blurTextureSizeRatio: 0.5,
                blurHorizontalSize: 1.0,
                blurVerticalSize: 1.0,
                alphaBlendingMode: Engine.ALPHA_COMBINE,
                camera: null
            };
            this._options.mainTextureRatio = this._options.mainTextureRatio || 0.5;
            this._options.blurTextureSizeRatio = this._options.blurTextureSizeRatio || 1.0;
            this._options.blurHorizontalSize = this._options.blurHorizontalSize || 1;
            this._options.blurVerticalSize = this._options.blurVerticalSize || 1;
            this._options.alphaBlendingMode = this._options.alphaBlendingMode || Engine.ALPHA_COMBINE;

            // VBO
            var vertices = [];
            vertices.push(1, 1);
            vertices.push(-1, 1);
            vertices.push(-1, -1);
            vertices.push(1, -1);

            var vertexBuffer = new VertexBuffer(engine, vertices, VertexBuffer.PositionKind, false, false, 2);
            this._vertexBuffers[VertexBuffer.PositionKind] = vertexBuffer;

            this._createIndexBuffer();

            // Effect
            this._glowMapMergeEffect = engine.createEffect("glowMapMerge",
                [VertexBuffer.PositionKind],
                ["offset"],
                ["textureSampler"], "");

            // Render target
            this.setMainTextureSize();

            // Create Textures and post processes
            this.createTextureAndPostProcesses();
        }
       
        private _createIndexBuffer(): void {
            var engine = this._scene.getEngine();

            // Indices
            var indices = [];
            indices.push(0);
            indices.push(1);
            indices.push(2);

            indices.push(0);
            indices.push(2);
            indices.push(3);

            this._indexBuffer = engine.createIndexBuffer(indices);
        }

        public _rebuild(): void {
            let vb  = this._vertexBuffers[VertexBuffer.PositionKind];

            if (vb) {
                vb._rebuild();
            }

            this._createIndexBuffer();
        }        

        /**
         * Creates the render target textures and post processes used in the highlight layer.
         */
        private createTextureAndPostProcesses(): void {
            var blurTextureWidth = this._mainTextureDesiredSize.width * this._options.blurTextureSizeRatio;
            var blurTextureHeight = this._mainTextureDesiredSize.height * this._options.blurTextureSizeRatio;
            blurTextureWidth = this._engine.needPOTTextures ? Tools.GetExponentOfTwo(blurTextureWidth, this._maxSize) : blurTextureWidth;
            blurTextureHeight = this._engine.needPOTTextures ? Tools.GetExponentOfTwo(blurTextureHeight, this._maxSize) : blurTextureHeight;

            this._mainTexture = new RenderTargetTexture("HighlightLayerMainRTT",
                {
                    width: this._mainTextureDesiredSize.width,
                    height: this._mainTextureDesiredSize.height
                },
                this._scene,
                false,
                true,
                Engine.TEXTURETYPE_UNSIGNED_INT);
            this._mainTexture.activeCamera = this._options.camera;
            this._mainTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._mainTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._mainTexture.anisotropicFilteringLevel = 1;
            this._mainTexture.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
            this._mainTexture.renderParticles = false;
            this._mainTexture.renderList = null;
            this._mainTexture.ignoreCameraViewport = true;

            this._blurTexture = new RenderTargetTexture("HighlightLayerBlurRTT",
                {
                    width: blurTextureWidth,
                    height: blurTextureHeight
                },
                this._scene,
                false,
                true,
                Engine.TEXTURETYPE_UNSIGNED_INT);
            this._blurTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._blurTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._blurTexture.anisotropicFilteringLevel = 16;
            this._blurTexture.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);
            this._blurTexture.renderParticles = false;
            this._blurTexture.ignoreCameraViewport = true;

            this._downSamplePostprocess = new PassPostProcess("HighlightLayerPPP", this._options.blurTextureSizeRatio,
                null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
            this._downSamplePostprocess.onApplyObservable.add(effect => {
                effect.setTexture("textureSampler", this._mainTexture);
            });

            if (this._options.alphaBlendingMode === Engine.ALPHA_COMBINE) {
                this._horizontalBlurPostprocess = new GlowBlurPostProcess("HighlightLayerHBP", new BABYLON.Vector2(1.0, 0), this._options.blurHorizontalSize, 1,
                    null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
                this._horizontalBlurPostprocess.onApplyObservable.add(effect => {
                    effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
                });

                this._verticalBlurPostprocess = new GlowBlurPostProcess("HighlightLayerVBP", new BABYLON.Vector2(0, 1.0), this._options.blurVerticalSize, 1,
                    null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
                this._verticalBlurPostprocess.onApplyObservable.add(effect => {
                    effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
                });
            }
            else {
                this._horizontalBlurPostprocess = new BlurPostProcess("HighlightLayerHBP", new BABYLON.Vector2(1.0, 0), this._options.blurHorizontalSize, 1,
                    null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
                this._horizontalBlurPostprocess.onApplyObservable.add(effect => {
                    effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
                });

                this._verticalBlurPostprocess = new BlurPostProcess("HighlightLayerVBP", new BABYLON.Vector2(0, 1.0), this._options.blurVerticalSize, 1,
                    null, Texture.BILINEAR_SAMPLINGMODE, this._scene.getEngine());
                this._verticalBlurPostprocess.onApplyObservable.add(effect => {
                    effect.setFloat2("screenSize", blurTextureWidth, blurTextureHeight);
                });
            }

            this._mainTexture.onAfterUnbindObservable.add(() => {
                this.onBeforeBlurObservable.notifyObservers(this);

                let internalTexture = this._blurTexture.getInternalTexture();

                if (internalTexture) {
                this._scene.postProcessManager.directRender(
                    [this._downSamplePostprocess, this._horizontalBlurPostprocess, this._verticalBlurPostprocess],
                    internalTexture, true);
                }

                this.onAfterBlurObservable.notifyObservers(this);
            });

            // Custom render function
            var renderSubMesh = (subMesh: SubMesh): void => {

                if (!this._meshes) {
                    return;
                }

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

                // Excluded Mesh
                if (this._excludedMeshes && this._excludedMeshes[mesh.uniqueId]) {
                    return;
                };

                var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);

                var highlightLayerMesh = this._meshes[mesh.uniqueId];
                var material = subMesh.getMaterial();
                var emissiveTexture: Nullable<Texture> = null;
                if (highlightLayerMesh && highlightLayerMesh.glowEmissiveOnly && material) {
                    emissiveTexture = (<any>material).emissiveTexture;
                }

                if (this.isReady(subMesh, hardwareInstancedRendering, emissiveTexture)) {
                    engine.enableEffect(this._glowMapGenerationEffect);
                    mesh._bind(subMesh, this._glowMapGenerationEffect, Material.TriangleFillMode);

                    this._glowMapGenerationEffect.setMatrix("viewProjection", scene.getTransformMatrix());
                    if (highlightLayerMesh) {
                        this._glowMapGenerationEffect.setFloat4("color",
                            highlightLayerMesh.color.r,
                            highlightLayerMesh.color.g,
                            highlightLayerMesh.color.b,
                            1.0);
                    }
                    else {
                        this._glowMapGenerationEffect.setFloat4("color",
                            HighlightLayer.neutralColor.r,
                            HighlightLayer.neutralColor.g,
                            HighlightLayer.neutralColor.b,
                            HighlightLayer.neutralColor.a);
                    }

                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        var alphaTexture = material.getAlphaTestTexture();
                        if (alphaTexture) {
                            this._glowMapGenerationEffect.setTexture("diffuseSampler", alphaTexture);
                            let textureMatrix = alphaTexture.getTextureMatrix();

                            if (textureMatrix) {
                                this._glowMapGenerationEffect.setMatrix("diffuseMatrix", textureMatrix);
                            }
                        }
                    }

                    // Glow emissive only
                    if (emissiveTexture) {
                        this._glowMapGenerationEffect.setTexture("emissiveSampler", emissiveTexture);
                        this._glowMapGenerationEffect.setMatrix("emissiveMatrix", emissiveTexture.getTextureMatrix());
                    }

                    // Bones
                    if (mesh.useBones && mesh.computeBonesUsingShaders) {
                        this._glowMapGenerationEffect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
                    }

                    // Draw
                    mesh._processRendering(subMesh, this._glowMapGenerationEffect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                        (isInstance, world) => this._glowMapGenerationEffect.setMatrix("world", world));
                } else {
                    // Need to reset refresh rate of the shadowMap
                    this._mainTexture.resetRefreshCounter();
                }
            };

            this._mainTexture.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
                this.onBeforeRenderMainTextureObservable.notifyObservers(this);

                var index: number;

                let engine = this._scene.getEngine();
                
                if (depthOnlySubMeshes.length) {
                    engine.setColorWrite(false);            
                    for (index = 0; index < depthOnlySubMeshes.length; index++) {
                        renderSubMesh(depthOnlySubMeshes.data[index]);
                    }
                    engine.setColorWrite(true);
                }                

                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }

                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }

                for (index = 0; index < transparentSubMeshes.length; index++) {
                    renderSubMesh(transparentSubMeshes.data[index]);
                }
            };

            this._mainTexture.onClearObservable.add((engine: Engine) => {
                engine.clear(HighlightLayer.neutralColor, true, true, true);
            });
        }

        /**
         * Checks for the readiness of the element composing the layer.
         * @param subMesh the mesh to check for
         * @param useInstances specify wether or not to use instances to render the mesh
         * @param emissiveTexture the associated emissive texture used to generate the glow
         * @return true if ready otherwise, false
         */
        private isReady(subMesh: SubMesh, useInstances: boolean, emissiveTexture: Nullable<Texture>): boolean {
            if (!subMesh.getMaterial().isReady(subMesh.getMesh(), useInstances)) {
                return false;
            }

            var defines = [];

            var attribs = [VertexBuffer.PositionKind];

            var mesh = subMesh.getMesh();
            var material = subMesh.getMaterial();
            var uv1 = false;
            var uv2 = false;

            // Alpha test
            if (material && material.needAlphaTesting()) {
                var alphaTexture = material.getAlphaTestTexture();
                if (alphaTexture) {
                    defines.push("#define ALPHATEST");
                    if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) &&
                        alphaTexture.coordinatesIndex === 1) {
                        defines.push("#define DIFFUSEUV2");
                        uv2 = true;
                    }
                    else if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                        defines.push("#define DIFFUSEUV1");
                        uv1 = true;
                    }
                }
            }

            // Emissive
            if (emissiveTexture) {
                defines.push("#define EMISSIVE");
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) &&
                    emissiveTexture.coordinatesIndex === 1) {
                    defines.push("#define EMISSIVEUV2");
                    uv2 = true;
                }
                else if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    defines.push("#define EMISSIVEUV1");
                    uv1 = true;
                }
            }

            if (uv1) {
                attribs.push(VertexBuffer.UVKind);
                defines.push("#define UV1");
            }
            if (uv2) {
                attribs.push(VertexBuffer.UV2Kind);
                defines.push("#define UV2");
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
                this._glowMapGenerationEffect = this._scene.getEngine().createEffect("glowMapGeneration",
                    attribs,
                    ["world", "mBones", "viewProjection", "diffuseMatrix", "color", "emissiveMatrix"],
                    ["diffuseSampler", "emissiveSampler"], join);
            }

            return this._glowMapGenerationEffect.isReady();
        }

        /**
         * Renders the glowing part of the scene by blending the blurred glowing meshes on top of the rendered scene.
         */
        public render(): void {
            var currentEffect = this._glowMapMergeEffect;

            // Check
            if (!currentEffect.isReady() || !this._blurTexture.isReady())
                return;

            var engine = this._scene.getEngine();

            this.onBeforeComposeObservable.notifyObservers(this);

            // Render
            engine.enableEffect(currentEffect);
            engine.setState(false);

            // Cache
            var previousStencilBuffer = engine.getStencilBuffer();
            var previousStencilFunction = engine.getStencilFunction();
            var previousStencilMask = engine.getStencilMask();
            var previousStencilOperationPass = engine.getStencilOperationPass();
            var previousStencilOperationFail = engine.getStencilOperationFail();
            var previousStencilOperationDepthFail = engine.getStencilOperationDepthFail();
            var previousAlphaMode = engine.getAlphaMode();

            // Texture
            currentEffect.setTexture("textureSampler", this._blurTexture);

            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, currentEffect);

            // Stencil operations
            engine.setStencilOperationPass(Engine.REPLACE);
            engine.setStencilOperationFail(Engine.KEEP);
            engine.setStencilOperationDepthFail(Engine.KEEP);

            // Draw order
            engine.setAlphaMode(this._options.alphaBlendingMode);
            engine.setStencilMask(0x00);
            engine.setStencilBuffer(true);
            engine.setStencilFunctionReference(this._instanceGlowingMeshStencilReference);

            if (this.outerGlow) {
                currentEffect.setFloat("offset", 0);
                engine.setStencilFunction(Engine.NOTEQUAL);
                engine.draw(true, 0, 6);
            }
            if (this.innerGlow) {
                currentEffect.setFloat("offset", 1);
                engine.setStencilFunction(Engine.EQUAL);
                engine.draw(true, 0, 6);
            }

            // Restore Cache
            engine.setStencilFunction(previousStencilFunction);
            engine.setStencilMask(previousStencilMask);
            engine.setAlphaMode(previousAlphaMode);
            engine.setStencilBuffer(previousStencilBuffer);
            engine.setStencilOperationPass(previousStencilOperationPass);
            engine.setStencilOperationFail(previousStencilOperationFail);
            engine.setStencilOperationDepthFail(previousStencilOperationDepthFail);

            (<any>engine)._stencilState.reset();

            this.onAfterComposeObservable.notifyObservers(this);

            // Handle size changes.
            var size = this._mainTexture.getSize();
            this.setMainTextureSize();
            if (size.width !== this._mainTextureDesiredSize.width || size.height !== this._mainTextureDesiredSize.height) {
                // Recreate RTT and post processes on size change.
                this.onSizeChangedObservable.notifyObservers(this);
                this.disposeTextureAndPostProcesses();
                this.createTextureAndPostProcesses();
            }
        }

        /**
         * Add a mesh in the exclusion list to prevent it to impact or being impacted by the highlight layer.
         * @param mesh The mesh to exclude from the highlight layer
         */
        public addExcludedMesh(mesh: Mesh) {
            if (!this._excludedMeshes) {
                return;
            }

            var meshExcluded = this._excludedMeshes[mesh.uniqueId];
            if (!meshExcluded) {
                this._excludedMeshes[mesh.uniqueId] = {
                    mesh: mesh,
                    beforeRender: mesh.onBeforeRenderObservable.add((mesh: Mesh) => {
                        mesh.getEngine().setStencilBuffer(false);
                    }),
                    afterRender: mesh.onAfterRenderObservable.add((mesh: Mesh) => {
                        mesh.getEngine().setStencilBuffer(true);
                    }),
                }
            }
        }

        /**
          * Remove a mesh from the exclusion list to let it impact or being impacted by the highlight layer.
          * @param mesh The mesh to highlight
          */
        public removeExcludedMesh(mesh: Mesh) {
            if (!this._excludedMeshes) {
                return;
            }

            var meshExcluded = this._excludedMeshes[mesh.uniqueId];
            if (meshExcluded) {
                if (meshExcluded.beforeRender) {
                    mesh.onBeforeRenderObservable.remove(meshExcluded.beforeRender);
                }

                if (meshExcluded.afterRender) {
                    mesh.onAfterRenderObservable.remove(meshExcluded.afterRender);
                }
            }

            this._excludedMeshes[mesh.uniqueId] = null;
        }

        /**
         * Add a mesh in the highlight layer in order to make it glow with the chosen color.
         * @param mesh The mesh to highlight
         * @param color The color of the highlight
         * @param glowEmissiveOnly Extract the glow from the emissive texture
         */
        public addMesh(mesh: Mesh, color: Color3, glowEmissiveOnly = false) {
            if (!this._meshes) {
                return;
            }

            var meshHighlight = this._meshes[mesh.uniqueId];
            if (meshHighlight) {
                meshHighlight.color = color;
            }
            else {
                this._meshes[mesh.uniqueId] = {
                    mesh: mesh,
                    color: color,
                    // Lambda required for capture due to Observable this context
                    observerHighlight: mesh.onBeforeRenderObservable.add((mesh: Mesh) => {
                        if (this._excludedMeshes && this._excludedMeshes[mesh.uniqueId]) {
                            this.defaultStencilReference(mesh);
                        }
                        else {
                            mesh.getScene().getEngine().setStencilFunctionReference(this._instanceGlowingMeshStencilReference);
                        }
                    }),
                    observerDefault: mesh.onAfterRenderObservable.add(this.defaultStencilReference),
                    glowEmissiveOnly: glowEmissiveOnly
                };
            }

            this._shouldRender = true;
        }

        /**
         * Remove a mesh from the highlight layer in order to make it stop glowing.
         * @param mesh The mesh to highlight
         */
        public removeMesh(mesh: Mesh) {
            if (!this._meshes) {
                return;
            }

            var meshHighlight = this._meshes[mesh.uniqueId];
            if (meshHighlight) {

                if (meshHighlight.observerHighlight) {
                    mesh.onBeforeRenderObservable.remove(meshHighlight.observerHighlight);
                }

                if (meshHighlight.observerDefault) {
                    mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
                }
            }

            this._meshes[mesh.uniqueId] = null;

            this._shouldRender = false;
            for (var meshHighlightToCheck in this._meshes) {
                if (meshHighlightToCheck) {
                    this._shouldRender = true;
                    break;
                }
            }
        }

        /**
         * Returns true if the layer contains information to display, otherwise false.
         */
        public shouldRender(): boolean {
            return this.isEnabled && this._shouldRender;
        }

        /**
         * Sets the main texture desired size which is the closest power of two
         * of the engine canvas size.
         */
        private setMainTextureSize(): void {
            if (this._options.mainTextureFixedSize) {
                this._mainTextureDesiredSize.width = this._options.mainTextureFixedSize;
                this._mainTextureDesiredSize.height = this._options.mainTextureFixedSize;
            }
            else {
                this._mainTextureDesiredSize.width = this._engine.getRenderWidth() * this._options.mainTextureRatio;
                this._mainTextureDesiredSize.height = this._engine.getRenderHeight() * this._options.mainTextureRatio;

                this._mainTextureDesiredSize.width = this._engine.needPOTTextures ? Tools.GetExponentOfTwo(this._mainTextureDesiredSize.width, this._maxSize) : this._mainTextureDesiredSize.width;
                this._mainTextureDesiredSize.height = this._engine.needPOTTextures ? Tools.GetExponentOfTwo(this._mainTextureDesiredSize.height, this._maxSize) : this._mainTextureDesiredSize.height;
            }
        }

        /**
         * Force the stencil to the normal expected value for none glowing parts
         */
        private defaultStencilReference(mesh: Mesh) {
            mesh.getScene().getEngine().setStencilFunctionReference(HighlightLayer.normalMeshStencilReference);
        }

        /**
         * Dispose only the render target textures and post process.
         */
        private disposeTextureAndPostProcesses(): void {
            this._blurTexture.dispose();
            this._mainTexture.dispose();

            this._downSamplePostprocess.dispose();
            this._horizontalBlurPostprocess.dispose();
            this._verticalBlurPostprocess.dispose();
        }

        /**
         * Dispose the highlight layer and free resources.
         */
        public dispose(): void {
            var vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
            if (vertexBuffer) {
                vertexBuffer.dispose();
                this._vertexBuffers[VertexBuffer.PositionKind] = null;
            }

            if (this._indexBuffer) {
                this._scene.getEngine()._releaseBuffer(this._indexBuffer);
                this._indexBuffer = null;
            }

            // Clean textures and post processes
            this.disposeTextureAndPostProcesses();

            if (this._meshes) {
                // Clean mesh references 
                for (let id in this._meshes) {
                    let meshHighlight = this._meshes[id];
                    if (meshHighlight && meshHighlight.mesh) {

                        if (meshHighlight.observerHighlight) {
                            meshHighlight.mesh.onBeforeRenderObservable.remove(meshHighlight.observerHighlight);
                        }

                        if (meshHighlight.observerDefault) {
                            meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.observerDefault);
                        }
                    }
                }
                this._meshes = null;
            }

            if (this._excludedMeshes) {
                for (let id in this._excludedMeshes) {
                    let meshHighlight = this._excludedMeshes[id];
                    if (meshHighlight) {

                        if (meshHighlight.beforeRender) {
                            meshHighlight.mesh.onBeforeRenderObservable.remove(meshHighlight.beforeRender);
                        }

                        if (meshHighlight.afterRender) {
                            meshHighlight.mesh.onAfterRenderObservable.remove(meshHighlight.afterRender);
                        }
                    }
                }
                this._excludedMeshes = null;
            }

            // Remove from scene
            var index = this._scene.highlightLayers.indexOf(this, 0);
            if (index > -1) {
                this._scene.highlightLayers.splice(index, 1);
            }

            // Callback
            this.onDisposeObservable.notifyObservers(this);

            this.onDisposeObservable.clear();
            this.onBeforeRenderMainTextureObservable.clear();
            this.onBeforeBlurObservable.clear();
            this.onBeforeComposeObservable.clear();
            this.onAfterComposeObservable.clear();
            this.onSizeChangedObservable.clear();
        }
    }
} 