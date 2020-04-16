import { Texture } from "babylonjs/Materials/Textures/texture";
import { Effect } from "babylonjs/Materials/effect";
import { MaterialDefines } from "babylonjs/Materials/materialDefines";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

export class ShaderAlebdoParts {

    constructor() { }

    public Fragment_Begin: string;
    public Fragment_Definitions: string;
    public Fragment_MainBegin: string;

    // albedoColor
    public Fragment_Custom_Albedo: string;
    // lights
    public Fragment_Before_Lights: string;
    // roughness
    public Fragment_Custom_MetallicRoughness: string;
    // microsurface
    public Fragment_Custom_MicroSurface: string;
    // fog
    public Fragment_Before_Fog: string;
    // alpha
    public Fragment_Custom_Alpha: string;

    public Fragment_Before_FragColor: string;

    public Vertex_Begin: string;
    public Vertex_Definitions: string;
    public Vertex_MainBegin: string;

    // positionUpdated
    public Vertex_Before_PositionUpdated: string;

    // normalUpdated
    public Vertex_Before_NormalUpdated: string;

    // worldPosComputed
    public Vertex_After_WorldPosComputed: string;

    // mainEnd
    public Vertex_MainEnd: string;
}

export class PBRCustomMaterial extends PBRMaterial {
    public static ShaderIndexer = 1;
    public CustomParts: ShaderAlebdoParts;
    _isCreatedShader: boolean;
    _createdShaderName: string;
    _customUniform: string[];
    _newUniforms: string[];
    _newUniformInstances: { [name: string]: any };
    _newSamplerInstances: { [name: string]: Texture };
    _customAttributes: string[];

    public FragmentShader: string;
    public VertexShader: string;

    public AttachAfterBind(mesh: Mesh, effect: Effect) {
        if (this._newUniformInstances) {
            for (let el in this._newUniformInstances) {
                const ea = el.toString().split('-');
                if (ea[0] == 'vec2') {
                    effect.setVector2(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'vec3') {
                    effect.setVector3(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'vec4') {
                    effect.setVector4(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'mat4') {
                    effect.setMatrix(ea[1], this._newUniformInstances[el]);
                }
                else if (ea[0] == 'float') {
                    effect.setFloat(ea[1], this._newUniformInstances[el]);
                }
            }
        }
        if (this._newSamplerInstances) {
            for (let el in this._newSamplerInstances) {
                const ea = el.toString().split('-');
                if (ea[0] == 'sampler2D' && this._newSamplerInstances[el].isReady && this._newSamplerInstances[el].isReady()) {
                    effect.setTexture(ea[1], this._newSamplerInstances[el]);
                }
            }
        }
    }

    public ReviewUniform(name: string, arr: string[]): string[] {
        if (name == "uniform" && this._newUniforms) {
            for (var ind = 0; ind < this._newUniforms.length ; ind ++) {
                if (this._customUniform[ind].indexOf('sampler') == -1) {
                    arr.push(this._newUniforms[ind]);
                }
            }
        }
        if (name == "sampler" && this._newUniforms) {
            for (var ind = 0; ind < this._newUniforms.length ; ind ++) {
                if (this._customUniform[ind].indexOf('sampler') != -1) {
                    arr.push(this._newUniforms[ind]);
                }
            }
        }
        return arr;
    }

    public Builder(shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: MaterialDefines | string[], attributes?: string[]): string {

        if (attributes && this._customAttributes && this._customAttributes.length > 0) {
            attributes.push(...this._customAttributes);
        }

        this.ReviewUniform("uniform", uniforms);
        this.ReviewUniform("sampler", samplers);

        if (this._isCreatedShader) {
            return this._createdShaderName;
        }
        this._isCreatedShader = false;

        PBRCustomMaterial.ShaderIndexer++;
        var name: string = "custom_" + PBRCustomMaterial.ShaderIndexer;

        var fn_afterBind = this._afterBind.bind(this);
        this._afterBind = (m, e) => {
            if (!e) {
                return;
            }
            this.AttachAfterBind(m, e);
            try { fn_afterBind(m, e); }
            catch (e) { }
        };

        Effect.ShadersStore[name + "VertexShader"] = this.VertexShader
            .replace('#define CUSTOM_VERTEX_BEGIN', (this.CustomParts.Vertex_Begin ? this.CustomParts.Vertex_Begin : ""))
            .replace('#define CUSTOM_VERTEX_DEFINITIONS', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Vertex_Definitions ? this.CustomParts.Vertex_Definitions : ""))
            .replace('#define CUSTOM_VERTEX_MAIN_BEGIN', (this.CustomParts.Vertex_MainBegin ? this.CustomParts.Vertex_MainBegin : ""))
            .replace('#define CUSTOM_VERTEX_UPDATE_POSITION', (this.CustomParts.Vertex_Before_PositionUpdated ? this.CustomParts.Vertex_Before_PositionUpdated : ""))
            .replace('#define CUSTOM_VERTEX_UPDATE_NORMAL', (this.CustomParts.Vertex_Before_NormalUpdated ? this.CustomParts.Vertex_Before_NormalUpdated : ""))
            .replace('#define CUSTOM_VERTEX_MAIN_END', (this.CustomParts.Vertex_MainEnd ? this.CustomParts.Vertex_MainEnd : ""));

        if (this.CustomParts.Vertex_After_WorldPosComputed) {
            Effect.ShadersStore[name + "VertexShader"] = Effect.ShadersStore[name + "VertexShader"].replace('#define CUSTOM_VERTEX_UPDATE_WORLDPOS', this.CustomParts.Vertex_After_WorldPosComputed);
        }

        Effect.ShadersStore[name + "PixelShader"] = this.FragmentShader
            .replace('#define CUSTOM_FRAGMENT_BEGIN', (this.CustomParts.Fragment_Begin ? this.CustomParts.Fragment_Begin : ""))
            .replace('#define CUSTOM_FRAGMENT_MAIN_BEGIN', (this.CustomParts.Fragment_MainBegin ? this.CustomParts.Fragment_MainBegin : ""))
            .replace('#define CUSTOM_FRAGMENT_DEFINITIONS', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Fragment_Definitions ? this.CustomParts.Fragment_Definitions : ""))
            .replace('#define CUSTOM_FRAGMENT_UPDATE_ALBEDO', (this.CustomParts.Fragment_Custom_Albedo ? this.CustomParts.Fragment_Custom_Albedo : ""))
            .replace('#define CUSTOM_FRAGMENT_UPDATE_ALPHA', (this.CustomParts.Fragment_Custom_Alpha ? this.CustomParts.Fragment_Custom_Alpha : ""))
            .replace('#define CUSTOM_FRAGMENT_BEFORE_LIGHTS', (this.CustomParts.Fragment_Before_Lights ? this.CustomParts.Fragment_Before_Lights : ""))
            .replace('#define CUSTOM_FRAGMENT_UPDATE_METALLICROUGHNESS', (this.CustomParts.Fragment_Custom_MetallicRoughness ? this.CustomParts.Fragment_Custom_MetallicRoughness : ""))
            .replace('#define CUSTOM_FRAGMENT_UPDATE_MICROSURFACE', (this.CustomParts.Fragment_Custom_MicroSurface ? this.CustomParts.Fragment_Custom_MicroSurface : ""))
            .replace('#define CUSTOM_FRAGMENT_BEFORE_FOG', (this.CustomParts.Fragment_Before_Fog ? this.CustomParts.Fragment_Before_Fog : ""))
            .replace('#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR', (this.CustomParts.Fragment_Before_FragColor ? this.CustomParts.Fragment_Before_FragColor : ""));

        this._isCreatedShader = true;
        this._createdShaderName = name;

        return name;
    }

    constructor(name: string, scene: Scene) {
        super(name, scene);
        this.CustomParts = new ShaderAlebdoParts();
        this.customShaderNameResolve = this.Builder;

        this.FragmentShader = Effect.ShadersStore["pbrPixelShader"];
        this.VertexShader = Effect.ShadersStore["pbrVertexShader"];
    }

    public AddUniform(name: string, kind: string, param: any): PBRCustomMaterial {
        if (!this._customUniform) {
            this._customUniform = new Array();
            this._newUniforms = new Array();
            this._newSamplerInstances = {};
            this._newUniformInstances = {};
        }
        if (param) {
            if (kind.indexOf("sampler") == -1) {
                (<any>this._newSamplerInstances)[kind + "-" + name] = param;
            }
            else {
                (<any>this._newUniformInstances)[kind + "-" + name] = param;
            }
        }
        this._customUniform.push("uniform " + kind + " " + name + ";");
        this._newUniforms.push(name);

        return this;
    }

    public AddAttribute(name: string): PBRCustomMaterial {
        if (!this._customAttributes) {
            this._customAttributes = [];
        }

        this._customAttributes.push(name);

        return this;
    }

    public Fragment_Begin(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_Begin = shaderPart;
        return this;
    }

    public Fragment_Definitions(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_Definitions = shaderPart;
        return this;
    }

    public Fragment_MainBegin(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_MainBegin = shaderPart;
        return this;
    }

    public Fragment_Custom_Albedo(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_Custom_Albedo = shaderPart.replace("result", "surfaceAlbedo");
        return this;
    }

    public Fragment_Custom_Alpha(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_Custom_Alpha = shaderPart.replace("result", "alpha");
        return this;
    }

    public Fragment_Before_Lights(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_Before_Lights = shaderPart;
        return this;
    }

    public Fragment_Custom_MetallicRoughness(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_Custom_MetallicRoughness = shaderPart;
        return this;
    }

    public Fragment_Custom_MicroSurface(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_Custom_MicroSurface = shaderPart;
        return this;
    }

    public Fragment_Before_Fog(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_Before_Fog = shaderPart;
        return this;
    }

    public Fragment_Before_FragColor(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result", "color");
        return this;
    }

    public Vertex_Begin(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Vertex_Begin = shaderPart;
        return this;
    }

    public Vertex_Definitions(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Vertex_Definitions = shaderPart;
        return this;
    }

    public Vertex_MainBegin(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Vertex_MainBegin = shaderPart;
        return this;
    }

    public Vertex_Before_PositionUpdated(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Vertex_Before_PositionUpdated = shaderPart.replace("result", "positionUpdated");
        return this;
    }

    public Vertex_Before_NormalUpdated(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Vertex_Before_NormalUpdated = shaderPart.replace("result", "normalUpdated");
        return this;
    }

    public Vertex_After_WorldPosComputed(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Vertex_After_WorldPosComputed = shaderPart;
        return this;
    }

    public Vertex_MainEnd(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Vertex_MainEnd = shaderPart;
        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.PBRCustomMaterial"] = PBRCustomMaterial;
