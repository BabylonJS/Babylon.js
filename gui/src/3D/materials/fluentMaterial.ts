import { Nullable } from "babylonjs/types";
import { serializeAsColor4, serializeAsVector3, serializeAsTexture, serialize, expandToProperty, serializeAsColor3, SerializationHelper } from "babylonjs/Misc/decorators";
import { Vector3, Matrix, TmpVectors } from "babylonjs/Maths/math.vector";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { MaterialDefines } from "babylonjs/Materials/materialDefines";
import { IEffectCreationOptions } from "babylonjs/Materials/effect";
import { MaterialHelper } from "babylonjs/Materials/materialHelper";
import { PushMaterial } from "babylonjs/Materials/pushMaterial";
import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';

import "./shaders/fluent.vertex";
import "./shaders/fluent.fragment";

/** @hidden */
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
 * Class used to render controls with fluent desgin
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
     * Gets or sets the radius used to render the hover light (default is 1.0)
     */
    @serialize()
    public hoverRadius = 1.0;

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
    constructor(name: string, scene: Scene) {
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

    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        if (this.isFrozen) {
            if (subMesh.effect && subMesh.effect._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh._materialDefines) {
            subMesh._materialDefines = new FluentMaterialDefines();
        }

        var scene = this.getScene();
        var defines = <FluentMaterialDefines>subMesh._materialDefines;
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

        var engine = scene.getEngine();
        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();

            //Attributes
            var attribs = [VertexBuffer.PositionKind];
            attribs.push(VertexBuffer.NormalKind);
            attribs.push(VertexBuffer.UVKind);

            var shaderName = "fluent";

            var uniforms = ["world", "viewProjection", "innerGlowColor", "albedoColor", "borderWidth", "edgeSmoothingValue", "scaleFactor", "borderMinValue",
                "hoverColor", "hoverPosition", "hoverRadius"
            ];

            var samplers = ["albedoSampler"];
            var uniformBuffers = new Array<string>();

            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: 4
            });

            var join = defines.toString();
            subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                <IEffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: null,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: 4 }
                }, engine));

        }

        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        subMesh.effect._wasPreviouslyReady = true;

        return true;
    }

    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        var scene = this.getScene();

        var defines = <FluentMaterialDefines>subMesh._materialDefines;
        if (!defines) {
            return;
        }

        var effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;

        // Matrices
        this.bindOnlyWorldMatrix(world);
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());

        if (this._mustRebind(scene, effect)) {
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

            if (defines.TEXTURE) {
                this._activeEffect.setTexture("albedoSampler", this._albedoTexture);
            }
        }

        this._afterBind(mesh, this._activeEffect);
    }

    public getActiveTextures(): BaseTexture[] {
        var activeTextures = super.getActiveTextures();

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
        var serializationObject = SerializationHelper.Serialize(this);
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

_TypeStore.RegisteredTypes["BABYLON.GUI.FluentMaterial"] = FluentMaterial;