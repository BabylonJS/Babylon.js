/* eslint-disable @typescript-eslint/naming-convention */
import type { Texture } from "core/Materials/Textures/texture";
import { Effect } from "core/Materials/effect";
import type { MaterialDefines } from "core/Materials/materialDefines";
import { StandardMaterial } from "core/Materials/standardMaterial";
import type { Mesh } from "core/Meshes/mesh";
import type { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";
import { Color3, Color4 } from "core/Maths/math.color";
import type { Nullable } from "core/types";
import type { SubMesh } from "core/Meshes/subMesh";

/**
 * Structure of a custom shader
 */
export class CustomShaderStructure {
    /**
     * Fragment store
     */
    public FragmentStore: string;
    /**
     * Vertex store
     */
    public VertexStore: string;

    constructor() {}
}

/**
 * Parts of a shader
 */
export class ShaderSpecialParts {
    constructor() {}

    /**
     * Beginning of the fragment shader
     */
    public Fragment_Begin: string;
    /**
     * Variable definitions of the fragment shader
     */
    public Fragment_Definitions: string;
    /**
     * Beginning of the fragment main function
     */
    public Fragment_MainBegin: string;
    /**
     * End of the fragment main function
     */
    public Fragment_MainEnd: string;

    /**
     * Diffuse color calculation
     */
    public Fragment_Custom_Diffuse: string;
    /**
     * Before lightning computations
     */
    public Fragment_Before_Lights: string;
    /**
     * Before fog computations
     */
    public Fragment_Before_Fog: string;
    /**
     * Alpha calculations
     */
    public Fragment_Custom_Alpha: string;
    /**
     * Before frag color is assigned
     */
    public Fragment_Before_FragColor: string;
    /**
     * Beginning of the vertex shader
     */
    public Vertex_Begin: string;
    /**
     * Variable definitions of the vertex shader
     */
    public Vertex_Definitions: string;
    /**
     * Start of the main function of the vertex shader
     */
    public Vertex_MainBegin: string;

    /**
     * Before the world position computation
     */
    public Vertex_Before_PositionUpdated: string;

    /**
     * Before the normal computation
     */
    public Vertex_Before_NormalUpdated: string;

    /**
     * After the world position has been computed
     */
    public Vertex_After_WorldPosComputed: string;

    /**
     * Main end of the vertex shader
     */
    public Vertex_MainEnd: string;
}

/**
 * Customized material
 */
export class CustomMaterial extends StandardMaterial {
    /**
     * Index for each created shader
     */
    public static ShaderIndexer = 1;
    /**
     * Custom shader structure
     */
    public CustomParts: ShaderSpecialParts;
    /**
     * Name of the shader
     */
    public _createdShaderName: string;
    /**
     * List of custom uniforms
     */
    public _customUniform: string[];
    /**
     * Names of the new uniforms
     */
    public _newUniforms: string[];
    /**
     * Instances of the new uniform objects
     */
    public _newUniformInstances: { [name: string]: any };
    /**
     * Instances of the new sampler objects
     */
    public _newSamplerInstances: { [name: string]: Texture };
    /**
     * List of the custom attributes
     */
    public _customAttributes: string[];

    /**
     * Fragment shader string
     */
    public FragmentShader: string;
    /**
     * Vertex shader string
     */
    public VertexShader: string;

    /**
     * Runs after the material is bound to a mesh
     * @param mesh mesh bound
     * @param effect bound effect used to render
     */
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

    /**
     * @internal
     */
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

    /**
     * Builds the material
     * @param shaderName name of the shader
     * @param uniforms list of uniforms
     * @param uniformBuffers list of uniform buffers
     * @param samplers list of samplers
     * @param defines list of defines
     * @param attributes list of attributes
     * @returns the shader name
     */
    public Builder(shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: MaterialDefines | string[], attributes?: string[]): string {
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
            CUSTOM_FRAGMENT_DEFINITIONS: (this._customUniform?.join("\n") || "") + (this.CustomParts.Fragment_Definitions || ""),
            CUSTOM_FRAGMENT_MAIN_BEGIN: this.CustomParts.Fragment_MainBegin,
            CUSTOM_FRAGMENT_UPDATE_DIFFUSE: this.CustomParts.Fragment_Custom_Diffuse,
            CUSTOM_FRAGMENT_UPDATE_ALPHA: this.CustomParts.Fragment_Custom_Alpha,
            CUSTOM_FRAGMENT_BEFORE_LIGHTS: this.CustomParts.Fragment_Before_Lights,
            CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: this.CustomParts.Fragment_Before_FragColor,
            CUSTOM_FRAGMENT_MAIN_END: this.CustomParts.Fragment_MainEnd,
            CUSTOM_FRAGMENT_BEFORE_FOG: this.CustomParts.Fragment_Before_Fog,
        };
    }

    constructor(name: string, scene?: Scene) {
        super(name, scene);
        this.CustomParts = new ShaderSpecialParts();
        this.customShaderNameResolve = this.Builder;

        this.FragmentShader = Effect.ShadersStore["defaultPixelShader"];
        this.VertexShader = Effect.ShadersStore["defaultVertexShader"];

        CustomMaterial.ShaderIndexer++;
        this._createdShaderName = "custom_" + CustomMaterial.ShaderIndexer;
    }

    protected _afterBind(mesh?: Mesh, effect: Nullable<Effect> = null, subMesh?: SubMesh): void {
        if (!effect) {
            return;
        }
        this.AttachAfterBind(mesh, effect);
        try {
            super._afterBind(mesh, effect, subMesh);
        } catch (e) {}
    }

    /**
     * Adds a new uniform to the shader
     * @param name the name of the uniform to add
     * @param kind the type of the uniform to add
     * @param param the value of the uniform to add
     * @returns the current material
     */
    public AddUniform(name: string, kind: string, param: any): CustomMaterial {
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

    /**
     * Adds a custom attribute
     * @param name the name of the attribute
     * @returns the current material
     */
    public AddAttribute(name: string): CustomMaterial {
        if (!this._customAttributes) {
            this._customAttributes = [];
        }

        this._customAttributes.push(name);

        return this;
    }

    /**
     * Sets the code on Fragment_Begin portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Fragment_Begin(shaderPart: string): CustomMaterial {
        this.CustomParts.Fragment_Begin = shaderPart;
        return this;
    }

    /**
     * Sets the code on Fragment_Definitions portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Fragment_Definitions(shaderPart: string): CustomMaterial {
        this.CustomParts.Fragment_Definitions = shaderPart;
        return this;
    }

    /**
     * Sets the code on Fragment_MainBegin portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Fragment_MainBegin(shaderPart: string): CustomMaterial {
        this.CustomParts.Fragment_MainBegin = shaderPart;
        return this;
    }

    /**
     * Sets the code on Fragment_MainEnd portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Fragment_MainEnd(shaderPart: string): CustomMaterial {
        this.CustomParts.Fragment_MainEnd = shaderPart;
        return this;
    }

    /**
     * Sets the code on Fragment_Custom_Diffuse portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Fragment_Custom_Diffuse(shaderPart: string): CustomMaterial {
        this.CustomParts.Fragment_Custom_Diffuse = shaderPart.replace("result", "diffuseColor");
        return this;
    }

    /**
     * Sets the code on Fragment_Custom_Alpha portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Fragment_Custom_Alpha(shaderPart: string): CustomMaterial {
        this.CustomParts.Fragment_Custom_Alpha = shaderPart.replace("result", "alpha");
        return this;
    }

    /**
     * Sets the code on Fragment_Before_Lights portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Fragment_Before_Lights(shaderPart: string): CustomMaterial {
        this.CustomParts.Fragment_Before_Lights = shaderPart;
        return this;
    }

    /**
     * Sets the code on Fragment_Before_Fog portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Fragment_Before_Fog(shaderPart: string): CustomMaterial {
        this.CustomParts.Fragment_Before_Fog = shaderPart;
        return this;
    }

    /**
     * Sets the code on Fragment_Before_FragColor portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Fragment_Before_FragColor(shaderPart: string): CustomMaterial {
        this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result", "color");
        return this;
    }

    /**
     * Sets the code on Vertex_Begin portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Vertex_Begin(shaderPart: string): CustomMaterial {
        this.CustomParts.Vertex_Begin = shaderPart;
        return this;
    }

    /**
     * Sets the code on Vertex_Definitions portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Vertex_Definitions(shaderPart: string): CustomMaterial {
        this.CustomParts.Vertex_Definitions = shaderPart;
        return this;
    }

    /**
     * Sets the code on Vertex_MainBegin portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Vertex_MainBegin(shaderPart: string): CustomMaterial {
        this.CustomParts.Vertex_MainBegin = shaderPart;
        return this;
    }

    /**
     * Sets the code on Vertex_Before_PositionUpdated portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Vertex_Before_PositionUpdated(shaderPart: string): CustomMaterial {
        this.CustomParts.Vertex_Before_PositionUpdated = shaderPart.replace("result", "positionUpdated");
        return this;
    }

    /**
     * Sets the code on Vertex_Before_NormalUpdated portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Vertex_Before_NormalUpdated(shaderPart: string): CustomMaterial {
        this.CustomParts.Vertex_Before_NormalUpdated = shaderPart.replace("result", "normalUpdated");
        return this;
    }

    /**
     * Sets the code on Vertex_After_WorldPosComputed portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Vertex_After_WorldPosComputed(shaderPart: string): CustomMaterial {
        this.CustomParts.Vertex_After_WorldPosComputed = shaderPart;
        return this;
    }

    /**
     * Sets the code on Vertex_MainEnd portion
     * @param shaderPart the code string
     * @returns the current material
     */
    public Vertex_MainEnd(shaderPart: string): CustomMaterial {
        this.CustomParts.Vertex_MainEnd = shaderPart;
        return this;
    }
}

RegisterClass("BABYLON.CustomMaterial", CustomMaterial);
