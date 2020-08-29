
import { Matrix } from "babylonjs/Maths/math.vector";
import { Nullable } from "babylonjs/types";
import { IEffectCreationOptions } from "babylonjs/Materials/effect";

import { MaterialHelper } from "babylonjs/Materials/materialHelper";
import { PushMaterial } from "babylonjs/Materials/pushMaterial";

import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

import "./boneWeights.fragment";
import "./boneWeights.vertex";
import { EffectFallbacks } from 'babylonjs/Materials/effectFallbacks';
import { IBoneWeightsMaterialOptions } from "./IBoneWeightsMaterial";
import { Skeleton, Color3, Effect } from 'babylonjs';

const onCreatedEffectParameters = { effect: null as unknown as Effect, subMesh: null as unknown as Nullable<SubMesh> };
export class BoneWeightsMaterial extends PushMaterial {   

    public skeleton: Skeleton;
    public colorBase: Color3;
    public colorZero: Color3;
    public colorQuarter: Color3;
    public colorHalf: Color3;
    public colorFull: Color3;
    public targetBoneIndex: number;  
    private _renderId: number;
    private _multiview: boolean = false;
    private _cachedWorldViewProjectionMatrix = new Matrix();
    private _cachedWorldViewMatrix = new Matrix();
    private _cachedDefines: string;
    public uniforms : string[];   

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
        return (this.alpha < 1.0);
    }

    public needAlphaBlendingForMesh(mesh: AbstractMesh): boolean {
        return this.needAlphaBlending() || (mesh.visibility < 1.0);
    }

    public needAlphaTesting(): boolean {
        return false;
    } 

    // Methods
    /*public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
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
                'colorBase', 'colorZero', 'colorQuarter', 'colorHalf', 'colorFull', 'targetBoneIndex'
            ]
            var uniformBuffers = new Array<string>();

            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                defines: defines,
                maxSimultaneousLights: 4
            });

            subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                <IEffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: [],
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled2,
                    onError: this.onError2,
                    indexParameters: { maxSimultaneousLights: 4 }
                }, engine), defines);
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        subMesh.effect._wasPreviouslyReady = true;

        return true;
    }*/

    private _checkCache(mesh?: AbstractMesh, useInstances?: boolean): boolean {
        if (!mesh) {
            return true;
        }

        if (this._effect && (this._effect.defines.indexOf("#define INSTANCES") !== -1) !== useInstances) {
            return false;
        }

        return true;
    }

    /**
     * Specifies that the submesh is ready to be used
     * @param mesh defines the mesh to check
     * @param subMesh defines which submesh to check
     * @param useInstances specifies that instances should be used
     * @returns a boolean indicating that the submesh is ready or not
     */
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        return this.isReady(mesh, useInstances);
    }

    /**
     * Checks if the material is ready to render the requested mesh
     * @param mesh Define the mesh to render
     * @param useInstances Define whether or not the material is used with instances
     * @returns true if ready, otherwise false
     */
    public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
        if (this._effect && this.isFrozen) {
            if (this._effect._wasPreviouslyReady) {
                return true;
            }
        }

        var scene = this.getScene();
        var engine = scene.getEngine();

        if (!this.checkReadyOnEveryCall) {
            if (this._renderId === scene.getRenderId()) {
                if (this._checkCache(mesh, useInstances)) {
                    return true;
                }
            }
        }

        // Instances
        let defines = [];
        let attribs = [];
        let shaderUniforms:string[] = [
            'world', 'worldView', 'worldViewProjection', 'view', 'projection', 'viewProjection',
            'colorBase', 'colorZero', 'colorQuarter', 'colorHalf', 'colorFull', 'targetBoneIndex'
        ]
        let shaderSamplers:string[] = []
        var fallbacks = new EffectFallbacks();       

        attribs.push("position", "normal", "uv");  

        if (useInstances) {
            defines.push("#define INSTANCES");
            MaterialHelper.PushAttributesForInstances(attribs);
            if (mesh?.hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }

        // Bones
        let numInfluencers = 0;

        if (mesh && mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }

            const skeleton = mesh.skeleton;
            numInfluencers = mesh.numBoneInfluencers;

            defines.push("#define NUM_BONE_INFLUENCERS " + numInfluencers);
            fallbacks.addCPUSkinningFallback(0, mesh);

            if (skeleton.isUsingTextureForMatrices) {
                defines.push("#define BONETEXTURE");

                if (shaderUniforms.indexOf("boneTextureWidth") === -1) {
                    shaderUniforms.push("boneTextureWidth");
                }

                if (shaderSamplers.indexOf("boneSampler") === -1) {
                    shaderSamplers.push("boneSampler");
                }
            } else {
                defines.push("#define BonesPerMesh " + (skeleton.bones.length + 1));

                if (shaderUniforms.indexOf("mBones") === -1) {
                    shaderUniforms.push("mBones");
                }
            }

        } else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
        }
    
        // Alpha test
        if (mesh && this._shouldTurnAlphaTestOn(mesh)) {
            defines.push("#define ALPHATEST");
        }

        let shaderName = 'boneWeights',
            uniforms = shaderUniforms,
            uniformBuffers:string[] = [],
            samplers = shaderSamplers;

        var previousEffect = this._effect;
        var join = defines.join("\n");

        if (this._cachedDefines !== join) {
            this._cachedDefines = join;

            this._effect = engine.createEffect(shaderName, <IEffectCreationOptions>{
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: join,
                fallbacks: fallbacks,
                onCompiled: this.onCompiled,
                onError: this.onError,
                indexParameters: { maxSimultaneousMorphTargets: numInfluencers }
            }, engine);

            if (this._onEffectCreatedObservable) {
                onCreatedEffectParameters.effect = this._effect;
                this._onEffectCreatedObservable.notifyObservers(onCreatedEffectParameters);
            }
        }

        this.uniforms = uniforms

        if (!this._effect?.isReady() ?? true) {
            return false;
        }

        if (previousEffect !== this._effect) {
            scene.resetCachedMaterial();
        }

        this._renderId = scene.getRenderId();
        this._effect._wasPreviouslyReady = true;

        return true;
    }

    /**
     * Binds the world matrix to the material
     * @param world defines the world transformation matrix
     * @param effectOverride - If provided, use this effect instead of internal effect
     */
    public bindOnlyWorldMatrix(world: Matrix, effectOverride?: Nullable<Effect>): void {
        var scene = this.getScene();

        const effect = effectOverride ?? this._effect;

        if (!effect) {
            return;
        }

        if (this.uniforms.indexOf("world") !== -1) {
            effect.setMatrix("world", world);
        }

        if (this.uniforms.indexOf("worldView") !== -1) {
            world.multiplyToRef(scene.getViewMatrix(), this._cachedWorldViewMatrix);
            effect.setMatrix("worldView", this._cachedWorldViewMatrix);
        }

        if (this.uniforms.indexOf("worldViewProjection") !== -1) {
            world.multiplyToRef(scene.getTransformMatrix(), this._cachedWorldViewProjectionMatrix);
            effect.setMatrix("worldViewProjection", this._cachedWorldViewProjectionMatrix);
        }
    }

    /**
     * Binds the submesh to this material by preparing the effect and shader to draw
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh containing the submesh
     * @param subMesh defines the submesh to bind the material to
     */
    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        this.bind(world, mesh, subMesh._effectOverride);
    }

    /**
     * Binds the material to the mesh
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh to bind the material to
     * @param effectOverride - If provided, use this effect instead of internal effect
     */
    public bind(world: Matrix, mesh?: Mesh, effectOverride?: Nullable<Effect>): void {
        // Std values
        this.bindOnlyWorldMatrix(world, effectOverride);

        const effect = effectOverride ?? this._effect;

        if (effect && this.getScene().getCachedMaterial() !== this) {
            if (this.uniforms.indexOf("view") !== -1) {
                effect.setMatrix("view", this.getScene().getViewMatrix());
            }

            if (this.uniforms.indexOf("projection") !== -1) {
                effect.setMatrix("projection", this.getScene().getProjectionMatrix());
            }

            if (this.uniforms.indexOf("viewProjection") !== -1) {
                effect.setMatrix("viewProjection", this.getScene().getTransformMatrix());
                if (this._multiview) {
                    effect.setMatrix("viewProjectionR", this.getScene()._transformMatrixR);
                }
            }

            if (this.getScene().activeCamera && this.uniforms.indexOf("cameraPosition") !== -1) {
                effect.setVector3("cameraPosition", this.getScene().activeCamera!.globalPosition);
            }
        }

            // Bones
            if(effect){
                MaterialHelper.BindBonesParameters(mesh, effect);
            }
            const seffect = this._effect;

            this._effect = effect; // make sure the active effect is the right one if there are some observers for onBind that would need to get the current effect
            if(mesh){
                this._afterBind(mesh);
            }
            this._effect = seffect;        
    }   

    protected _afterBind(mesh: Mesh): void {
        super._afterBind(mesh);
        this.getScene()._cachedEffect = this._effect;
    }

    public dispose(forceDisposeEffect?: boolean): void {
        super.dispose(forceDisposeEffect);
    }

    public getClassName(): string {
        return "BoneWeightsMaterial";
    }

}

_TypeStore.RegisteredTypes["BABYLON.BoneWeightsMaterial"] = BoneWeightsMaterial;