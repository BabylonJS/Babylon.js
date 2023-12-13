/* eslint-disable @typescript-eslint/naming-convention */
import { SerializationHelper } from "../../Misc/decorators";
import type { Scene } from "../../scene";
import { Matrix } from "../../Maths/math.vector";
import { VertexBuffer } from "../../Buffers/buffer";
import type { SubMesh } from "../../Meshes/subMesh";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Mesh } from "../../Meshes/mesh";
import type { IEffectCreationOptions } from "../../Materials/effect";
import { MaterialHelper } from "../../Materials/materialHelper";
import { MaterialDefines } from "../../Materials/materialDefines";
import { PushMaterial } from "../../Materials/pushMaterial";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { RegisterClass } from "../../Misc/typeStore";

import "../../Shaders/gaussianSplatting.fragment";
import "../../Shaders/gaussianSplatting.vertex";

/**
 * GaussianSplattingMaterial material defines definition.
 * @internal Mainly internal Use
 */
class GaussianSplattingMaterialDefines extends MaterialDefines {
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
    private _width: number = 0;
    private _height: number = 0;
    private _modelView: Matrix = new Matrix();
    /**
     * Instantiates a Gaussian Splatting Material in the given scene
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
     * Defines the maximum number of lights that can be used in the material
     */
    public maxSimultaneousLights: number = 4;
    /**
     * set viewport size
     * @param width
     * @param height
     */
    public setViewport(width: number, height: number) {
        this._width = width;
        this._height = height;
    }

    /**
     * setModelView
     * @param modelView
     */
    public setModelView(modelView: Matrix) {
        this._modelView.copyFrom(modelView);
    }

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

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances, null, subMesh.getRenderingMesh().hasThinInstances);

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, false);

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();

            //Attributes
            const attribs = [VertexBuffer.PositionKind];

            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

            const uniforms = ["projection", "modelView", "viewport"];

            const samplers = [""];
            const uniformBuffers = ["Material", "Scene"];

            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
            });

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

            scene.bindEyePosition(effect);
        } else if (scene.getEngine()._features.needToAlwaysBindUniformBuffers) {
            this._uniformBuffer.bindToEffect(effect, "Material");
            this._needToBindSceneUbo = true;
        }

        if (mustRebind || !this.isFrozen) {
            // View
            this.bindView(effect);
        }
        effect.setMatrix("modelView", this._modelView);
        effect.setFloat2("viewport", this._width, this._height);
        effect.setMatrix("projection", scene.getProjectionMatrix());
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
    public dispose(forceDisposeEffect: boolean = false): void {
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
