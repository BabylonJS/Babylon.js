/* eslint-disable @typescript-eslint/naming-convention */
import type { Texture } from "core/Materials/Textures/texture";
import { Effect } from "core/Materials/effect";
import type { MaterialDefines } from "core/Materials/materialDefines";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Mesh } from "core/Meshes/mesh";
import type { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";
import { ShaderCodeInliner } from "core/Engines/Processors/shaderCodeInliner";
import type { ICustomShaderNameResolveOptions } from "core/Materials/material";
import { Color3, Color4 } from "core/Maths/math.color";
import type { Nullable } from "core/types";

export class ShaderAlbedoParts {
    constructor() {}

    public Fragment_Begin: string;
    public Fragment_Definitions: string;
    public Fragment_MainBegin: string;
    public Fragment_MainEnd: string;

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
    // color composition
    public Fragment_Before_FinalColorComposition: string;
    // frag color
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

/**
 * @deprecated use ShaderAlbedoParts instead.
 */
export const ShaderAlebdoParts = ShaderAlbedoParts;

export class PBRCustomMaterial extends PBRMaterial {
    public static ShaderIndexer = 1;
    public CustomParts: ShaderAlbedoParts;
    _createdShaderName: string;
    _customUniform: string[];
    _newUniforms: string[];
    _newUniformInstances: { [name: string]: any };
    _newSamplerInstances: { [name: string]: Texture };
    _customAttributes: string[];

    public FragmentShader: string;
    public VertexShader: string;

    public AttachAfterBind(mesh: Mesh | undefined, effect: Effect) {
        if (this._newUniformInstances) {
            for (const el in this._newUniformInstances) {
                const ea = el.toString().split("-");
                if (ea[0] == "vec2") {
                    effect.setVector2(ea[1], this._newUniformInstances[el]);
                } else if (ea[0] == "vec3") {
                    if (this._newUniformInstances[el] instanceof Color3) {
                        effect.setColor3(ea[1], this._newUniformInstances[el]);
                    } else {
                        effect.setVector3(ea[1], this._newUniformInstances[el]);
                    }
                } else if (ea[0] == "vec4") {
                    if (this._newUniformInstances[el] instanceof Color4) {
                        effect.setDirectColor4(ea[1], this._newUniformInstances[el]);
                    } else {
                        effect.setVector4(ea[1], this._newUniformInstances[el]);
                    }
                    effect.setVector4(ea[1], this._newUniformInstances[el]);
                } else if (ea[0] == "mat4") {
                    effect.setMatrix(ea[1], this._newUniformInstances[el]);
                } else if (ea[0] == "float") {
                    effect.setFloat(ea[1], this._newUniformInstances[el]);
                }
            }
        }
        if (this._newSamplerInstances) {
            for (const el in this._newSamplerInstances) {
                const ea = el.toString().split("-");
                if (ea[0] == "sampler2D" && this._newSamplerInstances[el].isReady && this._newSamplerInstances[el].isReady()) {
                    effect.setTexture(ea[1], this._newSamplerInstances[el]);
                }
            }
        }
    }

    public ReviewUniform(name: string, arr: string[]): string[] {
        if (name == "uniform" && this._newUniforms) {
            for (let ind = 0; ind < this._newUniforms.length; ind++) {
                if (this._customUniform[ind].indexOf("sampler") == -1) {
                    arr.push(this._newUniforms[ind].replace(/\[\d*\]/g, ""));
                }
            }
        }
        if (name == "sampler" && this._newUniforms) {
            for (let ind = 0; ind < this._newUniforms.length; ind++) {
                if (this._customUniform[ind].indexOf("sampler") != -1) {
                    arr.push(this._newUniforms[ind].replace(/\[\d*\]/g, ""));
                }
            }
        }
        return arr;
    }

    public Builder(
        shaderName: string,
        uniforms: string[],
        uniformBuffers: string[],
        samplers: string[],
        defines: MaterialDefines | string[],
        attributes?: string[],
        options?: ICustomShaderNameResolveOptions
    ): string {
        if (options) {
            const currentProcessing = options.processFinalCode;
            options.processFinalCode = (type: string, code: string) => {
                if (type === "vertex") {
                    return currentProcessing ? currentProcessing(type, code) : code;
                }
                const sci = new ShaderCodeInliner(code);
                sci.inlineToken = "#define pbr_inline";
                sci.processCode();
                return currentProcessing ? currentProcessing(type, sci.code) : sci.code;
            };
        }

        if (attributes && this._customAttributes && this._customAttributes.length > 0) {
            attributes.push(...this._customAttributes);
        }

        this.ReviewUniform("uniform", uniforms);
        this.ReviewUniform("sampler", samplers);

        const name = this._createdShaderName;

        if (Effect.ShadersStore[name + "VertexShader"] && Effect.ShadersStore[name + "PixelShader"]) {
            return name;
        }
        Effect.ShadersStore[name + "VertexShader"] = this._injectCustomCode(this.VertexShader, "vertex");
        Effect.ShadersStore[name + "PixelShader"] = this._injectCustomCode(this.FragmentShader, "fragment");

        return name;
    }

    protected _injectCustomCode(code: string, shaderType: string): string {
        const customCode = this._getCustomCode(shaderType);

        for (const point in customCode) {
            const injectedCode = customCode[point];

            if (injectedCode && injectedCode.length > 0) {
                const fullPointName = "#define " + point;
                code = code.replace(fullPointName, "\n" + injectedCode + "\n" + fullPointName);
            }
        }

        return code;
    }

    protected _getCustomCode(shaderType: string): { [pointName: string]: string } {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_BEGIN: this.CustomParts.Vertex_Begin,
                CUSTOM_VERTEX_DEFINITIONS: (this._customUniform?.join("\n") || "") + (this.CustomParts.Vertex_Definitions || ""),
                CUSTOM_VERTEX_MAIN_BEGIN: this.CustomParts.Vertex_MainBegin,
                CUSTOM_VERTEX_UPDATE_POSITION: this.CustomParts.Vertex_Before_PositionUpdated,
                CUSTOM_VERTEX_UPDATE_NORMAL: this.CustomParts.Vertex_Before_NormalUpdated,
                CUSTOM_VERTEX_MAIN_END: this.CustomParts.Vertex_MainEnd,
                CUSTOM_VERTEX_UPDATE_WORLDPOS: this.CustomParts.Vertex_After_WorldPosComputed,
            };
        }
        return {
            CUSTOM_FRAGMENT_BEGIN: this.CustomParts.Fragment_Begin,
            CUSTOM_FRAGMENT_MAIN_BEGIN: this.CustomParts.Fragment_MainBegin,
            CUSTOM_FRAGMENT_DEFINITIONS: (this._customUniform?.join("\n") || "") + (this.CustomParts.Fragment_Definitions || ""),
            CUSTOM_FRAGMENT_UPDATE_ALBEDO: this.CustomParts.Fragment_Custom_Albedo,
            CUSTOM_FRAGMENT_UPDATE_ALPHA: this.CustomParts.Fragment_Custom_Alpha,
            CUSTOM_FRAGMENT_BEFORE_LIGHTS: this.CustomParts.Fragment_Before_Lights,
            CUSTOM_FRAGMENT_UPDATE_METALLICROUGHNESS: this.CustomParts.Fragment_Custom_MetallicRoughness,
            CUSTOM_FRAGMENT_UPDATE_MICROSURFACE: this.CustomParts.Fragment_Custom_MicroSurface,
            CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION: this.CustomParts.Fragment_Before_FinalColorComposition,
            CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: this.CustomParts.Fragment_Before_FragColor,
            CUSTOM_FRAGMENT_MAIN_END: this.CustomParts.Fragment_MainEnd,
            CUSTOM_FRAGMENT_BEFORE_FOG: this.CustomParts.Fragment_Before_Fog,
        };
    }

    constructor(name: string, scene?: Scene) {
        super(name, scene);
        this.CustomParts = new ShaderAlbedoParts();
        this.customShaderNameResolve = this.Builder;

        this.FragmentShader = Effect.ShadersStore["pbrPixelShader"];
        this.VertexShader = Effect.ShadersStore["pbrVertexShader"];

        this.FragmentShader = this.FragmentShader.replace(/#include<pbrBlockAlbedoOpacity>/g, Effect.IncludesShadersStore["pbrBlockAlbedoOpacity"]);
        this.FragmentShader = this.FragmentShader.replace(/#include<pbrBlockReflectivity>/g, Effect.IncludesShadersStore["pbrBlockReflectivity"]);
        this.FragmentShader = this.FragmentShader.replace(/#include<pbrBlockFinalColorComposition>/g, Effect.IncludesShadersStore["pbrBlockFinalColorComposition"]);

        PBRCustomMaterial.ShaderIndexer++;
        this._createdShaderName = "custompbr_" + PBRCustomMaterial.ShaderIndexer;
    }

    protected _afterBind(mesh?: Mesh, effect: Nullable<Effect> = null): void {
        if (!effect) {
            return;
        }
        this.AttachAfterBind(mesh, effect);
        try {
            super._afterBind(mesh, effect);
        } catch (e) {}
    }

    public AddUniform(name: string, kind: string, param: any): PBRCustomMaterial {
        if (!this._customUniform) {
            this._customUniform = new Array();
            this._newUniforms = new Array();
            this._newSamplerInstances = {};
            this._newUniformInstances = {};
        }
        if (param) {
            if (kind.indexOf("sampler") != -1) {
                (<any>this._newSamplerInstances)[kind + "-" + name] = param;
            } else {
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

    public Fragment_Before_FinalColorComposition(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_Before_FinalColorComposition = shaderPart;
        return this;
    }

    public Fragment_Before_FragColor(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result", "color");
        return this;
    }

    public Fragment_MainEnd(shaderPart: string): PBRCustomMaterial {
        this.CustomParts.Fragment_MainEnd = shaderPart;
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

RegisterClass("BABYLON.PBRCustomMaterial", PBRCustomMaterial);
