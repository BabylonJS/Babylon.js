import { Nullable } from "../types";
import { Color4 } from "../Maths/math.color";
import { Mesh } from "../Meshes/mesh";
import { SubMesh } from "../Meshes/subMesh";
import { VertexBuffer } from "../Meshes/buffer";
import { SmartArray } from "../Misc/smartArray";
import { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Effect } from "../Materials/effect";
import { MaterialHelper } from "../Materials/materialHelper";
import { Camera } from "../Cameras/camera";
import { Constants } from "../Engines/constants";

import "../Shaders/depth.fragment";
import "../Shaders/depth.vertex";
import { _DevTools } from '../Misc/devTools';

/**
 * This represents a depth renderer in Babylon.
 * A depth renderer will render to it's depth map every frame which can be displayed or used in post processing
 */
export class DepthRenderer {
    private _scene: Scene;
    private _depthMap: RenderTargetTexture;
    private _effect: Effect;
    private readonly _storeNonLinearDepth: boolean;
    private readonly _clearColor: Color4;

    /** Get if the depth renderer is using packed depth or not */
    public readonly isPacked: boolean;

    private _cachedDefines: string;
    private _camera: Nullable<Camera>;

    /** Enable or disable the depth renderer. When disabled, the depth texture is not updated */
    public enabled = true;

    /**
     * Specifiess that the depth renderer will only be used within
     * the camera it is created for.
     * This can help forcing its rendering during the camera processing.
     */
    public useOnlyInActiveCamera: boolean = false;

    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _DevTools.WarnImport("DepthRendererSceneComponent");
    }

    /**
     * Instantiates a depth renderer
     * @param scene The scene the renderer belongs to
     * @param type The texture type of the depth map (default: Engine.TEXTURETYPE_FLOAT)
     * @param camera The camera to be used to render the depth map (default: scene's active camera)
     * @param storeNonLinearDepth Defines whether the depth is stored linearly like in Babylon Shadows or directly like glFragCoord.z
     */
    constructor(scene: Scene, type: number = Constants.TEXTURETYPE_FLOAT, camera: Nullable<Camera> = null, storeNonLinearDepth = false) {
        this._scene = scene;
        this._storeNonLinearDepth = storeNonLinearDepth;
        this.isPacked = type === Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (this.isPacked) {
            this._clearColor = new Color4(1.0, 1.0, 1.0, 1.0);
        }
        else {
            this._clearColor = new Color4(1.0, 0.0, 0.0, 1.0);
        }

        DepthRenderer._SceneComponentInitialization(this._scene);

        this._camera = camera;
        var engine = scene.getEngine();

        // Render target
        var format = (this.isPacked || engine.webGLVersion === 1) ? Constants.TEXTUREFORMAT_RGBA : Constants.TEXTUREFORMAT_R;
        this._depthMap = new RenderTargetTexture("depthMap", { width: engine.getRenderWidth(), height: engine.getRenderHeight() }, this._scene, false, true, type,
            false, undefined, undefined, undefined, undefined,
            format);
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

        // Custom render function
        var renderSubMesh = (subMesh: SubMesh): void => {
            var renderingMesh = subMesh.getRenderingMesh();
            var effectiveMesh = subMesh.getEffectiveMesh();
            var scene = this._scene;
            var engine = scene.getEngine();
            let material = subMesh.getMaterial();

            effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;

            if (!material) {
                return;
            }

            // Culling and reverse (right handed system)
            engine.setState(material.backFaceCulling, 0, false, scene.useRightHandedSystem);

            // Managing instances
            var batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());

            if (batch.mustReturn) {
                return;
            }

            var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null || renderingMesh.hasThinInstances);

            var camera = this._camera || scene.activeCamera;
            if (this.isReady(subMesh, hardwareInstancedRendering) && camera) {
                engine.enableEffect(this._effect);
                renderingMesh._bind(subMesh, this._effect, material.fillMode);

                this._effect.setMatrix("viewProjection", scene.getTransformMatrix());

                this._effect.setFloat2("depthValues", camera.minZ, camera.minZ + camera.maxZ);

                // Alpha test
                if (material && material.needAlphaTesting()) {
                    var alphaTexture = material.getAlphaTestTexture();

                    if (alphaTexture) {
                        this._effect.setTexture("diffuseSampler", alphaTexture);
                        this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }
                }

                // Bones
                if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
                    this._effect.setMatrices("mBones", renderingMesh.skeleton.getTransformMatrices(renderingMesh));
                }

                // Morph targets
                MaterialHelper.BindMorphTargetParameters(renderingMesh, this._effect);

                // Draw
                renderingMesh._processRendering(effectiveMesh, subMesh, this._effect, material.fillMode, batch, hardwareInstancedRendering,
                    (isInstance, world) => this._effect.setMatrix("world", world));
            }
        };

        this._depthMap.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
            var index;

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
        };
    }

    /**
     * Creates the depth rendering effect and checks if the effect is ready.
     * @param subMesh The submesh to be used to render the depth map of
     * @param useInstances If multiple world instances should be used
     * @returns if the depth renderer is ready to render the depth map
     */
    public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        var material: any = subMesh.getMaterial();
        if (material.disableDepthWrite) {
            return false;
        }

        var defines = [];

        var attribs = [VertexBuffer.PositionKind];

        var mesh = subMesh.getMesh();

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

        // Get correct effect
        var join = defines.join("\n");
        if (this._cachedDefines !== join) {
            this._cachedDefines = join;
            this._effect = this._scene.getEngine().createEffect("depth",
                attribs,
                ["world", "mBones", "viewProjection", "diffuseMatrix", "depthValues", "morphTargetInfluences"],
                ["diffuseSampler"], join,
                undefined, undefined, undefined, { maxSimultaneousMorphTargets: numMorphInfluencers });
        }

        return this._effect.isReady();
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
        this._depthMap.dispose();
    }
}
