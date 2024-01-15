import { serializeAsVector3, serialize, serializeAsMeshReference } from "../Misc/decorators";
import type { SmartArray } from "../Misc/smartArray";
import { Logger } from "../Misc/logger";
import { Vector2, Vector3, Matrix } from "../Maths/math.vector";
import { VertexBuffer } from "../Buffers/buffer";
import { AbstractMesh } from "../Meshes/abstractMesh";
import type { SubMesh } from "../Meshes/subMesh";
import type { Mesh } from "../Meshes/mesh";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { MaterialHelper } from "../Materials/materialHelper";
import { StandardMaterial } from "../Materials/standardMaterial";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { PostProcess } from "./postProcess";
import { Constants } from "../Engines/constants";
import type { Scene } from "../scene";

import { CreatePlane } from "../Meshes/Builders/planeBuilder";

import "../Shaders/depth.vertex";
import "../Shaders/volumetricLightScattering.fragment";
import "../Shaders/volumetricLightScatteringPass.vertex";
import "../Shaders/volumetricLightScatteringPass.fragment";
import { Color4, Color3 } from "../Maths/math.color";
import { Viewport } from "../Maths/math.viewport";
import { RegisterClass } from "../Misc/typeStore";
import type { Nullable } from "../types";

import type { Engine } from "../Engines/engine";

/**
 *  Inspired by https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process
 */
export class VolumetricLightScatteringPostProcess extends PostProcess {
    // Members
    private _volumetricLightScatteringRTT: RenderTargetTexture;
    private _viewPort: Viewport;
    private _screenCoordinates: Vector2 = Vector2.Zero();

    /**
     * If not undefined, the mesh position is computed from the attached node position
     */
    public attachedNode: { position: Vector3 };

    /**
     * Custom position of the mesh. Used if "useCustomMeshPosition" is set to "true"
     */
    @serializeAsVector3()
    public customMeshPosition: Vector3 = Vector3.Zero();

    /**
     * Set if the post-process should use a custom position for the light source (true) or the internal mesh position (false)
     */
    @serialize()
    public useCustomMeshPosition: boolean = false;

    /**
     * If the post-process should inverse the light scattering direction
     */
    @serialize()
    public invert: boolean = true;

    /**
     * The internal mesh used by the post-process
     */
    @serializeAsMeshReference()
    public mesh: Mesh;

    /**
     * @internal
     * VolumetricLightScatteringPostProcess.useDiffuseColor is no longer used, use the mesh material directly instead
     */
    public get useDiffuseColor(): boolean {
        Logger.Warn("VolumetricLightScatteringPostProcess.useDiffuseColor is no longer used, use the mesh material directly instead");
        return false;
    }

    public set useDiffuseColor(useDiffuseColor: boolean) {
        Logger.Warn("VolumetricLightScatteringPostProcess.useDiffuseColor is no longer used, use the mesh material directly instead");
    }

    /**
     * Array containing the excluded meshes not rendered in the internal pass
     */
    @serialize()
    public excludedMeshes: AbstractMesh[] = [];

    /**
     * Array containing the only meshes rendered in the internal pass.
     * If this array is not empty, only the meshes from this array are rendered in the internal pass
     */
    @serialize()
    public includedMeshes: AbstractMesh[] = [];

    /**
     * Controls the overall intensity of the post-process
     */
    @serialize()
    public exposure = 0.3;

    /**
     * Dissipates each sample's contribution in range [0, 1]
     */
    @serialize()
    public decay = 0.96815;

    /**
     * Controls the overall intensity of each sample
     */
    @serialize()
    public weight = 0.58767;

    /**
     * Controls the density of each sample
     */
    @serialize()
    public density = 0.926;

    /**
     * @constructor
     * @param name The post-process name
     * @param ratio The size of the post-process and/or internal pass (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
     * @param camera The camera that the post-process will be attached to
     * @param mesh The mesh used to create the light scattering
     * @param samples The post-process quality, default 100
     * @param samplingMode The post-process filtering mode
     * @param engine The babylon engine
     * @param reusable If the post-process is reusable
     * @param scene The constructor needs a scene reference to initialize internal components. If "camera" is null a "scene" must be provided
     */
    constructor(
        name: string,
        ratio: any,
        camera: Nullable<Camera>,
        mesh?: Mesh,
        samples: number = 100,
        samplingMode: number = Texture.BILINEAR_SAMPLINGMODE,
        engine?: Engine,
        reusable?: boolean,
        scene?: Scene
    ) {
        super(
            name,
            "volumetricLightScattering",
            ["decay", "exposure", "weight", "meshPositionOnScreen", "density"],
            ["lightScatteringSampler"],
            ratio.postProcessRatio || ratio,
            camera,
            samplingMode,
            engine,
            reusable,
            "#define NUM_SAMPLES " + samples
        );
        scene = camera?.getScene() ?? scene ?? this._scene; // parameter "scene" can be null.

        engine = scene.getEngine();
        this._viewPort = new Viewport(0, 0, 1, 1).toGlobal(engine.getRenderWidth(), engine.getRenderHeight());

        // Configure mesh
        this.mesh = mesh ?? VolumetricLightScatteringPostProcess.CreateDefaultMesh("VolumetricLightScatteringMesh", scene);

        // Configure
        this._createPass(scene, ratio.passRatio || ratio);

        this.onActivate = (camera: Camera) => {
            if (!this.isSupported) {
                this.dispose(camera);
            }

            this.onActivate = null;
        };

        this.onApplyObservable.add((effect: Effect) => {
            this._updateMeshScreenCoordinates(<Scene>scene);

            effect.setTexture("lightScatteringSampler", this._volumetricLightScatteringRTT);
            effect.setFloat("exposure", this.exposure);
            effect.setFloat("decay", this.decay);
            effect.setFloat("weight", this.weight);
            effect.setFloat("density", this.density);
            effect.setVector2("meshPositionOnScreen", this._screenCoordinates);
        });
    }

    /**
     * Returns the string "VolumetricLightScatteringPostProcess"
     * @returns "VolumetricLightScatteringPostProcess"
     */
    public getClassName(): string {
        return "VolumetricLightScatteringPostProcess";
    }

    private _isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        const mesh = subMesh.getMesh();

        // Render this.mesh as default
        if (mesh === this.mesh && mesh.material) {
            return mesh.material.isReady(mesh);
        }

        const renderingMaterial = mesh._internalAbstractMeshDataInfo._materialForRenderPass?.[this._scene.getEngine().currentRenderPassId];

        if (renderingMaterial) {
            return renderingMaterial.isReadyForSubMesh(mesh, subMesh, useInstances);
        }

        const defines = [];
        const attribs = [VertexBuffer.PositionKind];
        const material: any = subMesh.getMaterial();

        // Alpha test
        if (material) {
            if (material.needAlphaTesting()) {
                defines.push("#define ALPHATEST");
            }

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
            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
            defines.push("#define BonesPerMesh " + (mesh.skeleton ? mesh.skeleton.bones.length + 1 : 0));
        } else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
        }

        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            MaterialHelper.PushAttributesForInstances(attribs);
            if (subMesh.getRenderingMesh().hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }

        // Get correct effect
        const drawWrapper = subMesh._getDrawWrapper(undefined, true)!;
        const cachedDefines = drawWrapper.defines;
        const join = defines.join("\n");
        if (cachedDefines !== join) {
            drawWrapper.setEffect(
                mesh
                    .getScene()
                    .getEngine()
                    .createEffect(
                        "volumetricLightScatteringPass",
                        attribs,
                        ["world", "mBones", "viewProjection", "diffuseMatrix"],
                        ["diffuseSampler"],
                        join,
                        undefined,
                        undefined,
                        undefined,
                        { maxSimultaneousMorphTargets: mesh.numBoneInfluencers }
                    ),
                join
            );
        }

        return drawWrapper.effect!.isReady();
    }

    /**
     * Sets the new light position for light scattering effect
     * @param position The new custom light position
     */
    public setCustomMeshPosition(position: Vector3): void {
        this.customMeshPosition = position;
    }

    /**
     * Returns the light position for light scattering effect
     * @returns Vector3 The custom light position
     */
    public getCustomMeshPosition(): Vector3 {
        return this.customMeshPosition;
    }

    /**
     * Disposes the internal assets and detaches the post-process from the camera
     * @param camera The camera from which to detach the post-process
     */
    public dispose(camera: Camera): void {
        const rttIndex = camera.getScene().customRenderTargets.indexOf(this._volumetricLightScatteringRTT);
        if (rttIndex !== -1) {
            camera.getScene().customRenderTargets.splice(rttIndex, 1);
        }

        this._volumetricLightScatteringRTT.dispose();
        super.dispose(camera);
    }

    /**
     * Returns the render target texture used by the post-process
     * @returns the render target texture used by the post-process
     */
    public getPass(): RenderTargetTexture {
        return this._volumetricLightScatteringRTT;
    }

    // Private methods
    private _meshExcluded(mesh: AbstractMesh) {
        if ((this.includedMeshes.length > 0 && this.includedMeshes.indexOf(mesh) === -1) || (this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(mesh) !== -1)) {
            return true;
        }

        return false;
    }

    private _createPass(scene: Scene, ratio: number): void {
        const engine = scene.getEngine();

        this._volumetricLightScatteringRTT = new RenderTargetTexture(
            "volumetricLightScatteringMap",
            { width: engine.getRenderWidth() * ratio, height: engine.getRenderHeight() * ratio },
            scene,
            false,
            true,
            Constants.TEXTURETYPE_UNSIGNED_INT
        );
        this._volumetricLightScatteringRTT.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._volumetricLightScatteringRTT.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._volumetricLightScatteringRTT.renderList = null;
        this._volumetricLightScatteringRTT.renderParticles = false;
        this._volumetricLightScatteringRTT.ignoreCameraViewport = true;

        const camera = this.getCamera();
        if (camera) {
            camera.customRenderTargets.push(this._volumetricLightScatteringRTT);
        } else {
            scene.customRenderTargets.push(this._volumetricLightScatteringRTT);
        }

        // Custom render function for submeshes
        const renderSubMesh = (subMesh: SubMesh): void => {
            const renderingMesh = subMesh.getRenderingMesh();
            const effectiveMesh = subMesh.getEffectiveMesh();
            if (this._meshExcluded(renderingMesh)) {
                return;
            }

            effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;

            const material = subMesh.getMaterial();

            if (!material) {
                return;
            }

            const scene = renderingMesh.getScene();
            const engine = scene.getEngine();

            // Culling
            engine.setState(material.backFaceCulling, undefined, undefined, undefined, material.cullBackFaces);

            // Managing instances
            const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());

            if (batch.mustReturn) {
                return;
            }

            const hardwareInstancedRendering = engine.getCaps().instancedArrays && (batch.visibleInstances[subMesh._id] !== null || renderingMesh.hasThinInstances);

            if (this._isReady(subMesh, hardwareInstancedRendering)) {
                const renderingMaterial = effectiveMesh._internalAbstractMeshDataInfo._materialForRenderPass?.[engine.currentRenderPassId];

                let drawWrapper = subMesh._getDrawWrapper();
                if (renderingMesh === this.mesh && !drawWrapper) {
                    drawWrapper = material._getDrawWrapper();
                }

                if (!drawWrapper) {
                    return;
                }

                const effect = drawWrapper.effect!;

                engine.enableEffect(drawWrapper);
                if (!hardwareInstancedRendering) {
                    renderingMesh._bind(subMesh, effect, material.fillMode);
                }

                if (renderingMesh === this.mesh) {
                    material.bind(effectiveMesh.getWorldMatrix(), renderingMesh);
                } else if (renderingMaterial) {
                    renderingMaterial.bindForSubMesh(effectiveMesh.getWorldMatrix(), effectiveMesh as Mesh, subMesh);
                } else {
                    effect.setMatrix("viewProjection", scene.getTransformMatrix());

                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        const alphaTexture = material.getAlphaTestTexture();

                        effect.setTexture("diffuseSampler", alphaTexture);

                        if (alphaTexture) {
                            effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                        }
                    }

                    // Bones
                    if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
                        effect.setMatrices("mBones", renderingMesh.skeleton.getTransformMatrices(renderingMesh));
                    }
                }

                if (hardwareInstancedRendering && renderingMesh.hasThinInstances) {
                    effect.setMatrix("world", effectiveMesh.getWorldMatrix());
                }

                // Draw
                renderingMesh._processRendering(effectiveMesh, subMesh, effect, Material.TriangleFillMode, batch, hardwareInstancedRendering, (isInstance, world) => {
                    if (!isInstance) {
                        effect.setMatrix("world", world);
                    }
                });
            }
        };

        // Render target texture callbacks
        let savedSceneClearColor: Color4;
        const sceneClearColor = new Color4(0.0, 0.0, 0.0, 1.0);

        this._volumetricLightScatteringRTT.onBeforeRenderObservable.add((): void => {
            savedSceneClearColor = scene.clearColor;
            scene.clearColor = sceneClearColor;
        });

        this._volumetricLightScatteringRTT.onAfterRenderObservable.add((): void => {
            scene.clearColor = savedSceneClearColor;
        });

        this._volumetricLightScatteringRTT.customIsReadyFunction = (mesh: AbstractMesh, refreshRate: number, preWarm?: boolean) => {
            if ((preWarm || refreshRate === 0) && mesh.subMeshes) {
                for (let i = 0; i < mesh.subMeshes.length; ++i) {
                    const subMesh = mesh.subMeshes[i];
                    const material = subMesh.getMaterial();
                    const renderingMesh = subMesh.getRenderingMesh();

                    if (!material) {
                        continue;
                    }

                    const batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());
                    const hardwareInstancedRendering = engine.getCaps().instancedArrays && (batch.visibleInstances[subMesh._id] !== null || renderingMesh.hasThinInstances);

                    if (!this._isReady(subMesh, hardwareInstancedRendering)) {
                        return false;
                    }
                }
            }

            return true;
        };

        this._volumetricLightScatteringRTT.customRenderFunction = (
            opaqueSubMeshes: SmartArray<SubMesh>,
            alphaTestSubMeshes: SmartArray<SubMesh>,
            transparentSubMeshes: SmartArray<SubMesh>,
            depthOnlySubMeshes: SmartArray<SubMesh>
        ): void => {
            const engine = scene.getEngine();
            let index: number;

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

            if (transparentSubMeshes.length) {
                // Sort sub meshes
                for (index = 0; index < transparentSubMeshes.length; index++) {
                    const submesh = transparentSubMeshes.data[index];
                    const boundingInfo = submesh.getBoundingInfo();

                    if (boundingInfo && scene.activeCamera) {
                        submesh._alphaIndex = submesh.getMesh().alphaIndex;
                        submesh._distanceToCamera = boundingInfo.boundingSphere.centerWorld.subtract(scene.activeCamera.position).length();
                    }
                }

                const sortedArray = transparentSubMeshes.data.slice(0, transparentSubMeshes.length);
                sortedArray.sort((a, b) => {
                    // Alpha index first
                    if (a._alphaIndex > b._alphaIndex) {
                        return 1;
                    }
                    if (a._alphaIndex < b._alphaIndex) {
                        return -1;
                    }

                    // Then distance to camera
                    if (a._distanceToCamera < b._distanceToCamera) {
                        return 1;
                    }
                    if (a._distanceToCamera > b._distanceToCamera) {
                        return -1;
                    }

                    return 0;
                });

                // Render sub meshes
                engine.setAlphaMode(Constants.ALPHA_COMBINE);
                for (index = 0; index < sortedArray.length; index++) {
                    renderSubMesh(sortedArray[index]);
                }
                engine.setAlphaMode(Constants.ALPHA_DISABLE);
            }
        };
    }

    private _updateMeshScreenCoordinates(scene: Scene): void {
        const transform = scene.getTransformMatrix();
        let meshPosition: Vector3;

        if (this.useCustomMeshPosition) {
            meshPosition = this.customMeshPosition;
        } else if (this.attachedNode) {
            meshPosition = this.attachedNode.position;
        } else {
            meshPosition = this.mesh.parent ? this.mesh.getAbsolutePosition() : this.mesh.position;
        }

        const pos = Vector3.Project(meshPosition, Matrix.Identity(), transform, this._viewPort);

        this._screenCoordinates.x = pos.x / this._viewPort.width;
        this._screenCoordinates.y = pos.y / this._viewPort.height;

        if (this.invert) {
            this._screenCoordinates.y = 1.0 - this._screenCoordinates.y;
        }
    }

    // Static methods
    /**
     * Creates a default mesh for the Volumeric Light Scattering post-process
     * @param name The mesh name
     * @param scene The scene where to create the mesh
     * @returns the default mesh
     */
    public static CreateDefaultMesh(name: string, scene: Scene): Mesh {
        const mesh = CreatePlane(name, { size: 1 }, scene);
        mesh.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;

        const material = new StandardMaterial(name + "Material", scene);
        material.emissiveColor = new Color3(1, 1, 1);

        mesh.material = material;

        return mesh;
    }
}

RegisterClass("BABYLON.VolumetricLightScatteringPostProcess", VolumetricLightScatteringPostProcess);
