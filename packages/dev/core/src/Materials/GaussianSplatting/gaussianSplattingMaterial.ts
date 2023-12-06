/* eslint-disable @typescript-eslint/naming-convention */
import { SerializationHelper } from "../../Misc/decorators";
import { Logger } from "../../Misc/logger";
import type { Scene } from "../../scene";
import type { Matrix } from "../../Maths/math.vector";
import { VertexBuffer } from "../../Buffers/buffer";
import type { SubMesh } from "../../Meshes/subMesh";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Mesh } from "../../Meshes/mesh";
import type { IEffectCreationOptions } from "../../Materials/effect";
import { MaterialHelper } from "../../Materials/materialHelper";
import { MaterialDefines } from "../../Materials/materialDefines";
import { PushMaterial } from "../../Materials/pushMaterial";
import type { IImageProcessingConfigurationDefines } from "../../Materials/imageProcessingConfiguration";
import { ImageProcessingConfiguration } from "../../Materials/imageProcessingConfiguration";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { RegisterClass } from "../../Misc/typeStore";

import "../../Shaders/background.fragment";
import "../../Shaders/background.vertex";
import { EffectFallbacks } from "../effectFallbacks";
import { addClipPlaneUniforms, bindClipPlane } from "../clipPlaneMaterialHelper";

/**
 * GaussianSplattingMaterial material defines definition.
 * @internal Mainly internal Use
 */
class GaussianSplattingMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
    /**
     * True if the diffuse texture is in use.
     */
    public DIFFUSE = false;

    /**
     * The direct UV channel to use.
     */
    public DIFFUSEDIRECTUV = 0;

    /**
     * True if the diffuse texture is in gamma space.
     */
    public GAMMADIFFUSE = false;

    /**
     * True if the diffuse texture has opacity in the alpha channel.
     */
    public DIFFUSEHASALPHA = false;

    /**
     * True if you want the material to fade to transparent at grazing angle.
     */
    public OPACITYFRESNEL = false;

    /**
     * True if an extra blur needs to be added in the reflection.
     */
    public REFLECTIONBLUR = false;

    /**
     * True if you want the material to fade to reflection at grazing angle.
     */
    public REFLECTIONFRESNEL = false;

    /**
     * True if you want the material to falloff as far as you move away from the scene center.
     */
    public REFLECTIONFALLOFF = false;

    /**
     * False if the current Webgl implementation does not support the texture lod extension.
     */
    public TEXTURELODSUPPORT = false;

    /**
     * True to ensure the data are premultiplied.
     */
    public PREMULTIPLYALPHA = false;

    /**
     * True if the texture contains cooked RGB values and not gray scaled multipliers.
     */
    public USERGBCOLOR = false;

    /**
     * True if highlight and shadow levels have been specified. It can help ensuring the main perceived color
     * stays aligned with the desired configuration.
     */
    public USEHIGHLIGHTANDSHADOWCOLORS = false;

    /**
     * True if only shadows must be rendered
     */
    public BACKMAT_SHADOWONLY = false;

    /**
     * True to add noise in order to reduce the banding effect.
     */
    public NOISE = false;

    /**
     * is the reflection texture in BGR color scheme?
     * Mainly used to solve a bug in ios10 video tag
     */
    public REFLECTIONBGR = false;

    /**
     * True if ground projection has been enabled.
     */
    public PROJECTED_GROUND = false;

    public IMAGEPROCESSING = false;
    public VIGNETTE = false;
    public VIGNETTEBLENDMODEMULTIPLY = false;
    public VIGNETTEBLENDMODEOPAQUE = false;
    public TONEMAPPING = false;
    public TONEMAPPING_ACES = false;
    public CONTRAST = false;
    public COLORCURVES = false;
    public COLORGRADING = false;
    public COLORGRADING3D = false;
    public SAMPLER3DGREENDEPTH = false;
    public SAMPLER3DBGRMAP = false;
    public DITHER = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public SKIPFINALCOLORCLAMP = false;
    public EXPOSURE = false;
    public MULTIVIEW = false;

    // Reflection.
    public REFLECTION = false;
    public REFLECTIONMAP_3D = false;
    public REFLECTIONMAP_SPHERICAL = false;
    public REFLECTIONMAP_PLANAR = false;
    public REFLECTIONMAP_CUBIC = false;
    public REFLECTIONMAP_PROJECTION = false;
    public REFLECTIONMAP_SKYBOX = false;
    public REFLECTIONMAP_EXPLICIT = false;
    public REFLECTIONMAP_EQUIRECTANGULAR = false;
    public REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
    public REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
    public INVERTCUBICMAP = false;
    public REFLECTIONMAP_OPPOSITEZ = false;
    public LODINREFLECTIONALPHA = false;
    public GAMMAREFLECTION = false;
    public RGBDREFLECTION = false;
    public EQUIRECTANGULAR_RELFECTION_FOV = false;

    // Default BJS.
    public MAINUV1 = false;
    public MAINUV2 = false;
    public UV1 = false;
    public UV2 = false;
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;
    public POINTSIZE = false;
    public FOG = false;
    public NORMAL = false;
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public INSTANCES = false;
    public SHADOWFLOAT = false;
    public LOGARITHMICDEPTH = false;
    public NONUNIFORMSCALING = false;
    public ALPHATEST = false;

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
 */
export class GaussianSplattingMaterial extends PushMaterial {
    /**
     * Due to a bug in iOS10, video tags (which are using the background material) are in BGR and not RGB.
     * Setting this flag to true (not done automatically!) will convert it back to RGB.
     */
    public switchToBGR: boolean = false;

    /**
     * Instantiates a Background Material in the given scene
     * @param name The friendly name of the material
     * @param scene The scene to add the material to
     */
    constructor(name: string, scene?: Scene) {
        super(name, scene);
    }

    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    public get hasRenderTargetTextures(): boolean {
        return false;
    }

    /**
     * The entire material has been created in order to prevent overdraw.
     * @returns false
     */
    public needAlphaTesting(): boolean {
        return false;
    }

    /**
     * The entire material has been created in order to prevent overdraw.
     * @returns true if blending is enable
     */
    public needAlphaBlending(): boolean {
        return true;
    }
    /**
     * set viewport size
     * @param width
     * @param height
     */
    public setViewport(width: number, height: number) {}

    /**
     * setModelView
     * @param modelView
     */
    public setModelView(modelView: Matrix) {}

    /**
     * Checks whether the material is ready to be rendered for a given mesh.
     * @param mesh The mesh to render
     * @param subMesh The submesh to check against
     * @param useInstances Specify wether or not the material is used with instances
     * @returns true if all the dependencies are ready (Textures, Effects...)
     */
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances: boolean = false): boolean {
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

        if (defines._areMiscDirty) {
            if (defines.REFLECTIONMAP_3D) {
                defines.PROJECTED_GROUND = true;
                defines.REFLECTIONMAP_SKYBOX = true;
            } else {
                defines.PROJECTED_GROUND = false;
            }
        }

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances, null, subMesh.getRenderingMesh().hasThinInstances);

        // Attribs
        if (MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true, false)) {
            if (mesh) {
                if (!scene.getEngine().getCaps().standardDerivatives && !mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    mesh.createNormals(true);
                    Logger.Warn("GaussianSplattingMaterial: Normals have been created for the mesh: " + mesh.name);
                }
            }
        }

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();

            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(0, "FOG");
            }

            if (defines.POINTSIZE) {
                fallbacks.addFallback(1, "POINTSIZE");
            }

            if (defines.MULTIVIEW) {
                fallbacks.addFallback(0, "MULTIVIEW");
            }

            //Attributes
            const attribs = [VertexBuffer.PositionKind];

            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }

            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }

            if (defines.UV2) {
                attribs.push(VertexBuffer.UV2Kind);
            }

            MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

            const uniforms = ["projection", "modelView"];

            addClipPlaneUniforms(uniforms);
            const samplers = [""];
            const uniformBuffers = ["Material", "Scene"];

            if (ImageProcessingConfiguration) {
                ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
                ImageProcessingConfiguration.PrepareSamplers(samplers, defines);
            }

            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
            });

            const join = defines.toString();
            const effect = scene.getEngine().createEffect(
                "background",
                <IEffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                },
                engine
            );
            subMesh.setEffect(effect, defines, this._materialContext);

            this.buildUniformLayout();
        }

        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        subMesh.effect._wasPreviouslyReady = true;
        subMesh.effect._wasPreviouslyUsingInstances = useInstances;

        this._checkScenePerformancePriority();

        return true;
    }

    /**
     * Build the uniform buffer used in the material.
     */
    public buildUniformLayout(): void {
        // Order is important !
        this._uniformBuffer.addUniform("vPrimaryColor", 4);
        this._uniformBuffer.addUniform("vPrimaryColorShadow", 4);
        this._uniformBuffer.addUniform("vDiffuseInfos", 2);
        this._uniformBuffer.addUniform("vReflectionInfos", 2);
        this._uniformBuffer.addUniform("diffuseMatrix", 16);
        this._uniformBuffer.addUniform("reflectionMatrix", 16);
        this._uniformBuffer.addUniform("vReflectionMicrosurfaceInfos", 3);
        this._uniformBuffer.addUniform("fFovMultiplier", 1);
        this._uniformBuffer.addUniform("pointSize", 1);
        this._uniformBuffer.addUniform("shadowLevel", 1);
        this._uniformBuffer.addUniform("alpha", 1);
        this._uniformBuffer.addUniform("vBackgroundCenter", 3);
        this._uniformBuffer.addUniform("vReflectionControl", 4);
        this._uniformBuffer.addUniform("projectedGroundInfos", 2);

        this._uniformBuffer.create();
    }

    /**
     * Unbind the material.
     */
    public unbind(): void {
        super.unbind();
    }

    /**
     * Bind only the world matrix to the material.
     * @param world The world matrix to bind.
     */
    public bindOnlyWorldMatrix(world: Matrix): void {
        this._activeEffect!.setMatrix("world", world);
    }

    /**
     * Bind the material for a dedicated submeh (every used meshes will be considered opaque).
     * @param world The world matrix to bind.
     * @param mesh
     * @param subMesh The submesh to bind for.
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

        // Matrices
        this.bindOnlyWorldMatrix(world);

        // Bones
        MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

        const mustRebind = this._mustRebind(scene, effect, mesh.visibility);
        if (mustRebind) {
            this._uniformBuffer.bindToEffect(effect, "Material");

            this.bindViewProjection(effect);

            this._uniformBuffer.updateFloat("alpha", this.alpha);

            // Point size
            if (this.pointsCloud) {
                this._uniformBuffer.updateFloat("pointSize", this.pointSize);
            }

            // Clip plane
            bindClipPlane(this._activeEffect, this, scene);

            scene.bindEyePosition(effect);
        } else if (scene.getEngine()._features.needToAlwaysBindUniformBuffers) {
            this._uniformBuffer.bindToEffect(effect, "Material");
            this._needToBindSceneUbo = true;
        }

        if (mustRebind || !this.isFrozen) {
            // View
            this.bindView(effect);

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect, true);
        }

        this._afterBind(mesh, this._activeEffect);

        this._uniformBuffer.update();
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

        return false;
    }

    /**
     * Dispose the material.
     * @param forceDisposeEffect Force disposal of the associated effect.
     * @param forceDisposeTextures Force disposal of the associated textures.
     */
    public dispose(forceDisposeEffect: boolean = false, forceDisposeTextures: boolean = false): void {
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
     * Parse a JSON input to create back a background material.
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
