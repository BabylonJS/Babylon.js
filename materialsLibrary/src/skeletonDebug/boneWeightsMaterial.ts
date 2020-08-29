import { Nullable } from "babylonjs/types";
import { serialize,  serializeAsColor3, SerializationHelper } from "babylonjs/Misc/decorators";
import { Matrix } from "babylonjs/Maths/math.vector";
import { Color3 } from "babylonjs/Maths/math.color";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { IEffectCreationOptions } from "babylonjs/Materials/effect";
import { MaterialDefines } from "babylonjs/Materials/materialDefines";
import { MaterialHelper } from "babylonjs/Materials/materialHelper";
import { PushMaterial } from "babylonjs/Materials/pushMaterial";

import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { EffectFallbacks } from 'babylonjs/Materials/effectFallbacks';

import "./boneWeights.fragment";
import "./boneWeights.vertex";

import { IBoneWeightsMaterialOptions } from "./IBoneWeightsMaterial";
import { Skeleton } from 'babylonjs';

class BoneWeightsMaterialDefines extends MaterialDefines {
    public DIFFUSE = false;
    public HEIGHTMAP = false;
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;
    public ALPHATEST = false;
    public DEPTHPREPASS = false;
    public POINTSIZE = false;
    public FOG = false;
    public NORMAL = false;
    public UV1 = false;
    public UV2 = false;
    public VERTEXCOLOR = false;
    public VERTEXALPHA = false;
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public INSTANCES = false;
    public HIGHLEVEL = false;
    constructor() {
        super();
        this.rebuild();
    }
}


export class BoneWeightsMaterial extends PushMaterial{
    @serialize('skeleton')
    public skeleton: Skeleton;
    @serializeAsColor3('colorBase')
    public colorBase: Color3;
    @serializeAsColor3('colorZero')
    public colorZero: Color3;
    @serializeAsColor3('colorQuarter')
    public colorQuarter: Color3;
    @serializeAsColor3('colorHalf')
    public colorHalf: Color3;
    @serializeAsColor3('colorFull')
    public colorFull: Color3;
    @serialize('targetBoneIndex')
    public targetBoneIndex: number; 
   
    constructor(name: string, options:IBoneWeightsMaterialOptions, scene: Scene) {
        super(name, scene);
        this.skeleton = options.skeleton;
        this.colorBase = options.colorBase ?? Color3.Black();
        this.colorZero = options.colorZero ?? Color3.Blue();
        this.colorQuarter = options.colorQuarter ?? Color3.Green();
        this.colorHalf = options.colorHalf ?? Color3.Yellow();
        this.colorFull = options.colorFull ?? Color3.Red();
        this.targetBoneIndex = options.targetBoneIndex ?? 0;
    }

    public needAlphaBlending(): boolean {
        return false;
    }

    public needAlphaTesting(): boolean {
        return false;
    }

    public getAlphaTestTexture(): Nullable<BaseTexture> {
        return null;
    }

  // Methods
  public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
    if (this.isFrozen) {
        if (subMesh.effect && subMesh.effect._wasPreviouslyReady) {
            return true;
        }
    }

    if (!subMesh._materialDefines) {
        subMesh._materialDefines = new BoneWeightsMaterialDefines();
    }

    var defines = <BoneWeightsMaterialDefines>subMesh._materialDefines;
    var scene = this.getScene();

    if (this._isReadyForSubMesh(subMesh)) {
        return true;
    }

    var engine = scene.getEngine();

    // Misc.
    MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);

    // Lights
    //defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, 0, true);

    // Values that need to be evaluated on every frame
    MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);

    // Attribs
    MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);
    //console.log(defines)

    // Get correct effect
    if (defines.isDirty) {
        defines.markAsProcessed();
        scene.resetCachedMaterial();

        // Fallbacks
        var fallbacks = new EffectFallbacks(); 
        if (defines.FOG) {
            fallbacks.addFallback(1, "FOG");
        }  

        MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, 0);

        if (defines.NUM_BONE_INFLUENCERS > 0) {
            fallbacks.addCPUSkinningFallback(0, mesh);
        }

        //Attributes
        var attribs = [VertexBuffer.PositionKind];

        if (defines.NORMAL) {
            attribs.push(VertexBuffer.NormalKind);
        } 

        MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
        //console.log(attribs)
        MaterialHelper.PrepareAttributesForInstances(attribs, defines);

        var shaderName = "boneWeights";
        var join = defines.toString();
        var uniforms = ["world", "view", "viewProjection", 'projection', 'viewProjection',
            'colorBase', 'colorZero', 'colorQuarter', 'colorHalf', 'colorFull', 'targetBoneIndex'           
        ];
        var samplers:string[] = [];
        var uniformBuffers = new Array<string>();

        MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
            uniformsNames: uniforms,
            uniformBuffersNames: uniformBuffers,
            samplers: samplers,
            defines: defines,
            maxSimultaneousLights: 0
        });
        console.log(uniforms)
        let effect = scene.getEngine().createEffect(shaderName,
            <IEffectCreationOptions>{
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: join,
                fallbacks: fallbacks,
                onCompiled: this.onCompiled,
                onError: this.onError,
                indexParameters: { maxSimultaneousLights: 0 }
            }, engine);
        
        effect.onBindObservable.add(()=>{
            effect.setColor3('colorBase', this.colorBase);
            effect.setColor3('colorZero', this.colorZero);
            effect.setColor3('colorQuarter', this.colorQuarter);
            effect.setColor3('colorHalf', this.colorHalf);
            effect.setColor3('colorFull', this.colorFull);
            effect.setFloat('targetBoneIndex', this.targetBoneIndex);
            //subMesh.transparencyMode = Material.MATERIAL_OPAQUE;
        })
        subMesh.setEffect(effect, defines);

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

    var defines = <BoneWeightsMaterialDefines>subMesh._materialDefines;
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

    // Bones
    MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

    if (this._mustRebind(scene, effect)) {
        MaterialHelper.BindEyePosition(effect, scene);
    }
  
    this._afterBind(mesh, this._activeEffect);
}

public getAnimatables(): IAnimatable[] {
    return []
}

public getActiveTextures(): BaseTexture[] {
    return []
}

public hasTexture(texture: BaseTexture): boolean {
    return false;    
}

public dispose(forceDisposeEffect?: boolean): void {
    super.dispose(forceDisposeEffect);
}

public getClassName(): string {
    return "BoneWeightsMaterial";
}

public clone(name: string): BoneWeightsMaterial {
    return SerializationHelper.Clone<BoneWeightsMaterial>(() => new BoneWeightsMaterial(name, {
        skeleton:this.skeleton,
        colorBase:this.colorBase,
        colorZero:this.colorZero,
        colorQuarter:this.colorQuarter,
        colorHalf:this.colorHalf,
        colorFull:this.colorFull
    }, this.getScene()), this);
}

public serialize(): any {
    var serializationObject = SerializationHelper.Serialize(this);
    serializationObject.customType = "BABYLON.BoneWeightsMaterial";
    return serializationObject;
}

// Statics
public static Parse(source: any, scene: Scene, rootUrl: string): BoneWeightsMaterial {
    return SerializationHelper.Parse(() => new BoneWeightsMaterial(source.name, {
        skeleton:source.skeleton,
        colorBase:source.colorBase,
        colorZero:source.colorZero,
        colorQuarter:source.colorQuarter,
        colorHalf:source.colorHalf,
        colorFull:source.colorFull
    }, scene), source, scene, rootUrl);
}

}

_TypeStore.RegisteredTypes["BABYLON.BoneWeightsMaterial"] = BoneWeightsMaterial;