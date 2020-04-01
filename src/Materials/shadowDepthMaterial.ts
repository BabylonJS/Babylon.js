import { Observer } from "../Misc/observable";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { SubMesh } from "../Meshes/subMesh";
import { Material } from "../Materials/material";
import { _TypeStore } from "../Misc/typeStore";
import { Effect, IEffectCreationOptions } from './effect';
import { AbstractMesh } from '../Meshes/abstractMesh';
import { Node } from '../node';

export interface IIOptionShadowDepthMaterial {
    remappedVariables?: string[];
}

export class ShadowDepthMaterial {

    private _scene: Scene;
    private _options?: IIOptionShadowDepthMaterial;
    private _baseMaterial: Material;
    private _onEffectCreatedObserver: Nullable<Observer<{ effect: Effect, subMesh: Nullable<SubMesh>}>>;
    private _subMeshToEffect: Map<Nullable<SubMesh>, { origEffect: Effect, depthEffect: Nullable<Effect>, depthDefines: string, token: string }>;
    private _meshes: Map<AbstractMesh, Nullable<Observer<Node>>>;

    constructor(baseMaterial: Material, scene: Scene, options?: IIOptionShadowDepthMaterial) {
        this._baseMaterial = baseMaterial;
        this._scene = scene;
        this._options = options;

        this._subMeshToEffect = new Map();
        this._meshes = new Map();

        this._onEffectCreatedObserver = this._baseMaterial.onEffectCreatedObservable.add((params: { effect: Effect, subMesh: Nullable<SubMesh> }) => {
            //console.log(new Date(), this, params.subMesh, params.effect);

            const mesh = params.subMesh?.getMesh();

            if (mesh && !this._meshes.has(mesh)) {
                this._meshes.set(mesh,
                    mesh.onDisposeObservable.add((mesh: Node) => {
                        const iterator = this._subMeshToEffect.keys();
                        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
                            const subMesh = key.value;
                            if (subMesh?.getMesh() === mesh as AbstractMesh) {
                                this._subMeshToEffect.delete(subMesh);
                            }
                        }
                    })
                );
            }

            this._subMeshToEffect.set(params.subMesh, { origEffect: params.effect, depthEffect: null, depthDefines: "", token: "" + (new Date()).getTime() + params.subMesh?.getMesh().name + "_" + params.subMesh?._id });
        });
    }

    public getEffect(subMesh: Nullable<SubMesh>): Nullable<Effect> {
        return this._subMeshToEffect.get(subMesh)?.depthEffect ?? this._subMeshToEffect.get(null)?.depthEffect ?? null;
    }

    public isReadyForSubMesh(subMesh: SubMesh, defines: string[]): boolean {
        return this._makeEffect(subMesh, defines)?.isReady() ?? false;
    }

    public dispose(): void {
        this._baseMaterial.onEffectCreatedObservable.remove(this._onEffectCreatedObserver);
        this._onEffectCreatedObserver = null;

        const iterator = this._meshes.entries();
        for (let entry = iterator.next(); entry.done !== true; entry = iterator.next()) {
            const [mesh, observer] = entry.value;

            mesh.onDisposeObservable.remove(observer);
        }
    }

    private _makeEffect(subMesh: Nullable<SubMesh>, defines: string[]): Nullable<Effect> {
        const params = this._subMeshToEffect.get(subMesh) ?? this._subMeshToEffect.get(null);

        if (!params) {
            return null;
        }

        let join = defines.join("\n");

        if (params.depthEffect) {
            if (join === params.depthDefines) {
                // we already created the depth effect and it is still up to date
                return params.depthEffect;
            }
        }

        params.depthDefines = join;

        // the depth effect is either out of date or has not been created yet
        let vertexCode = params.origEffect.vertexSourceCode,
            fragmentCode = params.origEffect.fragmentSourceCode;

        //console.log(new Date(), this, vertexCode, fragmentCode);

        const vertexNormalBiasCode = this._options && this._options.remappedVariables ? `#include<shadowMapVertexNormalBias>(${this._options.remappedVariables.join(",")})` : Effect.IncludesShadersStore["shadowMapVertexNormalBias"],
              vertexMetricCode = this._options && this._options.remappedVariables ? `#include<shadowMapVertexMetric>(${this._options.remappedVariables.join(",")})` : Effect.IncludesShadersStore["shadowMapVertexMetric"],
              fragmentBlockCode = Effect.IncludesShadersStore["shadowMapFragment"];

        vertexCode = vertexCode.replace(/void\s+?main/g, Effect.IncludesShadersStore["shadowMapVertexDeclaration"] + "\r\nvoid main");
        vertexCode = vertexCode.replace(/#define SHADOWDEPTH_NORMALBIAS/g, vertexNormalBiasCode);

        if (vertexCode.indexOf("#define SHADOWDEPTH_METRIC") !== -1) {
            vertexCode = vertexCode.replace(/#define SHADOWDEPTH_METRIC/g, vertexMetricCode);
        } else {
            vertexCode = vertexCode.replace(/}\s*$/g, vertexMetricCode + "\r\n}");
        }
        vertexCode = vertexCode.replace(/#define SHADER_NAME.*?\n|out vec4 glFragColor;\n/g, "");

        fragmentCode = fragmentCode.replace(/void\s+?main/g, Effect.IncludesShadersStore["shadowMapFragmentDeclaration"] + "\r\nvoid main");
        if (fragmentCode.indexOf("#define SHADOWDEPTH_FRAGMENT") !== -1) {
            fragmentCode = vertexCode.replace(/#define SHADOWDEPTH_FRAGMENT/g, fragmentBlockCode);
        } else {
            fragmentCode = fragmentCode.replace(/}\s*$/g, fragmentBlockCode + "\r\n}");
        }
        fragmentCode = fragmentCode.replace(/#define SHADER_NAME.*?\n|out vec4 glFragColor;\n/g, "");

        const uniforms = params.origEffect.getUniformNames().slice();

        uniforms.push("biasAndScaleSM", "depthValuesSM", "lightDataSM");

        params.depthEffect = this._scene.getEngine().createEffect({
            vertexSource: vertexCode,
            fragmentSource: fragmentCode,
            vertexToken: params.token,
            fragmentToken: params.token,
        }, <IEffectCreationOptions>{
            attributes: params.origEffect.getAttributesNames(),
            uniformsNames: uniforms,
            uniformBuffersNames: params.origEffect.getUniformBuffersNames(),
            samplers: params.origEffect.getSamplers(),
            defines: join,
            indexParameters: params.origEffect.getIndexParameters(),
        }, this._scene.getEngine());

        return params.depthEffect;
    }
}
