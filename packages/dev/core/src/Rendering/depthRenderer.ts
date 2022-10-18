import type { Nullable } from "../types";
import { Color4 } from "../Maths/math.color";
import type { Mesh } from "../Meshes/mesh";
import type { SubMesh } from "../Meshes/subMesh";
import { VertexBuffer } from "../Buffers/buffer";
import type { SmartArray } from "../Misc/smartArray";
import type { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { MaterialHelper } from "../Materials/materialHelper";
import { Camera } from "../Cameras/camera";
import { Constants } from "../Engines/constants";

import "../Shaders/depth.fragment";
import "../Shaders/depth.vertex";
import { _WarnImport } from "../Misc/devTools";

declare type Material = import("../Materials/material").Material;
declare type AbstractMesh = import("../Meshes/abstractMesh").AbstractMesh;

/**
 * This represents a depth renderer in Babylon.
 * A depth renderer will render to it's depth map every frame which can be displayed or used in post processing
 */
export class DepthRenderer {
    private _scene: Scene;
    private _depthMap: RenderTargetTexture;
    private readonly _storeNonLinearDepth: boolean;
    private readonly _clearColor: Color4;

    /** Get if the depth renderer is using packed depth or not */
    public readonly isPacked: boolean;

    private _camera: Nullable<Camera>;

    /** Enable or disable the depth renderer. When disabled, the depth texture is not updated */
    public enabled = true;

    /** Force writing the transparent objects into the depth map */
    public forceDepthWriteTransparentMeshes = false;

    /**
     * Specifies that the depth renderer will only be used within
     * the camera it is created for.
     * This can help forcing its rendering during the camera processing.
     */
    public useOnlyInActiveCamera: boolean = false;

    /**
     * @internal
     */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _WarnImport("DepthRendererSceneComponent");
    };

    /**
     * Sets a specific material to be used to render a mesh/a list of meshes by the depth renderer
     * @param mesh mesh or array of meshes
     * @param material material to use by the depth render when rendering the mesh(es). If undefined is passed, the specific material created by the depth renderer will be used.
     */
    public setMaterialForRendering(mesh: AbstractMesh | AbstractMesh[], material?: Material): void {
        this._depthMap.setMaterialForRendering(mesh, material);
    }

    /**
     * Instantiates a depth renderer
     * @param scene The scene the renderer belongs to
     * @param type The texture type of the depth map (default: Engine.TEXTURETYPE_FLOAT)
     * @param camera The camera to be used to render the depth map (default: scene's active camera)
     * @param storeNonLinearDepth Defines whether the depth is stored linearly like in Babylon Shadows or directly like glFragCoord.z
     * @param samplingMode The sampling mode to be used with the render target (Linear, Nearest...)
     */
    constructor(
        scene: Scene,
        type: number = Constants.TEXTURETYPE_FLOAT,
        camera: Nullable<Camera> = null,
        storeNonLinearDepth = false,
        samplingMode = Texture.TRILINEAR_SAMPLINGMODE
    ) {
        this._scene = scene;
        this._storeNonLinearDepth = storeNonLinearDepth;
        this.isPacked = type === Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (this.isPacked) {
            this._clearColor = new Color4(1.0, 1.0, 1.0, 1.0);
        } else {
            this._clearColor = new Color4(1.0, 0.0, 0.0, 1.0);
        }

        DepthRenderer._SceneComponentInitialization(this._scene);

        const engine = scene.getEngine();

        this._camera = camera;

        if (samplingMode !== Texture.NEAREST_SAMPLINGMODE) {
            if (type === Constants.TEXTURETYPE_FLOAT && !engine._caps.textureFloatLinearFiltering) {
                samplingMode = Texture.NEAREST_SAMPLINGMODE;
            }
            if (type === Constants.TEXTURETYPE_HALF_FLOAT && !engine._caps.textureHalfFloatLinearFiltering) {
                samplingMode = Texture.NEAREST_SAMPLINGMODE;
            }
        }

        // Render target
        const format = this.isPacked || !engine._features.supportExtendedTextureFormats ? Constants.TEXTUREFORMAT_RGBA : Constants.TEXTUREFORMAT_R;
        this._depthMap = new RenderTargetTexture(
            "DepthRenderer",
            { width: engine.getRenderWidth(), height: engine.getRenderHeight() },
            this._scene,
            false,
            true,
            type,
            false,
            samplingMode,
            undefined,
            undefined,
            undefined,
            format
        );
        this._depthMap.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._depthMap.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._depthMap.refreshRate = 1;
        this._depthMap.renderParticles = false;
        this._depthMap.renderList = null;

        // Camera to get depth map from to support multiple concurrent cameras
        this._depthMap.activeCamera = this._camera;
        this._depthMap.ignoreCameraViewport = true;
        this._depthMap.useCameraPostProcesses = false;

        // set default depth value to 1.0 (far away)
        this._depthMap.onClearObservable.add((engine) => {
            engine.clear(this._clearColor, true, true, true);
        });

        this._depthMap.onBeforeBindObservable.add(() => {
            engine._debugPushGroup?.("depth renderer", 1);
        });

        this._depthMap.onAfterUnbindObservable.add(() => {
            engine._debugPopGroup?.(1);
        });

        this._depthMap.customIsReadyFunction = (mesh: AbstractMesh, refreshRate: number, preWarm?: boolean) => {
            if ((preWarm || refreshRate === 0) && mesh.subMeshes) {
                for (let i = 0; i < mesh.subMeshes.length; ++i) {
                    const subMesh = mesh.subMeshes[i];
                    const renderingMesh = subMesh.getRenderingMesh();

                    const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());
                    const hardwareInstancedRendering =
                        engine.getCaps().instancedArrays &&
                        ((batch.visibleInstances[subMesh._id] !== null && batch.visibleInstances[subMesh._id] !== undefined) || renderingMesh.hasThinInstances);

                    if (!this.isReady(subMesh, hardwareInstancedRendering)) {
                        return false;
                    }
                }
            }

            return true;
        };

        // Custom render function
        const renderSubMesh = (subMesh: SubMesh): void => {
            const renderingMesh = subMesh.getRenderingMesh();
            const effectiveMesh = subMesh.getEffectiveMesh();
            const scene = this._scene;
            const engine = scene.getEngine();
            const material = subMesh.getMaterial();

            effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;

            if (!material || effectiveMesh.infiniteDistance || material.disableDepthWrite || subMesh.verticesCount === 0 || subMesh._renderId === scene.getRenderId()) {
                return;
            }

            // Culling
            const detNeg = effectiveMesh._getWorldMatrixDeterminant() < 0;
            let sideOrientation = renderingMesh.overrideMaterialSideOrientation ?? material.sideOrientation;
            if (detNeg) {
                sideOrientation =
                    sideOrientation === Constants.MATERIAL_ClockWiseSideOrientation
                        ? Constants.MATERIAL_CounterClockWiseSideOrientation
                        : Constants.MATERIAL_ClockWiseSideOrientation;
            }
            const reverseSideOrientation = sideOrientation === Constants.MATERIAL_ClockWiseSideOrientation;

            engine.setState(material.backFaceCulling, 0, false, reverseSideOrientation, material.cullBackFaces);

            // Managing instances
            const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());

            if (batch.mustReturn) {
                return;
            }

            const hardwareInstancedRendering =
                engine.getCaps().instancedArrays &&
                ((batch.visibleInstances[subMesh._id] !== null && batch.visibleInstances[subMesh._id] !== undefined) || renderingMesh.hasThinInstances);

            const camera = this._camera || scene.activeCamera;
            if (this.isReady(subMesh, hardwareInstancedRendering) && camera) {
                subMesh._renderId = scene.getRenderId();

                const renderingMaterial = effectiveMesh._internalAbstractMeshDataInfo._materialForRenderPass?.[engine.currentRenderPassId];

                let drawWrapper = subMesh._getDrawWrapper();
                if (!drawWrapper && renderingMaterial) {
                    drawWrapper = renderingMaterial._getDrawWrapper();
                }
                const cameraIsOrtho = camera.mode === Camera.ORTHOGRAPHIC_CAMERA;

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
                    effect.setMatrix("world", effectiveMesh.getWorldMatrix());
                } else {
                    renderingMaterial.bindForSubMesh(effectiveMesh.getWorldMatrix(), effectiveMesh as Mesh, subMesh);
                }

                let minZ: number, maxZ: number;

                if (cameraIsOrtho) {
                    minZ = !engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
                    maxZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : 1;
                } else {
                    minZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? camera.minZ : engine.isNDCHalfZRange ? 0 : camera.minZ;
                    maxZ = engine.useReverseDepthBuffer && engine.isNDCHalfZRange ? 0 : camera.maxZ;
                }

                effect.setFloat2("depthValues", minZ, minZ + maxZ);

                if (!renderingMaterial) {
                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        const alphaTexture = material.getAlphaTestTexture();

                        if (alphaTexture) {
                            effect.setTexture("diffuseSampler", alphaTexture);
                            effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                        }
                    }

                    // Bones
                    if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
                        const skeleton = renderingMesh.skeleton;

                        if (skeleton.isUsingTextureForMatrices) {
                            const boneTexture = skeleton.getTransformMatrixTexture(renderingMesh);
                            if (!boneTexture) {
                                return;
                            }

                            effect.setTexture("boneSampler", boneTexture);
                            effect.setFloat("boneTextureWidth", 4.0 * (skeleton.bones.length + 1));
                        } else {
                            effect.setMatrices("mBones", skeleton.getTransformMatrices(renderingMesh));
                        }
                    }

                    // Clip planes
                    MaterialHelper.BindClipPlane(effect, scene);

                    // Morph targets
                    MaterialHelper.BindMorphTargetParameters(renderingMesh, effect);
                    if (renderingMesh.morphTargetManager && renderingMesh.morphTargetManager.isUsingTextureForTargets) {
                        renderingMesh.morphTargetManager._bind(effect);
                    }
                }

                // Draw
                renderingMesh._processRendering(effectiveMesh, subMesh, effect, material.fillMode, batch, hardwareInstancedRendering, (isInstance, world) =>
                    effect.setMatrix("world", world)
                );
            }
        };

        this._depthMap.customRenderFunction = (
            opaqueSubMeshes: SmartArray<SubMesh>,
            alphaTestSubMeshes: SmartArray<SubMesh>,
            transparentSubMeshes: SmartArray<SubMesh>,
            depthOnlySubMeshes: SmartArray<SubMesh>
        ): void => {
            let index;

            if (depthOnlySubMeshes.length) {
                for (index = 0; index < depthOnlySubMeshes.length; index++) {
                    renderSubMesh(depthOnlySubMeshes.data[index]);
                }
            }

            for (index = 0; index < opaqueSubMeshes.length; index++) {
                renderSubMesh(opaqueSubMeshes.data[index]);
            }

            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                renderSubMesh(alphaTestSubMeshes.data[index]);
            }

            if (this.forceDepthWriteTransparentMeshes) {
                for (index = 0; index < transparentSubMeshes.length; index++) {
                    renderSubMesh(transparentSubMeshes.data[index]);
                }
            } else {
                for (index = 0; index < transparentSubMeshes.length; index++) {
                    transparentSubMeshes.data[index].getEffectiveMesh()._internalAbstractMeshDataInfo._isActiveIntermediate = false;
                }
            }
        };
    }

    /**
     * Creates the depth rendering effect and checks if the effect is ready.
     * @param subMesh The submesh to be used to render the depth map of
     * @param useInstances If multiple world instances should be used
     * @returns if the depth renderer is ready to render the depth map
     */
    public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        const engine = this._scene.getEngine();
        const mesh = subMesh.getMesh();
        const scene = mesh.getScene();

        const renderingMaterial = mesh._internalAbstractMeshDataInfo._materialForRenderPass?.[engine.currentRenderPassId];

        if (renderingMaterial) {
            return renderingMaterial.isReadyForSubMesh(mesh, subMesh, useInstances);
        }

        const material = subMesh.getMaterial();
        if (!material || material.disableDepthWrite) {
            return false;
        }

        const defines = [];

        const attribs = [VertexBuffer.PositionKind];

        // Alpha test
        if (material && material.needAlphaTesting() && material.getAlphaTestTexture()) {
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
        if (mesh.useBones && mesh.computeBonesUsingShaders) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }
            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            defines.push("#define BonesPerMesh " + (mesh.skeleton ? mesh.skeleton.bones.length + 1 : 0));

            const skeleton = subMesh.getRenderingMesh().skeleton;

            if (skeleton?.isUsingTextureForMatrices) {
                defines.push("#define BONETEXTURE");
            }
        } else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
        }

        // Morph targets
        const morphTargetManager = (mesh as Mesh).morphTargetManager;
        let numMorphInfluencers = 0;
        if (morphTargetManager) {
            if (morphTargetManager.numInfluencers > 0) {
                numMorphInfluencers = morphTargetManager.numInfluencers;

                defines.push("#define MORPHTARGETS");
                defines.push("#define NUM_MORPH_INFLUENCERS " + numMorphInfluencers);

                if (morphTargetManager.isUsingTextureForTargets) {
                    defines.push("#define MORPHTARGETS_TEXTURE");
                }

                MaterialHelper.PrepareAttributesForMorphTargetsInfluencers(attribs, mesh, numMorphInfluencers);
            }
        }

        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            MaterialHelper.PushAttributesForInstances(attribs);
            if (subMesh.getRenderingMesh().hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }

        // None linear depth
        if (this._storeNonLinearDepth) {
            defines.push("#define NONLINEARDEPTH");
        }

        // Float Mode
        if (this.isPacked) {
            defines.push("#define PACKED");
        }

        // Clip planes
        if (scene.clipPlane) {
            defines.push("#define CLIPPLANE");
        }

        if (scene.clipPlane2) {
            defines.push("#define CLIPPLANE2");
        }

        if (scene.clipPlane3) {
            defines.push("#define CLIPPLANE3");
        }

        if (scene.clipPlane4) {
            defines.push("#define CLIPPLANE4");
        }

        if (scene.clipPlane5) {
            defines.push("#define CLIPPLANE5");
        }

        if (scene.clipPlane6) {
            defines.push("#define CLIPPLANE6");
        }

        // Get correct effect
        const drawWrapper = subMesh._getDrawWrapper(undefined, true)!;
        const cachedDefines = drawWrapper.defines;
        const join = defines.join("\n");
        if (cachedDefines !== join) {
            drawWrapper.setEffect(
                engine.createEffect(
                    "depth",
                    attribs,
                    [
                        "world",
                        "mBones",
                        "boneTextureWidth",
                        "viewProjection",
                        "diffuseMatrix",
                        "depthValues",
                        "morphTargetInfluences",
                        "morphTargetTextureInfo",
                        "morphTargetTextureIndices",
                        "vClipPlane",
                        "vClipPlane2",
                        "vClipPlane3",
                        "vClipPlane4",
                        "vClipPlane5",
                        "vClipPlane6",
                    ],
                    ["diffuseSampler", "morphTargets", "boneSampler"],
                    join,
                    undefined,
                    undefined,
                    undefined,
                    { maxSimultaneousMorphTargets: numMorphInfluencers }
                ),
                join
            );
        }

        return drawWrapper.effect!.isReady();
    }

    /**
     * Gets the texture which the depth map will be written to.
     * @returns The depth map texture
     */
    public getDepthMap(): RenderTargetTexture {
        return this._depthMap;
    }

    /**
     * Disposes of the depth renderer.
     */
    public dispose(): void {
        const keysToDelete = [];
        for (const key in this._scene._depthRenderer) {
            const depthRenderer = this._scene._depthRenderer[key];
            if (depthRenderer === this) {
                keysToDelete.push(key);
            }
        }

        if (keysToDelete.length > 0) {
            this._depthMap.dispose();

            for (const key of keysToDelete) {
                delete this._scene._depthRenderer[key];
            }
        }
    }
}
