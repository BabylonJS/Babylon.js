import type { SubMesh } from "../../Meshes/subMesh";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Mesh } from "../../Meshes/mesh";
import type { IEffectCreationOptions } from "../../Materials/effect";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import type { Scene } from "../../scene";
import type { Matrix } from "../../Maths/math.vector";
import { SerializationHelper, expandToProperty, serializeAsTexture } from "../../Misc/decorators";
import { VertexBuffer } from "../../Buffers/buffer";
import { MaterialHelper } from "../../Materials/materialHelper";
import { MaterialDefines } from "../../Materials/materialDefines";
import { PushMaterial } from "../../Materials/pushMaterial";
import { RegisterClass } from "../../Misc/typeStore";
import { addClipPlaneUniforms, bindClipPlane } from "../clipPlaneMaterialHelper";

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
    @serializeAsTexture("covariancesATexture")
    private _covariancesATexture: Nullable<BaseTexture> = null;
    /**
     * Defines the texture with the covariance A data.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public covariancesATexture: Nullable<BaseTexture>;

    @serializeAsTexture("covariancesBTexture")
    private _covariancesBTexture: Nullable<BaseTexture> = null;
    /**
     * Defines the texture with the covariance B data.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public covariancesBTexture: Nullable<BaseTexture>;

    @serializeAsTexture("centersTexture")
    private _centersTexture: Nullable<BaseTexture> = null;
    /**
     * Defines the texture with the centers data.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public centersTexture: Nullable<BaseTexture>;

    @serializeAsTexture("colorsTexture")
    private _colorsTexture: Nullable<BaseTexture> = null;
    /**
     * Defines the texture with the colors data.
     */
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public colorsTexture: Nullable<BaseTexture>;

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

        if (!this._uniformBufferLayoutBuilt) {
            this.buildUniformLayout();
        }

        if (subMesh.effect && this.isFrozen) {
            if (subMesh.effect._wasPreviouslyReady && subMesh.effect._wasPreviouslyUsingInstances === useInstances) {
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

            const uniforms = ["world", "vFogInfos", "vFogColor", "logarithmicDepthConstant", "vSplattingInfos"];
            const samplers = ["covariancesATexture", "covariancesBTexture", "centersTexture", "colorsTexture"];
            const uniformBuffers = ["Material", "Scene", "Mesh"];

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
        subMesh.effect._wasPreviouslyReady = true;
        subMesh.effect._wasPreviouslyUsingInstances = useInstances;

        return true;
    }

    /**
     * Builds the material UBO layouts.
     * Used internally during the effect preparation.
     */
    public buildUniformLayout(): void {
        const ubo = this._uniformBuffer;
        ubo.addUniform("vSplattingInfos", 4);

        super.buildUniformLayout();
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
        this._uniformBuffer.bindToEffect(effect, "Material");

        const mustRebind = effect._forceRebindOnNextCall || this._mustRebind(scene, effect, mesh.visibility);

        if (mustRebind) {
            this.bindViewProjection(effect);

            const engine = scene.getEngine();
            const textureSize = this._covariancesATexture?.getSize() ?? { width: 0, height: 0 };

            this._uniformBuffer.updateFloat4("vSplattingInfos", engine.getRenderWidth(), engine.getRenderHeight(), textureSize.width, textureSize.height);

            effect.setTexture("covariancesATexture", this._covariancesATexture);
            effect.setTexture("covariancesBTexture", this._covariancesBTexture);
            effect.setTexture("centersTexture", this._centersTexture);
            effect.setTexture("colorsTexture", this._colorsTexture);

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

        this._afterBind(mesh, this._activeEffect);
        this._uniformBuffer.update();
    }

    /**
     * Gets the active textures from the material
     * @returns an array of textures
     */
    public getActiveTextures(): BaseTexture[] {
        const activeTextures = super.getActiveTextures();

        if (this._covariancesATexture) {
            activeTextures.push(this._covariancesATexture);
        }

        if (this._covariancesBTexture) {
            activeTextures.push(this._covariancesBTexture);
        }

        if (this._centersTexture) {
            activeTextures.push(this._centersTexture);
        }

        if (this._colorsTexture) {
            activeTextures.push(this._colorsTexture);
        }

        return activeTextures;
    }

    /**
     * Checks to see if a texture is used in the material.
     * @param texture - Base texture to use.
     * @returns - Boolean specifying if a texture is used in the material.
     */
    public hasTexture(texture: BaseTexture): boolean {
        if (super.hasTexture(texture)) {
            return true;
        }

        if (this._covariancesATexture === texture) {
            return true;
        }

        if (this._covariancesBTexture === texture) {
            return true;
        }

        if (this._centersTexture === texture) {
            return true;
        }

        if (this._colorsTexture === texture) {
            return true;
        }

        return false;
    }

    /**
     * Dispose the material.
     * @param forceDisposeEffect specifies if effects should be forcefully disposed
     * @param forceDisposeTextures specifies if textures should be forcefully disposed
     */
    public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void {
        if (forceDisposeTextures) {
            this._covariancesATexture?.dispose();
            this._covariancesBTexture?.dispose();
            this._centersTexture?.dispose();
            this._colorsTexture?.dispose();

            this._covariancesATexture = null;
            this._covariancesBTexture = null;
            this._centersTexture = null;
            this._colorsTexture = null;
        }

        super.dispose(forceDisposeEffect);
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
