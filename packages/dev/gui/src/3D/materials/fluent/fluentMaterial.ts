/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { serializeAsColor4, serializeAsVector3, serializeAsTexture, serialize, expandToProperty, serializeAsColor3, SerializationHelper } from "core/Misc/decorators";
import type { Matrix } from "core/Maths/math.vector";
import { Vector3, TmpVectors } from "core/Maths/math.vector";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { MaterialDefines } from "core/Materials/materialDefines";
import type { IEffectCreationOptions } from "core/Materials/effect";
import { MaterialHelper } from "core/Materials/materialHelper";
import { PushMaterial } from "core/Materials/pushMaterial";
import { VertexBuffer } from "core/Buffers/buffer";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { SubMesh } from "core/Meshes/subMesh";
import type { Mesh } from "core/Meshes/mesh";
import type { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";
import { Color3, Color4 } from "core/Maths/math.color";

import "./shaders/fluent.vertex";
import "./shaders/fluent.fragment";

/** @internal */
export class FluentMaterialDefines extends MaterialDefines {
    public INNERGLOW = false;
    public BORDER = false;
    public HOVERLIGHT = false;
    public TEXTURE = false;

    constructor() {
        super();
        this.rebuild();
    }
}

/**
 * Class used to render controls with fluent design
 */
export class FluentMaterial extends PushMaterial {
    /**
     * Gets or sets inner glow intensity. A value of 0 means no glow (default is 0.5)
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public innerGlowColorIntensity = 0.5;

    /**
     * Gets or sets the inner glow color (white by default)
     */
    @serializeAsColor3()
    public innerGlowColor = new Color3(1.0, 1.0, 1.0);

    /**
     * Gets or sets the albedo color (Default is Color3(0.3, 0.35, 0.4))
     */
    @serializeAsColor3()
    public albedoColor = new Color3(0.3, 0.35, 0.4);

    /**
     * Gets or sets a boolean indicating if borders must be rendered (default is false)
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public renderBorders = false;

    /**
     * Gets or sets border width (default is 0.5)
     */
    @serialize()
    public borderWidth = 0.5;

    /**
     * Gets or sets a value indicating the smoothing value applied to border edges (0.02 by default)
     */
    @serialize()
    public edgeSmoothingValue = 0.02;

    /**
     * Gets or sets the minimum value that can be applied to border width (default is 0.1)
     */
    @serialize()
    public borderMinValue = 0.1;

    /**
     * Gets or sets a boolean indicating if hover light must be rendered (default is false)
     */
    @serialize()
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public renderHoverLight = false;

    /**
     * Gets or sets the radius used to render the hover light (default is 0.01)
     */
    @serialize()
    public hoverRadius = 0.01;

    /**
     * Gets or sets the color used to render the hover light (default is Color4(0.3, 0.3, 0.3, 1.0))
     */
    @serializeAsColor4()
    public hoverColor = new Color4(0.3, 0.3, 0.3, 1.0);

    /**
     * Gets or sets the hover light position in world space (default is Vector3.Zero())
     */
    @serializeAsVector3()
    public hoverPosition = Vector3.Zero();

    @serializeAsTexture("albedoTexture")
    private _albedoTexture: Nullable<BaseTexture>;

    /** Gets or sets the texture to use for albedo color */
    @expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
    public albedoTexture: Nullable<BaseTexture>;

    /**
     * Creates a new Fluent material
     * @param name defines the name of the material
     * @param scene defines the hosting scene
     */
    constructor(name: string, scene?: Scene) {
        super(name, scene);
    }

    public needAlphaBlending(): boolean {
        return this.alpha !== 1.0;
    }

    public needAlphaTesting(): boolean {
        return false;
    }

    public getAlphaTestTexture(): Nullable<BaseTexture> {
        return null;
    }

    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh): boolean {
        const drawWrapper = subMesh._drawWrapper;

        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new FluentMaterialDefines();
        }

        const scene = this.getScene();
        const defines = <FluentMaterialDefines>subMesh.materialDefines;
        if (!this.checkReadyOnEveryCall && subMesh.effect) {
            if (defines._renderId === scene.getRenderId()) {
                return true;
            }
        }

        if (defines._areTexturesDirty) {
            defines.INNERGLOW = this.innerGlowColorIntensity > 0;
            defines.BORDER = this.renderBorders;
            defines.HOVERLIGHT = this.renderHoverLight;

            if (this._albedoTexture) {
                if (!this._albedoTexture.isReadyOrNotBlocking()) {
                    return false;
                } else {
                    defines.TEXTURE = true;
                }
            } else {
                defines.TEXTURE = false;
            }
        }

        const engine = scene.getEngine();
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();

            //Attributes
            const attribs = [VertexBuffer.PositionKind];
            attribs.push(VertexBuffer.NormalKind);
            attribs.push(VertexBuffer.UVKind);

            const shaderName = "fluent";

            const uniforms = [
                "world",
                "viewProjection",
                "innerGlowColor",
                "albedoColor",
                "borderWidth",
                "edgeSmoothingValue",
                "scaleFactor",
                "borderMinValue",
                "hoverColor",
                "hoverPosition",
                "hoverRadius",
                "textureMatrix",
            ];

            const samplers = ["albedoSampler"];
            const uniformBuffers: string[] = [];

            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: 4,
            });

            const join = defines.toString();
            subMesh.setEffect(
                scene.getEngine().createEffect(
                    shaderName,
                    <IEffectCreationOptions>{
                        attributes: attribs,
                        uniformsNames: uniforms,
                        uniformBuffersNames: uniformBuffers,
                        samplers: samplers,
                        defines: join,
                        fallbacks: null,
                        onCompiled: this.onCompiled,
                        onError: this.onError,
                        indexParameters: { maxSimultaneousLights: 4 },
                    },
                    engine
                ),
                defines,
                this._materialContext
            );
        }

        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;

        return true;
    }

    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const scene = this.getScene();

        const defines = <FluentMaterialDefines>subMesh.materialDefines;
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
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());

        if (this._mustRebind(scene, effect, subMesh)) {
            this._activeEffect.setColor4("albedoColor", this.albedoColor, this.alpha);

            if (defines.INNERGLOW) {
                this._activeEffect.setColor4("innerGlowColor", this.innerGlowColor, this.innerGlowColorIntensity);
            }

            if (defines.BORDER) {
                this._activeEffect.setFloat("borderWidth", this.borderWidth);
                this._activeEffect.setFloat("edgeSmoothingValue", this.edgeSmoothingValue);
                this._activeEffect.setFloat("borderMinValue", this.borderMinValue);

                mesh.getBoundingInfo().boundingBox.extendSize.multiplyToRef(mesh.scaling, TmpVectors.Vector3[0]);
                this._activeEffect.setVector3("scaleFactor", TmpVectors.Vector3[0]);
            }

            if (defines.HOVERLIGHT) {
                this._activeEffect.setDirectColor4("hoverColor", this.hoverColor);
                this._activeEffect.setFloat("hoverRadius", this.hoverRadius);
                this._activeEffect.setVector3("hoverPosition", this.hoverPosition);
            }

            if (defines.TEXTURE && this._albedoTexture) {
                this._activeEffect.setTexture("albedoSampler", this._albedoTexture);
                const matrix = this._albedoTexture.getTextureMatrix();
                this._activeEffect.setMatrix("textureMatrix", matrix);
            }
        }

        this._afterBind(mesh, this._activeEffect, subMesh);
    }

    public getActiveTextures(): BaseTexture[] {
        const activeTextures = super.getActiveTextures();

        return activeTextures;
    }

    public hasTexture(texture: BaseTexture): boolean {
        if (super.hasTexture(texture)) {
            return true;
        }

        return false;
    }

    public dispose(forceDisposeEffect?: boolean): void {
        super.dispose(forceDisposeEffect);
    }

    public clone(name: string): FluentMaterial {
        return SerializationHelper.Clone(() => new FluentMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.GUI.FluentMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "FluentMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): FluentMaterial {
        return SerializationHelper.Parse(() => new FluentMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.GUI.FluentMaterial", FluentMaterial);
