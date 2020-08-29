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
import { Skeleton } from 'babylonjs/Bones/skeleton';

import "./boneWeights.fragment";
import "./boneWeights.vertex";
import { EffectFallbacks } from 'babylonjs/Materials/effectFallbacks';

import { IBoneWeightsMaterialOptions } from "./IBoneWeightsMaterial";


class BoneWeightsMaterialDefines extends MaterialDefines {
    public ALPHATEST = false;
    public NORMAL = false; 
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0; 
    constructor() {
        super();
        this.rebuild();
    }
}


export class BoneWeightsMaterial extends PushMaterial{  

    public skeleton: Skeleton;

    public colorBase: Color3;

    public colorZero: Color3;

    public colorQuarter: Color3;

    public colorHalf: Color3;

    public colorFull: Color3;

    public targetBoneIndex: number; 

    private _disableLighting = true;
    public disableLighting: boolean;

    private _maxSimultaneousLights = 0;
    public maxSimultaneousLights: number;
    
    constructor(name: string, options:IBoneWeightsMaterialOptions, scene: Scene) {     
        super(name, scene)
        this.skeleton = options.skeleton;
        this.colorBase = options.colorBase ?? Color3.Black();
        this.colorZero = options.colorZero ?? Color3.Blue();
        this.colorQuarter = options.colorQuarter ?? Color3.Green();
        this.colorHalf = options.colorHalf ?? Color3.Yellow();
        this.colorFull = options.colorFull ?? Color3.Red();
        this.targetBoneIndex = options.targetBoneIndex ?? 0;
    }

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

        // Lights
        defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();

            // Fallbacks
            var fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);

            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }

            //Attributes
            var attribs = [VertexBuffer.PositionKind];

            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }

            MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            MaterialHelper.PrepareAttributesForInstances(attribs, defines);
   
            var shaderName = "boneWeights";
            var join = defines.toString();
            var uniforms = [
                'world', 'worldView', 'worldViewProjection', 'view', 'projection', 'viewProjection',
                'colorBase', 'colorZero', 'colorQuarter', 'colorHalf', 'colorFull', 'targetBoneIndex',  "mBones"
            ];
            var samplers:string[] = [];
            var uniformBuffers = new Array<string>();

            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: this.maxSimultaneousLights
            });
            subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                <IEffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights - 1 }
                }, engine), defines);

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
        
        this._afterBind(mesh, this._activeEffect);
    }

    public getAnimatables(): IAnimatable[] { 
        return [];
    }

    public getActiveTextures(): BaseTexture[] {
        return [];
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

    public getClassName(): string {
        return "BoneWeightsMaterial";
    }

}

_TypeStore.RegisteredTypes["BABYLON.BoneWeightsMaterial"] = BoneWeightsMaterial;