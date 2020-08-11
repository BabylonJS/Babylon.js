import { serializeAsVector3, serialize, serializeAsMeshReference } from "../Misc/decorators";
import { SmartArray } from "../Misc/smartArray";
import { Logger } from "../Misc/logger";
import { Vector2, Vector3, Matrix } from "../Maths/math.vector";
import { VertexBuffer } from "../Meshes/buffer";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { SubMesh } from "../Meshes/subMesh";
import { Mesh } from "../Meshes/mesh";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { MaterialHelper } from "../Materials/materialHelper";
import { StandardMaterial } from "../Materials/standardMaterial";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { PostProcess } from "./postProcess";
import { Constants } from "../Engines/constants";
import { Scene } from "../scene";

import "../Meshes/Builders/planeBuilder";

import "../Shaders/depth.vertex";
import "../Shaders/volumetricLightScattering.fragment";
import "../Shaders/volumetricLightScatteringPass.vertex";
import "../Shaders/volumetricLightScatteringPass.fragment";
import { Color4, Color3 } from '../Maths/math.color';
import { Viewport } from '../Maths/math.viewport';

declare type Engine = import("../Engines/engine").Engine;

/**
 *  Inspired by http://http.developer.nvidia.com/GPUGems3/gpugems3_ch13.html
 */
export class VolumetricLightScatteringPostProcess extends PostProcess {
    // Members
    private _volumetricLightScatteringPass: Effect;
    private _volumetricLightScatteringRTT: RenderTargetTexture;
    private _viewPort: Viewport;
    private _screenCoordinates: Vector2 = Vector2.Zero();
    private _cachedDefines: string;

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
     * @hidden
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
    public excludedMeshes = new Array<AbstractMesh>();

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
     * @param samplingModeThe post-process filtering mode
     * @param engine The babylon engine
     * @param reusable If the post-process is reusable
     * @param scene The constructor needs a scene reference to initialize internal components. If "camera" is null a "scene" must be provided
     */
    constructor(name: string, ratio: any, camera: Camera, mesh?: Mesh, samples: number = 100, samplingMode: number = Texture.BILINEAR_SAMPLINGMODE, engine?: Engine, reusable?: boolean, scene?: Scene) {
        super(name, "volumetricLightScattering", ["decay", "exposure", "weight", "meshPositionOnScreen", "density"], ["lightScatteringSampler"], ratio.postProcessRatio || ratio, camera, samplingMode, engine, reusable, "#define NUM_SAMPLES " + samples);
        scene = <Scene>((camera === null) ? scene : camera.getScene()); // parameter "scene" can be null.

        engine = scene.getEngine();
        this._viewPort = new Viewport(0, 0, 1, 1).toGlobal(engine.getRenderWidth(), engine.getRenderHeight());

        // Configure mesh
        this.mesh = (<Mesh>((mesh !== null) ? mesh : VolumetricLightScatteringPostProcess.CreateDefaultMesh("VolumetricLightScatteringMesh", scene)));

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
        var mesh = subMesh.getMesh();

        // Render this.mesh as default
        if (mesh === this.mesh && mesh.material) {
            return mesh.material.isReady(mesh);
        }

        var defines = [];
        var attribs = [VertexBuffer.PositionKind];
        var material: any = subMesh.getMaterial();

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
            defines.push("#define BonesPerMesh " + (mesh.skeleton ? (mesh.skeleton.bones.length + 1) : 0));
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
        var join = defines.join("\n");
        if (this._cachedDefines !== join) {
            this._cachedDefines = join;
            this._volumetricLightScatteringPass = mesh.getScene().getEngine().createEffect(
                "volumetricLightScatteringPass",
                attribs,
                ["world", "mBones", "viewProjection", "diffuseMatrix"],
                ["diffuseSampler"],
                join,
                undefined, undefined, undefined,
                { maxSimultaneousMorphTargets: mesh.numBoneInfluencers }
            );
        }

        return this._volumetricLightScatteringPass.isReady();
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
     * @return Vector3 The custom light position
     */
    public getCustomMeshPosition(): Vector3 {
        return this.customMeshPosition;
    }

    /**
     * Disposes the internal assets and detaches the post-process from the camera
     */
    public dispose(camera: Camera): void {
        var rttIndex = camera.getScene().customRenderTargets.indexOf(this._volumetricLightScatteringRTT);
        if (rttIndex !== -1) {
            camera.getScene().customRenderTargets.splice(rttIndex, 1);
        }

        this._volumetricLightScatteringRTT.dispose();
        super.dispose(camera);
    }

    /**
     * Returns the render target texture used by the post-process
     * @return the render target texture used by the post-process
     */
    public getPass(): RenderTargetTexture {
        return this._volumetricLightScatteringRTT;
    }

    // Private methods
    private _meshExcluded(mesh: AbstractMesh) {
        if (this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(mesh) !== -1) {
            return true;
        }

        return false;
    }

    private _createPass(scene: Scene, ratio: number): void {
        var engine = scene.getEngine();

        this._volumetricLightScatteringRTT = new RenderTargetTexture("volumetricLightScatteringMap", { width: engine.getRenderWidth() * ratio, height: engine.getRenderHeight() * ratio }, scene, false, true, Constants.TEXTURETYPE_UNSIGNED_INT);
        this._volumetricLightScatteringRTT.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._volumetricLightScatteringRTT.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._volumetricLightScatteringRTT.renderList = null;
        this._volumetricLightScatteringRTT.renderParticles = false;
        this._volumetricLightScatteringRTT.ignoreCameraViewport = true;

        var camera = this.getCamera();
        if (camera) {
            camera.customRenderTargets.push(this._volumetricLightScatteringRTT);
        } else {
            scene.customRenderTargets.push(this._volumetricLightScatteringRTT);
        }

        // Custom render function for submeshes
        var renderSubMesh = (subMesh: SubMesh): void => {
            var renderingMesh = subMesh.getRenderingMesh();
            var effectiveMesh = subMesh.getEffectiveMesh();
            if (this._meshExcluded(renderingMesh)) {
                return;
            }

            effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;

            let material = subMesh.getMaterial();

            if (!material) {
                return;
            }

            var scene = renderingMesh.getScene();
            var engine = scene.getEngine();

            // Culling
            engine.setState(material.backFaceCulling);

            // Managing instances
            var batch = renderingMesh._getInstancesRenderList(subMesh._id, !!subMesh.getReplacementMesh());

            if (batch.mustReturn) {
                return;
            }

            var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null || renderingMesh.hasThinInstances);

            if (this._isReady(subMesh, hardwareInstancedRendering)) {
                var effect: Effect = this._volumetricLightScatteringPass;
                if (renderingMesh === this.mesh) {
                    if (subMesh.effect) {
                        effect = subMesh.effect;
                    } else {
                        effect = <Effect>material.getEffect();
                    }
                }

                engine.enableEffect(effect);
                renderingMesh._bind(subMesh, effect, material.fillMode);

                if (renderingMesh === this.mesh) {
                    material.bind(effectiveMesh.getWorldMatrix(), renderingMesh);
                }
                else {
                    this._volumetricLightScatteringPass.setMatrix("viewProjection", scene.getTransformMatrix());

                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        var alphaTexture = material.getAlphaTestTexture();

                        this._volumetricLightScatteringPass.setTexture("diffuseSampler", alphaTexture);

                        if (alphaTexture) {
                            this._volumetricLightScatteringPass.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                        }
                    }

                    // Bones
                    if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
                        this._volumetricLightScatteringPass.setMatrices("mBones", renderingMesh.skeleton.getTransformMatrices(renderingMesh));
                    }
                }

                // Draw
                renderingMesh._processRendering(effectiveMesh, subMesh, this._volumetricLightScatteringPass, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                    (isInstance, world) => effect.setMatrix("world", world));
            }
        };

        // Render target texture callbacks
        var savedSceneClearColor: Color4;
        var sceneClearColor = new Color4(0.0, 0.0, 0.0, 1.0);

        this._volumetricLightScatteringRTT.onBeforeRenderObservable.add((): void => {
            savedSceneClearColor = scene.clearColor;
            scene.clearColor = sceneClearColor;
        });

        this._volumetricLightScatteringRTT.onAfterRenderObservable.add((): void => {
            scene.clearColor = savedSceneClearColor;
        });

        this._volumetricLightScatteringRTT.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
            var engine = scene.getEngine();
            var index: number;

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
                    var submesh = transparentSubMeshes.data[index];
                    let boundingInfo = submesh.getBoundingInfo();

                    if (boundingInfo && scene.activeCamera) {
                        submesh._alphaIndex = submesh.getMesh().alphaIndex;
                        submesh._distanceToCamera = boundingInfo.boundingSphere.centerWorld.subtract(scene.activeCamera.position).length();
                    }
                }

                var sortedArray = transparentSubMeshes.data.slice(0, transparentSubMeshes.length);
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
        var transform = scene.getTransformMatrix();
        var meshPosition: Vector3;

        if (this.useCustomMeshPosition) {
            meshPosition = this.customMeshPosition;
        }
        else if (this.attachedNode) {
            meshPosition = this.attachedNode.position;
        }
        else {
            meshPosition = this.mesh.parent ? this.mesh.getAbsolutePosition() : this.mesh.position;
        }

        var pos = Vector3.Project(meshPosition, Matrix.Identity(), transform, this._viewPort);

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
    * @return the default mesh
    */
    public static CreateDefaultMesh(name: string, scene: Scene): Mesh {
        var mesh = Mesh.CreatePlane(name, 1, scene);
        mesh.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;

        var material = new StandardMaterial(name + "Material", scene);
        material.emissiveColor = new Color3(1, 1, 1);

        mesh.material = material;

        return mesh;
    }
}
