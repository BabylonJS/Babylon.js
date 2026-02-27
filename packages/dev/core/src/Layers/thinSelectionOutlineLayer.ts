import { VertexBuffer } from "../Buffers/buffer";
import { Camera } from "../Cameras/camera";
import { Constants } from "../Engines/constants";
import type { ThinEngine } from "../Engines/thinEngine";
import { AddClipPlaneUniforms, BindClipPlane, PrepareStringDefinesForClipPlanes } from "../Materials/clipPlaneMaterialHelper";
import type { Effect, IEffectCreationOptions } from "../Materials/effect";
import { EffectFallbacks } from "../Materials/effectFallbacks";
import { Material } from "../Materials/material";
import { BindBonesParameters, BindMorphTargetParameters, PrepareDefinesAndAttributesForMorphTargets, PushAttributesForInstances } from "../Materials/materialHelper.functions";
import { ShaderLanguage } from "../Materials/shaderLanguage";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import { Color3, Color4 } from "../Maths/math.color";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { InstancedMesh } from "../Meshes/instancedMesh";
import type { Mesh } from "../Meshes/mesh";
import type { SubMesh } from "../Meshes/subMesh";
import type { Scene } from "../scene";
import type { Nullable } from "../types";
import type { IThinEffectLayerOptions } from "./thinEffectLayer";
import { ThinEffectLayer } from "./thinEffectLayer";

/**
 * Selection outline layer options. This helps customizing the behaviour
 * of the selection outline layer.
 */
export interface IThinSelectionOutlineLayerOptions extends IThinEffectLayerOptions {
    /**
     * Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    forceGLSL?: boolean;

    /**
     * Specifies whether the depth stored is the Z coordinate in camera space.
     */
    storeCameraSpaceZ?: boolean;

    /**
     * Outline method to use (default: Constants.OUTLINELAYER_SAMPLING_TRIDIRECTIONAL)
     *
     * @see {@link Constants.OUTLINELAYER_SAMPLING_TRIDIRECTIONAL}
     */
    outlineMethod?: number;
}

/**
 * @internal
 */
export class ThinSelectionOutlineLayer extends ThinEffectLayer {
    /**
     * Effect Name of the layer.
     */
    public static readonly EffectName = "SelectionOutlineLayer";

    /**
     * Name of the instance selection ID attribute
     * @internal
     */
    public static readonly InstanceSelectionIdAttributeName = "instanceSelectionId";

    /**
     * The outline color
     */
    public outlineColor: Color3 = new Color3(1, 0.5, 0);

    /**
     * The thickness of the edges
     */
    public outlineThickness: number = 2.0;

    /**
     * The strength of the occlusion effect (default: 0.8)
     */
    public occlusionStrength: number = 0.8;

    /**
     * The occlusion threshold (default: 0.0001)
     */
    public occlusionThreshold: number = 0.0001;

    /**
     * The width of the source texture
     */
    public textureWidth: number = 0;

    /**
     * The height of the source texture
     */
    public textureHeight: number = 0;

    /** @internal */
    public override _options: Required<IThinSelectionOutlineLayerOptions>;

    /** @internal */
    public readonly _meshUniqueIdToSelectionId: number[] = [];
    /** @internal */
    public _selection: Nullable<AbstractMesh[]> = [];
    private _nextSelectionId = 1;

    /**
     * Instantiates a new selection outline Layer and references it to the scene..
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param options Sets of none mandatory options to use with the layer (see IThinSelectionOutlineLayerOptions for more information)
     * @param dontCheckIfReady Specifies if the layer should disable checking whether all the post processes are ready (default: false). To save performance, this should be set to true and you should call `isReady` manually before rendering to the layer.
     */
    public constructor(name: string, scene?: Scene, options?: Partial<IThinSelectionOutlineLayerOptions>, dontCheckIfReady = false) {
        super(name, scene, options !== undefined ? !!options.forceGLSL : false);

        // Adapt options
        this._options = {
            mainTextureRatio: 1.0,
            mainTextureFixedSize: 0,
            alphaBlendingMode: Constants.ALPHA_COMBINE,
            camera: null,
            renderingGroupId: -1,
            forceGLSL: false,
            mainTextureType: Constants.TEXTURETYPE_FLOAT,
            mainTextureFormat: Constants.TEXTUREFORMAT_RG,
            storeCameraSpaceZ: false,
            outlineMethod: Constants.OUTLINELAYER_SAMPLING_TRIDIRECTIONAL,
            ...options,
        };

        // set clear color
        this.neutralColor = new Color4(0.0, this._options.storeCameraSpaceZ ? 0.0 : 1.0, 0.0, 1.0);

        // Initialize the layer
        this._init(this._options);

        // Do not render as long as no meshes have been added
        this._shouldRender = false;

        if (dontCheckIfReady) {
            // When dontCheckIfReady is true, we are in the new ThinXXX layer mode, so we must call _createTextureAndPostProcesses ourselves (it is called by EffectLayer otherwise)
            this._createTextureAndPostProcesses();
        }
    }

    /**
     * Gets the class name of the effect layer
     * @returns the string with the class name of the effect layer
     */
    public getClassName(): string {
        return "SelectionOutlineLayer";
    }

    /** @internal */
    public override _internalIsSubMeshReady(subMesh: SubMesh, useInstances: boolean, _emissiveTexture: Nullable<BaseTexture>): boolean {
        const engine = this._scene.getEngine();
        const mesh = subMesh.getMesh();

        const renderingMaterial = mesh._internalAbstractMeshDataInfo._materialForRenderPass?.[engine.currentRenderPassId];

        if (renderingMaterial) {
            return renderingMaterial.isReadyForSubMesh(mesh, subMesh, useInstances);
        }

        const material = subMesh.getMaterial();

        if (!material) {
            return false;
        }

        // selection outline layer is not compatible with custom materials
        // if (this._useMeshMaterial(subMesh.getRenderingMesh())) {
        //     return material.isReadyForSubMesh(subMesh.getMesh(), subMesh, useInstances);
        // }

        const defines: string[] = [];

        const attribs = [VertexBuffer.PositionKind];

        let uv1 = false;
        let uv2 = false;
        const color = false;

        // Alpha test
        if (material.needAlphaTestingForMesh(mesh)) {
            defines.push("#define ALPHATEST");
            if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                attribs.push(VertexBuffer.UVKind);
                defines.push("#define UV1");
                uv1 = true;
            }
            if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                attribs.push(VertexBuffer.UV2Kind);
                defines.push("#define UV2");
                uv2 = true;
            }
        }

        // Bones
        const fallbacks = new EffectFallbacks();
        if (mesh.useBones && mesh.computeBonesUsingShaders) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }

            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);

            const skeleton = mesh.skeleton;
            if (skeleton && skeleton.isUsingTextureForMatrices) {
                defines.push("#define BONETEXTURE");
            } else {
                defines.push("#define BonesPerMesh " + (skeleton ? skeleton.bones.length + 1 : 0));
            }

            if (mesh.numBoneInfluencers > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }
        } else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
        }

        // Morph targets
        const numMorphInfluencers = mesh.morphTargetManager
            ? PrepareDefinesAndAttributesForMorphTargets(
                  mesh.morphTargetManager,
                  defines,
                  attribs,
                  mesh,
                  true, // usePositionMorph
                  false, // useNormalMorph
                  false, // useTangentMorph
                  uv1, // useUVMorph
                  uv2, // useUV2Morph
                  color // useColorMorph
              )
            : 0;

        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            PushAttributesForInstances(attribs);
            if (subMesh.getRenderingMesh().hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }

        // Baked vertex animations
        const bvaManager = mesh.bakedVertexAnimationManager;
        if (bvaManager && bvaManager.isEnabled) {
            defines.push("#define BAKED_VERTEX_ANIMATION_TEXTURE");
            if (useInstances) {
                attribs.push("bakedVertexAnimationSettingsInstanced");
            }
        }

        // ClipPlanes
        PrepareStringDefinesForClipPlanes(material, this._scene, defines);

        // Selection ID
        if (useInstances) {
            attribs.push(ThinSelectionOutlineLayer.InstanceSelectionIdAttributeName);
        }

        this._addCustomEffectDefines(defines);

        // Get correct effect
        const drawWrapper = subMesh._getDrawWrapper(undefined, true)!;
        const cachedDefines = drawWrapper.defines as string;
        const join = defines.join("\n");
        if (cachedDefines !== join) {
            const uniforms = [
                "world",
                "mBones",
                "viewProjection",
                "view",
                "morphTargetInfluences",
                "morphTargetCount",
                "boneTextureWidth",
                "diffuseMatrix",
                "morphTargetTextureInfo",
                "morphTargetTextureIndices",
                "bakedVertexAnimationSettings",
                "bakedVertexAnimationTextureSizeInverted",
                "bakedVertexAnimationTime",
                "bakedVertexAnimationTexture",
                "depthValues",
                "selectionId",
            ];

            AddClipPlaneUniforms(uniforms);

            drawWrapper.setEffect(
                this._engine.createEffect(
                    "selection",
                    <IEffectCreationOptions>{
                        attributes: attribs,
                        uniformsNames: uniforms,
                        uniformBuffersNames: [],
                        samplers: ["diffuseSampler", "boneSampler", "morphTargets", "bakedVertexAnimationTexture"],
                        defines: join,
                        fallbacks: fallbacks,
                        onCompiled: null,
                        onError: null,
                        indexParameters: { maxSimultaneousMorphTargets: numMorphInfluencers },
                        shaderLanguage: this._shaderLanguage,
                        extraInitializationsAsync: this._shadersLoaded
                            ? undefined
                            : async () => {
                                  await this._importShadersAsync();
                                  this._shadersLoaded = true;
                              },
                    },
                    this._engine
                ),
                join
            );
        }

        const effectIsReady = drawWrapper.effect!.isReady();

        return effectIsReady && (this._dontCheckIfReady || (!this._dontCheckIfReady && this.isLayerReady()));
    }

    protected override async _importShadersAsync(): Promise<void> {
        if (this._shaderLanguage === ShaderLanguage.WGSL) {
            await Promise.all([
                import("../ShadersWGSL/selection.vertex"),
                import("../ShadersWGSL/selection.fragment"),
                import("../ShadersWGSL/glowMapMerge.vertex"),
                import("../ShadersWGSL/selectionOutline.fragment"),
            ]);
        } else {
            await Promise.all([
                import("../Shaders/selection.vertex"),
                import("../Shaders/selection.fragment"),
                import("../Shaders/glowMapMerge.vertex"),
                import("../Shaders/selectionOutline.fragment"),
            ]);
        }

        await super._importShadersAsync();
    }

    /**
     * Get the effect name of the layer.
     * @returns The effect name
     */
    public override getEffectName(): string {
        return ThinSelectionOutlineLayer.EffectName;
    }

    /** @internal */
    public override _createMergeEffect(): Effect {
        const defines: string[] = [];
        switch (this._options.outlineMethod) {
            case Constants.OUTLINELAYER_SAMPLING_TRIDIRECTIONAL:
                defines.push("#define OUTLINELAYER_SAMPLING_TRIDIRECTIONAL");
                break;
            case Constants.OUTLINELAYER_SAMPLING_OCTADIRECTIONAL:
                defines.push("#define OUTLINELAYER_SAMPLING_OCTADIRECTIONAL");
                break;
        }
        const join = defines.join("\n");

        return this._engine.createEffect(
            {
                // glowMapMerge vertex is just a basic vertex shader for drawing a quad. so we reuse it here
                vertex: "glowMapMerge",
                // selection outline fragment does computation of outline with alpha channel for blending
                fragment: "selectionOutline",
            },
            <IEffectCreationOptions>{
                attributes: [VertexBuffer.PositionKind],
                uniformsNames: ["screenSize", "outlineColor", "outlineThickness", "occlusionStrength", "occlusionThreshold"],
                samplers: ["maskSampler", "depthSampler"],
                defines: join,
                fallbacks: null,
                onCompiled: null,
                onError: null,
                shaderLanguage: this._shaderLanguage,
                extraInitializationsAsync: this._shadersLoaded
                    ? undefined
                    : async () => {
                          await this._importShadersAsync();
                          this._shadersLoaded = true;
                      },
            },
            this._engine
        );
    }

    /** @internal */
    public override _createTextureAndPostProcesses(): void {
        // we don't need to create a texture for this layer. since all computation is done in the merge effect
    }

    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @returns true if ready otherwise, false
     */
    public override isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        const material = subMesh.getMaterial();
        const mesh = subMesh.getRenderingMesh();

        if (!material || !mesh || !this._selection) {
            return false;
        }

        return super._isSubMeshReady(subMesh, useInstances, null);
    }

    /** @internal */
    public override _canRenderMesh(_mesh: AbstractMesh, _material: Material): boolean {
        return true;
    }

    protected override _renderSubMesh(subMesh: SubMesh, enableAlphaMode: boolean = false): void {
        if (!this._internalShouldRender()) {
            return;
        }

        const material = subMesh.getMaterial();
        const ownerMesh = subMesh.getMesh();
        const replacementMesh = subMesh.getReplacementMesh();
        const renderingMesh = subMesh.getRenderingMesh();
        const effectiveMesh = subMesh.getEffectiveMesh();
        const scene = this._scene;
        const engine = scene.getEngine();

        effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;

        if (!material) {
            return;
        }

        // Do not block in blend mode.
        if (!this._canRenderMesh(renderingMesh, material)) {
            return;
        }

        // Culling
        let sideOrientation = material._getEffectiveOrientation(renderingMesh);
        const mainDeterminant = effectiveMesh._getWorldMatrixDeterminant();
        if (mainDeterminant < 0) {
            sideOrientation = sideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
        }

        const reverse = sideOrientation === Material.ClockWiseSideOrientation;
        engine.setState(material.backFaceCulling, material.zOffset, undefined, reverse, material.cullBackFaces, undefined, material.zOffsetUnits);

        // Managing instances
        const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!replacementMesh);
        if (batch.mustReturn) {
            return;
        }

        // Early Exit per mesh
        if (!this._shouldRenderMesh(renderingMesh)) {
            return;
        }

        const hardwareInstancedRendering = batch.hardwareInstancedRendering[subMesh._id] || renderingMesh.hasThinInstances || !!renderingMesh._userInstancedBuffersStorage;

        this._setEmissiveTextureAndColor(renderingMesh, subMesh, material);

        this.onBeforeRenderMeshToEffect.notifyObservers(ownerMesh);

        // selection outline layer is not compatible with custom materials
        // if (this._useMeshMaterial(renderingMesh)) {
        //     subMesh.getMaterial()!._glowModeEnabled = true;
        //     renderingMesh.render(subMesh, enableAlphaMode, replacementMesh || undefined);
        //     subMesh.getMaterial()!._glowModeEnabled = false;
        // } else
        if (this._isSubMeshReady(subMesh, hardwareInstancedRendering, this._emissiveTextureAndColor.texture)) {
            const renderingMaterial = effectiveMesh._internalAbstractMeshDataInfo._materialForRenderPass?.[engine.currentRenderPassId];

            let drawWrapper = subMesh._getDrawWrapper();
            if (!drawWrapper && renderingMaterial) {
                drawWrapper = renderingMaterial._getDrawWrapper();
            }

            if (!drawWrapper) {
                return;
            }

            const effect = drawWrapper.effect!;

            engine.enableEffect(drawWrapper);
            if (!hardwareInstancedRendering) {
                renderingMesh._bind(subMesh, effect, material.fillMode);
            }

            if (!renderingMaterial) {
                effect.setMatrix("viewProjection", scene.getTransformMatrix());
                if (this._options.storeCameraSpaceZ) {
                    effect.setMatrix("view", scene.getViewMatrix());
                } else {
                    const camera = this.camera || scene.activeCamera;
                    if (camera) {
                        const cameraIsOrtho = camera.mode === Camera.ORTHOGRAPHIC_CAMERA;

                        let minZ: number, maxZ: number;

                        if (cameraIsOrtho) {
                            minZ = !engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
                            maxZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
                        } else {
                            minZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? camera.minZ : engine.isNDCHalfZRange ? 0 : camera.minZ;
                            maxZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : camera.maxZ;
                        }

                        effect.setFloat2("depthValues", minZ, minZ + maxZ);
                    }
                }
                effect.setMatrix("world", effectiveMesh.getWorldMatrix());
            } else {
                renderingMaterial.bindForSubMesh(effectiveMesh.getWorldMatrix(), effectiveMesh as Mesh, subMesh);
            }

            if (!renderingMaterial) {
                // Alpha test
                if (material && material.needAlphaTestingForMesh(effectiveMesh)) {
                    const alphaTexture = material.getAlphaTestTexture();
                    if (alphaTexture) {
                        effect.setTexture("diffuseSampler", alphaTexture);
                        effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }
                }

                // Bones
                BindBonesParameters(renderingMesh, effect);

                // Morph targets
                BindMorphTargetParameters(renderingMesh, effect);
                if (renderingMesh.morphTargetManager && renderingMesh.morphTargetManager.isUsingTextureForTargets) {
                    renderingMesh.morphTargetManager._bind(effect);
                }

                // Baked vertex animations
                const bvaManager = subMesh.getMesh().bakedVertexAnimationManager;
                if (bvaManager && bvaManager.isEnabled) {
                    bvaManager.bind(effect, hardwareInstancedRendering);
                }

                // Alpha mode
                if (enableAlphaMode) {
                    engine.setAlphaMode(material.alphaMode);
                }

                // Clip planes
                BindClipPlane(effect, material, scene);

                // Selection ID
                const selectionId = this._meshUniqueIdToSelectionId[renderingMesh.uniqueId];
                if (!renderingMesh.hasInstances && !renderingMesh.hasThinInstances && !renderingMesh.isAnInstance && selectionId !== undefined) {
                    effect.setFloat("selectionId", selectionId);
                }
            }

            // Draw
            renderingMesh._processRendering(effectiveMesh, subMesh, effect, material.fillMode, batch, hardwareInstancedRendering, (isInstance, world) =>
                effect.setMatrix("world", world)
            );
        } else {
            // Need to reset refresh rate of the main map
            this._objectRenderer.resetRefreshCounter();
        }

        this.onAfterRenderMeshToEffect.notifyObservers(ownerMesh);
    }

    /** @internal */
    public override _internalCompose(effect: Effect, _renderIndex: number): void {
        // Texture
        this.bindTexturesForCompose(effect);
        effect.setFloat2("screenSize", this.textureWidth, this.textureHeight);
        effect.setColor3("outlineColor", this.outlineColor);
        effect.setFloat("outlineThickness", this.outlineThickness);
        effect.setFloat("occlusionStrength", this.occlusionStrength);
        effect.setFloat("occlusionThreshold", this.occlusionThreshold);

        // Cache
        const engine = this._engine;
        const previousStencilBuffer = engine.getStencilBuffer();

        // Draw order
        engine.setStencilBuffer(false);

        engine.drawElementsType(Material.TriangleFillMode, 0, 6);

        // Draw order
        engine.setStencilBuffer(previousStencilBuffer);
    }

    /** @internal */
    public override _setEmissiveTextureAndColor(_mesh: Mesh, _subMesh: SubMesh, _material: Material): void {
        // we don't use emissive texture or color for this layer
    }

    /**
     * Returns true if the layer contains information to display, otherwise false.
     * @returns true if the glow layer should be rendered
     */
    public override shouldRender(): boolean {
        return this._selection && super.shouldRender() ? true : false;
    }

    /** @internal */
    public override _shouldRenderMesh(mesh: Mesh): boolean {
        return this.hasMesh(mesh);
    }

    /** @internal */
    public override _addCustomEffectDefines(defines: string[]): void {
        if (this._options.storeCameraSpaceZ) {
            defines.push("#define STORE_CAMERASPACE_Z");
        }
    }

    /**
     * Determine if a given mesh will be used in the current effect.
     * @param mesh mesh to test
     * @returns true if the mesh will be used
     */
    public override hasMesh(mesh: AbstractMesh): boolean {
        // we control selection as RTT render list
        return super.hasMesh(mesh);
    }

    /** @internal */
    public override _useMeshMaterial(_mesh: AbstractMesh): boolean {
        return false;
    }

    /**
     * Remove all the meshes currently referenced in the selection outline layer
     */
    public clearSelection(): void {
        if (!this._selection) {
            return;
        }

        for (let index = 0; index < this._selection.length; ++index) {
            const mesh = this._selection[index] as Mesh;
            if (mesh._userInstancedBuffersStorage) {
                const kind = ThinSelectionOutlineLayer.InstanceSelectionIdAttributeName;
                mesh._userInstancedBuffersStorage.vertexBuffers[kind]?.dispose();

                const vao = mesh._userInstancedBuffersStorage.vertexArrayObjects?.[kind];
                if (vao) {
                    // invalidate VAO is very important to keep sync between VAO and vertex buffers
                    (this._engine as ThinEngine).releaseVertexArrayObject(vao);
                    delete mesh._userInstancedBuffersStorage.vertexArrayObjects![kind];
                }

                delete mesh._userInstancedBuffersStorage.data[kind];
                delete mesh._userInstancedBuffersStorage.vertexBuffers[kind];
                delete mesh._userInstancedBuffersStorage.strides[kind];
                delete mesh._userInstancedBuffersStorage.sizes[kind];

                if (Object.keys(mesh._userInstancedBuffersStorage.vertexBuffers).length === 0) {
                    mesh._userInstancedBuffersStorage = undefined!;
                }
            }
            if (mesh.instancedBuffers?.[ThinSelectionOutlineLayer.InstanceSelectionIdAttributeName] !== undefined) {
                delete mesh.instancedBuffers[ThinSelectionOutlineLayer.InstanceSelectionIdAttributeName];
            }
        }
        this._selection.length = 0;
        this._meshUniqueIdToSelectionId.length = 0;

        this._nextSelectionId = 1;

        this._shouldRender = false;
    }

    /**
     * Adds mesh or group of mesh to the current selection
     *
     * If a group of meshes is provided, they will outline as a single unit
     * @param meshOrGroup Meshes to add to the selection
     */
    public addSelection(meshOrGroup: AbstractMesh | AbstractMesh[]): void {
        if (!this._selection) {
            return;
        }

        const nextId = this._nextSelectionId;

        const group = Array.isArray(meshOrGroup) ? meshOrGroup : [meshOrGroup];
        if (group.length === 0) {
            return;
        }

        for (let meshIndex = 0; meshIndex < group.length; ++meshIndex) {
            const mesh = group[meshIndex];

            this._selection.push(mesh); // add to render list

            if (mesh.hasInstances || mesh.isAnInstance) {
                const sourceMesh = (mesh as InstancedMesh).sourceMesh ?? (mesh as Mesh);

                if (sourceMesh.instancedBuffers?.[ThinSelectionOutlineLayer.InstanceSelectionIdAttributeName] === undefined) {
                    sourceMesh.registerInstancedBuffer(ThinSelectionOutlineLayer.InstanceSelectionIdAttributeName, 1);
                }

                mesh.instancedBuffers[ThinSelectionOutlineLayer.InstanceSelectionIdAttributeName] = nextId;
            } else if (mesh.hasThinInstances) {
                const thinInstanceCount = (mesh as Mesh).thinInstanceCount;
                const selectionIdData = new Float32Array(thinInstanceCount);
                for (let i = 0; i < thinInstanceCount; i++) {
                    selectionIdData[i] = nextId;
                }
                (mesh as Mesh).thinInstanceSetBuffer(ThinSelectionOutlineLayer.InstanceSelectionIdAttributeName, selectionIdData, 1);
            } else {
                this._meshUniqueIdToSelectionId[mesh.uniqueId] = nextId;
            }
        }
        this._nextSelectionId += 1;

        this._shouldRender = true;
    }

    /**
     * Free any resources and references associated to a mesh.
     * Internal use
     * @param mesh The mesh to free.
     * @internal
     */
    public _disposeMesh(mesh: Mesh): void {
        const selection = this._selection;
        if (!selection) {
            return;
        }

        const index = selection.indexOf(mesh);
        if (index !== -1) {
            selection.splice(index, 1);

            if (mesh.hasInstances) {
                mesh.removeVerticesData(ThinSelectionOutlineLayer.InstanceSelectionIdAttributeName);
            } else if (mesh.hasThinInstances) {
                (mesh as Mesh).thinInstanceSetBuffer(ThinSelectionOutlineLayer.InstanceSelectionIdAttributeName, null);
            }

            if (selection.length === 0) {
                this._shouldRender = false;
            }
        }
    }

    /**
     * Dispose the effect layer and free resources.
     */
    public override dispose(): void {
        this.clearSelection();
        this._selection = null;

        super.dispose();
    }
}
