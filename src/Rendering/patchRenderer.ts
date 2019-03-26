import { Color4 } from "../Maths/math";
import { SubMesh } from "../Meshes/subMesh";
import { VertexBuffer } from "../Meshes/buffer";
import { SmartArray } from "../Misc/smartArray";
import { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { Constants } from "../Engines/constants";
import { Vector3 } from "../Maths/math"
import { Matrix } from "../Maths/math"

import "../Shaders/depth.fragment";
import "../Shaders/depth.vertex";
import { _DevTools } from '../Misc/devTools';

/**
 * This represents a depth renderer in Babylon.
 * A depth renderer will render to it's depth map every frame which can be displayed or used in post processing
 */

class Patch {

    constructor(p: Vector3, n: Vector3) {
        // World space
        this.position = p.clone();
        this.normal = n.clone().normalize();

        // TODO : test is LH or RH
        this.viewMatrix = Matrix.LookAtLH(this.position, this.position.add(this.normal), Vector3.Up());
        // this.viewMatrix.invert();

        this.viewProjectionMatrix = this.viewMatrix.multiply(Patch.projectionMatrix);

    }

    public position: Vector3
    public normal: Vector3;
    public viewMatrix: Matrix;
    public viewProjectionMatrix: Matrix;

    public static readonly fov: number = 120 * Math.PI / 180;
    public static projectionMatrix: Matrix;
}

export class PatchRenderer {
    private _scene: Scene;
    private _patchMap: RenderTargetTexture;
    private _effect: Effect;
    private _near: number;
    private _far: number;

    private _cachedDefines: string;

    /**
     * Specifiess that the depth renderer will only be used within
     * the camera it is created for.
     * This can help forcing its rendering during the camera processing.
     */
    public useOnlyInActiveCamera: boolean = false;

    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _DevTools.WarnImport("patchRendererSceneComponent");
    }

    /**
     * Instantiates a depth renderer
     * @param scene The scene the renderer belongs to
     * @param type The texture type of the depth map (default: Engine.TEXTURETYPE_FLOAT)
     * @param camera The camera to be used to render the depth map (default: scene's active camera)
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._near = 0.1;
        this._far = 1000;

        // PatchRenderer._SceneComponentInitialization(this._scene);
        Patch.projectionMatrix = Matrix.PerspectiveFovLH(Patch.fov,
            1, // squared texture
            this._near,
            this._far,
        );

        // Render target
        var texture = new RenderTargetTexture("test", 1024, scene, true,
            true, 
            Constants.TEXTURETYPE_UNSIGNED_INT, 
            false, 
            Texture.NEAREST_SAMPLINGMODE
        );

        texture.refreshRate === RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        this._patchMap = new RenderTargetTexture("patch", { width: 1024, height: 1024 }, this._scene, false, true, Constants.TEXTURETYPE_UNSIGNED_INT, false, Texture.NEAREST_SAMPLINGMODE);
        this._patchMap.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._patchMap.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._patchMap.refreshRate = 1; // FIXME
        this._patchMap.renderParticles = false;
        this._patchMap.renderList = this._scene.meshes;

        scene.customRenderTargets.push(this._patchMap);
        var testPatch = new Patch(new Vector3(0, 5, 0), new Vector3(0, -1, 0));

        this._patchMap.ignoreCameraViewport = true;
        this._patchMap.useCameraPostProcesses = false;

        // set default depth value to 1.0 (far away)
        this._patchMap.onClearObservable.add((engine) => {
            engine.clear(new Color4(1.0, 1.0, 1.0, 1.0), true, true, true);
        });

        // Custom render function
        var renderSubMeshFromPatch = (subMesh: SubMesh, patch: Patch): void => {

            var mesh = subMesh.getRenderingMesh();
            var scene = this._scene;
            var engine = scene.getEngine();
            let material = subMesh.getMaterial();

            if (!material) {
                return;
            }

            // Culling and reverse (right handed system)
            engine.setState(material.backFaceCulling, 0, false, scene.useRightHandedSystem);
            engine.setDirectViewport(0, 0, this._patchMap.getRenderWidth(), this._patchMap.getRenderHeight())
            // Managing instances
            var batch = mesh._getInstancesRenderList(subMesh._id);

            if (batch.mustReturn) {
                return;
            }

            var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);

            if (this.isReady(subMesh, hardwareInstancedRendering) && patch) {
                engine.enableEffect(this._effect);
                mesh._bind(subMesh, this._effect, Material.TriangleFillMode);

                this._effect.setMatrix("view", patch.viewMatrix);
                this._effect.setFloat2("nearFar", this._near, this._far);

                // Alpha test
                if (material && material.needAlphaTesting()) {
                    var alphaTexture = material.getAlphaTestTexture();

                    if (alphaTexture) {
                        this._effect.setTexture("diffuseSampler", alphaTexture);
                        this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }
                }

                // Bones
                if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                    this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
                }

                // Draw
                mesh._processRendering(subMesh, this._effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                    (isInstance, world) => this._effect.setMatrix("world", world));
            }
        };

        // for loop on all patches
        this._patchMap.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
            var index;
            // var testPatch = new Patch(this._scene.activeCamera ? this._scene.activeCamera.position : new Vector3(0, 0, 0), new Vector3(0, -1, 0));

            for (index = 0; index < opaqueSubMeshes.length; index++) {
                renderSubMeshFromPatch(opaqueSubMeshes.data[index], testPatch);
            }

            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                renderSubMeshFromPatch(alphaTestSubMeshes.data[index], testPatch);
            }
        };
    }

    /**
     * Creates the patch rendering effect and checks if the effect is ready.
     * @param subMesh The submesh to be used to render the depth map of
     * @param useInstances If multiple world instances should be used
     * @returns if the depth renderer is ready to render the depth map
     */
    public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
        var material: any = subMesh.getMaterial();
        var defines = [];

        var attribs = [VertexBuffer.PositionKind, VertexBuffer.UV2Kind];

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
            this._effect = this._scene.getEngine().createEffect("uv2mat",
                attribs,
                ["world", "mBones", "view", "nearFar", "diffuseMatrix"],
                ["diffuseSampler"], join);
        }

        return this._effect.isReady();
    }

    /**
     * Gets the texture which the depth map will be written to.
     * @returns The depth map texture
     */
    public getDepthMap(): RenderTargetTexture {
        return this._patchMap;
    }

    /**
     * Disposes of the depth renderer.
     */
    public dispose(): void {
        this._patchMap.dispose();
    }
}
