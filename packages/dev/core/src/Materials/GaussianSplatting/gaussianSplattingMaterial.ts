import type { SubMesh } from "../../Meshes/subMesh";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Mesh } from "../../Meshes/mesh";
import type { Effect, IEffectCreationOptions } from "../../Materials/effect";
import type { Scene } from "../../scene";
import type { Matrix } from "../../Maths/math.vector";
import type { GaussianSplattingMesh } from "core/Meshes";
import { SerializationHelper } from "../../Misc/decorators.serialization";
import { VertexBuffer } from "../../Buffers/buffer";
import { MaterialDefines } from "../../Materials/materialDefines";
import { PushMaterial } from "../../Materials/pushMaterial";
import { RegisterClass } from "../../Misc/typeStore";
import { AddClipPlaneUniforms, BindClipPlane } from "../clipPlaneMaterialHelper";
import { Camera } from "core/Cameras/camera";

import "../../Shaders/gaussianSplatting.fragment";
import "../../Shaders/gaussianSplatting.vertex";
import "../../ShadersWGSL/gaussianSplatting.fragment";
import "../../ShadersWGSL/gaussianSplatting.vertex";
import {
    BindFogParameters,
    BindLogDepth,
    PrepareAttributesForInstances,
    PrepareDefinesForAttributes,
    PrepareDefinesForFrameBoundValues,
    PrepareDefinesForMisc,
    PrepareUniformsAndSamplersList,
} from "../materialHelper.functions";
import { ShaderLanguage } from "../shaderLanguage";

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
    public SH_DEGREE = 0;
    public COMPENSATION = false;

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
     * Point spread function (default 0.3). Can be overriden per GS material
     */
    public static KernelSize: number = 0.3;

    /**
     * Compensation
     */
    public static Compensation: boolean = false;

    /**
     * Point spread function (default 0.3). Can be overriden per GS material, otherwise, using default static `KernelSize` value
     */
    public kernelSize = GaussianSplattingMaterial.KernelSize;
    private _compensation = GaussianSplattingMaterial.Compensation;

    // set to true when material defines are dirty
    private _isDirty = false;

    /**
     * Set compensation default value is `GaussianSplattingMaterial.Compensation`
     */
    public set compensation(value: boolean) {
        this._isDirty = this._isDirty != value;
        this._compensation = value;
    }

    /**
     * Get compensation
     */
    public get compensation(): boolean {
        return this._compensation;
    }

    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    public override get hasRenderTargetTextures(): boolean {
        return false;
    }

    /**
     * Specifies whether or not this material should be rendered in alpha test mode.
     * @returns false
     */
    public override needAlphaTesting(): boolean {
        return false;
    }

    /**
     * Specifies whether or not this material should be rendered in alpha blend mode.
     * @returns true
     */
    public override needAlphaBlending(): boolean {
        return true;
    }

    /**
     * Checks whether the material is ready to be rendered for a given mesh.
     * @param mesh The mesh to render
     * @param subMesh The submesh to check against
     * @returns true if all the dependencies are ready (Textures, Effects...)
     */
    public override isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh): boolean {
        const useInstances = true;

        const drawWrapper = subMesh._drawWrapper;
        let defines = <GaussianSplattingMaterialDefines>subMesh.materialDefines;

        if (defines && this._isDirty) {
            defines.markAsUnprocessed();
        }

        if (drawWrapper.effect && this.isFrozen) {
            if (drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            defines = subMesh.materialDefines = new GaussianSplattingMaterialDefines();
        }

        const scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const engine = scene.getEngine();
        const gsMesh = mesh as GaussianSplattingMesh;

        // Misc.
        PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, false, defines);

        // Values that need to be evaluated on every frame
        PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances, null, true);

        // Attribs
        PrepareDefinesForAttributes(mesh, defines, false, false);

        // SH is disabled for webGL1
        if (engine.version > 1 || engine.isWebGPU) {
            defines["SH_DEGREE"] = gsMesh.shDegree;
        }

        // Compensation
        const splatMaterial = gsMesh.material as GaussianSplattingMaterial;
        defines["COMPENSATION"] = splatMaterial && splatMaterial.compensation ? splatMaterial.compensation : GaussianSplattingMaterial.Compensation;

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();

            //Attributes
            const attribs = [VertexBuffer.PositionKind, "splatIndex"];

            PrepareAttributesForInstances(attribs, defines);

            const uniforms = [
                "world",
                "view",
                "projection",
                "vFogInfos",
                "vFogColor",
                "logarithmicDepthConstant",
                "invViewport",
                "dataTextureSize",
                "focal",
                "vEyePosition",
                "kernelSize",
            ];
            const samplers = ["covariancesATexture", "covariancesBTexture", "centersTexture", "colorsTexture", "shTexture0", "shTexture1", "shTexture2"];
            const uniformBuffers = ["Scene", "Mesh"];

            PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
            });

            AddClipPlaneUniforms(uniforms);

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
                    indexParameters: {},
                    shaderLanguage: this._shaderLanguage,
                    extraInitializationsAsync: async () => {
                        if (this._shaderLanguage === ShaderLanguage.WGSL) {
                            await Promise.all([import("../../ShadersWGSL/gaussianSplatting.fragment"), import("../../ShadersWGSL/gaussianSplatting.vertex")]);
                        } else {
                            await Promise.all([import("../../Shaders/gaussianSplatting.fragment"), import("../../Shaders/gaussianSplatting.vertex")]);
                        }
                    },
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
        this._isDirty = false;

        return true;
    }

    /**
     * Bind material effect for a specific Gaussian Splatting mesh
     * @param mesh Gaussian splatting mesh
     * @param effect Splatting material or node material
     * @param scene scene that contains mesh and camera used for rendering
     */
    public static BindEffect(mesh: Mesh, effect: Effect, scene: Scene): void {
        const engine = scene.getEngine();
        const camera = scene.activeCamera;

        const renderWidth = engine.getRenderWidth();
        const renderHeight = engine.getRenderHeight();

        const gsMesh = mesh as GaussianSplattingMesh;
        const gsMaterial = gsMesh.material as GaussianSplattingMaterial;

        // check if rigcamera, get number of rigs
        const numberOfRigs = camera?.rigParent?.rigCameras.length || 1;

        effect.setFloat2("invViewport", 1 / (renderWidth / numberOfRigs), 1 / renderHeight);

        let focal = 1000;

        if (camera) {
            /*
            more explicit version:
            const t = camera.getProjectionMatrix().m[5];
            const FovY = Math.atan(1.0 / t) * 2.0;
            focal = renderHeight / 2.0 / Math.tan(FovY / 2.0);
            Using a shorter version here to not have tan(atan) and 2.0 factor
            */
            const t = camera.getProjectionMatrix().m[5];
            if (camera.fovMode == Camera.FOVMODE_VERTICAL_FIXED) {
                focal = (renderHeight * t) / 2.0;
            } else {
                focal = (renderWidth * t) / 2.0;
            }
        }

        effect.setFloat2("focal", focal, focal);
        effect.setFloat("kernelSize", gsMaterial && gsMaterial.kernelSize ? gsMaterial.kernelSize : GaussianSplattingMaterial.KernelSize);

        // vEyePosition doesn't get automatially bound on MacOS with Chromium for no apparent reason.
        // Binding it manually here instead. Remove next line when SH rendering is fine on that platform.
        scene.bindEyePosition(effect);

        if (gsMesh.covariancesATexture) {
            const textureSize = gsMesh.covariancesATexture.getSize();

            effect.setFloat2("dataTextureSize", textureSize.width, textureSize.height);

            effect.setTexture("covariancesATexture", gsMesh.covariancesATexture);
            effect.setTexture("covariancesBTexture", gsMesh.covariancesBTexture);
            effect.setTexture("centersTexture", gsMesh.centersTexture);
            effect.setTexture("colorsTexture", gsMesh.colorsTexture);

            if (gsMesh.shTextures) {
                for (let i = 0; i < gsMesh.shTextures?.length; i++) {
                    effect.setTexture(`shTexture${i}`, gsMesh.shTextures[i]);
                }
            }
        }
    }
    /**
     * Binds the submesh to this material by preparing the effect and shader to draw
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh containing the submesh
     * @param subMesh defines the submesh to bind the material to
     */
    public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
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
            GaussianSplattingMaterial.BindEffect(mesh, this._activeEffect, scene);
            // Clip plane
            BindClipPlane(effect, this, scene);
        } else if (scene.getEngine()._features.needToAlwaysBindUniformBuffers) {
            this._needToBindSceneUbo = true;
        }

        // Fog
        BindFogParameters(scene, mesh, effect);

        // Log. depth
        if (this.useLogarithmicDepth) {
            BindLogDepth(defines, effect, scene);
        }

        this._afterBind(mesh, this._activeEffect, subMesh);
    }

    /**
     * Clones the material.
     * @param name The cloned name.
     * @returns The cloned material.
     */
    public override clone(name: string): GaussianSplattingMaterial {
        return SerializationHelper.Clone(() => new GaussianSplattingMaterial(name, this.getScene()), this);
    }

    /**
     * Serializes the current material to its JSON representation.
     * @returns The JSON representation.
     */
    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.GaussianSplattingMaterial";
        return serializationObject;
    }

    /**
     * Gets the class name of the material
     * @returns "GaussianSplattingMaterial"
     */
    public override getClassName(): string {
        return "GaussianSplattingMaterial";
    }

    /**
     * Parse a JSON input to create back a Gaussian Splatting material.
     * @param source The JSON data to parse
     * @param scene The scene to create the parsed material in
     * @param rootUrl The root url of the assets the material depends upon
     * @returns the instantiated GaussianSplattingMaterial.
     */
    public static override Parse(source: any, scene: Scene, rootUrl: string): GaussianSplattingMaterial {
        return SerializationHelper.Parse(() => new GaussianSplattingMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GaussianSplattingMaterial", GaussianSplattingMaterial);
