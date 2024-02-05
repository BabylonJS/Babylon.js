import type { SubMesh } from "../../Meshes/subMesh";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Mesh } from "../../Meshes/mesh";
import type { IEffectCreationOptions } from "../../Materials/effect";
import type { Scene } from "../../scene";
import type { Matrix } from "../../Maths/math.vector";
import type { GaussianSplattingMesh } from "core/Meshes";
import { SerializationHelper } from "../../Misc/decorators";
import { VertexBuffer } from "../../Buffers/buffer";
import { MaterialHelper } from "../../Materials/materialHelper";
import { MaterialDefines } from "../../Materials/materialDefines";
import { PushMaterial } from "../../Materials/pushMaterial";
import { RegisterClass } from "../../Misc/typeStore";
import { addClipPlaneUniforms, bindClipPlane } from "../clipPlaneMaterialHelper";
import { Camera } from "core/Cameras/camera";

import "../../Shaders/gaussianSplatting.fragment";
import "../../Shaders/gaussianSplatting.vertex";

/**
 * @internal
 */
class GaussianSplattingMaterialDefines extends MaterialDefines {
    public FOG = false;
    public THIN_INSTANCES = true;
    public LOGARITHMICDEPTH = false;
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;

    /**
     * Constructor of the defines.
     */
    constructor() {
        super();
        this.rebuild();
    }
}

/**
 * GaussianSplattingMaterial material used to render Gaussian Splatting
 * @experimental
 */
export class GaussianSplattingMaterial extends PushMaterial {
    /**
     * Instantiates a Gaussian Splatting Material in the given scene
     * @param name The friendly name of the material
     * @param scene The scene to add the material to
     */
    constructor(name: string, scene?: Scene) {
        super(name, scene);

        this.backFaceCulling = false;
    }

    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    public get hasRenderTargetTextures(): boolean {
        return false;
    }

    /**
     * Specifies whether or not this material should be rendered in alpha test mode.
     * @returns false
     */
    public needAlphaTesting(): boolean {
        return false;
    }

    /**
     * Specifies whether or not this material should be rendered in alpha blend mode.
     * @returns true
     */
    public needAlphaBlending(): boolean {
        return true;
    }

    /**
     * Checks whether the material is ready to be rendered for a given mesh.
     * @param mesh The mesh to render
     * @param subMesh The submesh to check against
     * @returns true if all the dependencies are ready (Textures, Effects...)
     */
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh): boolean {
        const useInstances = true;

        const drawWrapper = subMesh._drawWrapper;

        if (drawWrapper.effect && this.isFrozen) {
            if (drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new GaussianSplattingMaterialDefines();
        }

        const scene = this.getScene();
        const defines = <GaussianSplattingMaterialDefines>subMesh.materialDefines;

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const engine = scene.getEngine();

        // Misc.
        MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, false, defines);

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances, null, true);

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, false);

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();

            //Attributes
            const attribs = [VertexBuffer.PositionKind, "splatIndex"];

            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

            const uniforms = ["world", "view", "projection", "vFogInfos", "vFogColor", "logarithmicDepthConstant", "viewport", "dataTextureSize", "focal"];
            const samplers = ["covariancesATexture", "covariancesBTexture", "centersTexture", "colorsTexture"];
            const uniformBuffers = ["Scene", "Mesh"];

            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
            });

            addClipPlaneUniforms(uniforms);

            const join = defines.toString();
            const effect = scene.getEngine().createEffect(
                "gaussianSplatting",
                <IEffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                },
                engine
            );
            subMesh.setEffect(effect, defines, this._materialContext);
        }

        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;
        drawWrapper._wasPreviouslyUsingInstances = useInstances;

        return true;
    }

    /**
     * Binds the submesh to this material by preparing the effect and shader to draw
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh containing the submesh
     * @param subMesh defines the submesh to bind the material to
     */
    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const scene = this.getScene();

        const defines = <GaussianSplattingMaterialDefines>subMesh.materialDefines;
        if (!defines) {
            return;
        }

        const effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;

        // Matrices Mesh.
        mesh.getMeshUniformBuffer().bindToEffect(effect, "Mesh");
        mesh.transferToEffect(world);

        // Bind data
        const mustRebind = this._mustRebind(scene, effect, subMesh, mesh.visibility);

        if (mustRebind) {
            this.bindView(effect);
            this.bindViewProjection(effect);

            const engine = scene.getEngine();
            const camera = this.getScene().activeCamera;

            const renderWidth = engine.getRenderWidth();
            const renderHeight = engine.getRenderHeight();

            this._activeEffect.setFloat2("viewport", renderWidth, renderHeight);

            let focal = 1000;

            if (camera) {
                if (camera.fovMode == Camera.FOVMODE_VERTICAL_FIXED) {
                    focal = renderHeight / 2.0 / Math.tan(camera.fov / 2.0);
                } else {
                    focal = renderWidth / 2.0 / Math.tan(camera.fov / 2.0);
                }
            }

            this._activeEffect.setFloat2("focal", focal, focal);

            const gsMesh = mesh as GaussianSplattingMesh;

            if (gsMesh.covariancesATexture) {
                const textureSize = gsMesh.covariancesATexture.getSize();

                effect.setFloat2("dataTextureSize", textureSize.width, textureSize.height);

                effect.setTexture("covariancesATexture", gsMesh.covariancesATexture);
                effect.setTexture("covariancesBTexture", gsMesh.covariancesBTexture);
                effect.setTexture("centersTexture", gsMesh.centersTexture);
                effect.setTexture("colorsTexture", gsMesh.colorsTexture);
            }

            // Clip plane
            bindClipPlane(effect, this, scene);
        } else if (scene.getEngine()._features.needToAlwaysBindUniformBuffers) {
            this._needToBindSceneUbo = true;
        }

        // Fog
        MaterialHelper.BindFogParameters(scene, mesh, effect);

        // Log. depth
        if (this.useLogarithmicDepth) {
            MaterialHelper.BindLogDepth(defines, effect, scene);
        }

        this._afterBind(mesh, this._activeEffect, subMesh);
    }

    /**
     * Clones the material.
     * @param name The cloned name.
     * @returns The cloned material.
     */
    public clone(name: string): GaussianSplattingMaterial {
        return SerializationHelper.Clone(() => new GaussianSplattingMaterial(name, this.getScene()), this);
    }

    /**
     * Serializes the current material to its JSON representation.
     * @returns The JSON representation.
     */
    public serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.GaussianSplattingMaterial";
        return serializationObject;
    }

    /**
     * Gets the class name of the material
     * @returns "GaussianSplattingMaterial"
     */
    public getClassName(): string {
        return "GaussianSplattingMaterial";
    }

    /**
     * Parse a JSON input to create back a Gaussian Splatting material.
     * @param source The JSON data to parse
     * @param scene The scene to create the parsed material in
     * @param rootUrl The root url of the assets the material depends upon
     * @returns the instantiated GaussianSplattingMaterial.
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): GaussianSplattingMaterial {
        return SerializationHelper.Parse(() => new GaussianSplattingMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GaussianSplattingMaterial", GaussianSplattingMaterial);
