/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {

    export class CustomShaderStructure {

        public FragmentStore: string;
        public VertexStore: string;

        constructor() { }
    }

    export class ShaderSpecialParts {

        constructor() { }

        public Fragment_Begin: string;
        public Fragment_Definitions: string;
        public Fragment_MainBegin: string;

        // diffuseColor
        public Fragment_Custom_Diffuse: string;

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
    }

    export class CustomMaterial extends StandardMaterial {
        public static ShaderIndexer = 1;
        public CustomParts: ShaderSpecialParts;
        _isCreatedShader: boolean;
        _createdShaderName: string;
        _customUniform: string[];
        _newUniforms: string[];
        _newUniformInstances: any[];
        _newSamplerInstances: Texture[];

        public  FragmentShader : string ;
        public  VertexShader : string ;

        public AttachAfterBind(mesh: Mesh, effect: Effect) {
            for (var el in this._newUniformInstances) {
                var ea = el.toString().split('-');
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
            for (var el in this._newSamplerInstances) {
                var ea = el.toString().split('-');
                if (ea[0] == 'sampler2D' && this._newSamplerInstances[el].isReady && this._newSamplerInstances[el].isReady()) {
                    effect.setTexture(ea[1], this._newSamplerInstances[el]);
                }
            }
        }

        public ReviewUniform(name: string, arr: string[]): string[] {
            if (name == "uniform") {
                for (var ind in this._newUniforms) {
                    if (this._customUniform[ind].indexOf('sampler') == -1) {
                        arr.push(this._newUniforms[ind]);
                    }
                }
            }
            if (name == "sampler") {
                for (var ind in this._newUniforms) {
                    if (this._customUniform[ind].indexOf('sampler') != -1) {
                        arr.push(this._newUniforms[ind]);
                    }
                }
            }
            return arr;
        }

        public Builder(shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: StandardMaterialDefines): string {

            if (this._isCreatedShader) {
                return this._createdShaderName;
            }
            this._isCreatedShader = false;

            CustomMaterial.ShaderIndexer++;
            var name: string = "custom_" + CustomMaterial.ShaderIndexer;

            this.ReviewUniform("uniform", uniforms);
            this.ReviewUniform("sampler", samplers);

            var fn_afterBind = this._afterBind.bind(this);
            this._afterBind = (m, e) => {
                if (!e) {
                    return;
                }
                this.AttachAfterBind(m, e);
                try { fn_afterBind(m, e); }
                catch (e) { }
            };

            BABYLON.Effect.ShadersStore[name + "VertexShader"] = this.VertexShader
                .replace('#define CUSTOM_VERTEX_BEGIN', (this.CustomParts.Vertex_Begin ? this.CustomParts.Vertex_Begin : ""))
                .replace('#define CUSTOM_VERTEX_DEFINITIONS', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Vertex_Definitions ? this.CustomParts.Vertex_Definitions : ""))
                .replace('#define CUSTOM_VERTEX_MAIN_BEGIN', (this.CustomParts.Vertex_MainBegin ? this.CustomParts.Vertex_MainBegin : ""))
                .replace('#define CUSTOM_VERTEX_UPDATE_POSITION', (this.CustomParts.Vertex_Before_PositionUpdated ? this.CustomParts.Vertex_Before_PositionUpdated : ""))
                .replace('#define CUSTOM_VERTEX_UPDATE_NORMAL', (this.CustomParts.Vertex_Before_NormalUpdated ? this.CustomParts.Vertex_Before_NormalUpdated : ""));

                // #define CUSTOM_VERTEX_MAIN_END

            BABYLON.Effect.ShadersStore[name + "PixelShader"] = this.FragmentShader
                .replace('#define CUSTOM_FRAGMENT_BEGIN', (this.CustomParts.Fragment_Begin ? this.CustomParts.Fragment_Begin : ""))
                .replace('#define CUSTOM_FRAGMENT_MAIN_BEGIN', (this.CustomParts.Fragment_MainBegin ? this.CustomParts.Fragment_MainBegin : ""))
                .replace('#define CUSTOM_FRAGMENT_DEFINITIONS', (this._customUniform ? this._customUniform.join("\n") : "") + (this.CustomParts.Fragment_Definitions ? this.CustomParts.Fragment_Definitions : ""))
                .replace('#define CUSTOM_FRAGMENT_UPDATE_DIFFUSE', (this.CustomParts.Fragment_Custom_Diffuse ? this.CustomParts.Fragment_Custom_Diffuse : ""))
                .replace('#define CUSTOM_FRAGMENT_UPDATE_ALPHA', (this.CustomParts.Fragment_Custom_Alpha ? this.CustomParts.Fragment_Custom_Alpha : ""))
                .replace('#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR', (this.CustomParts.Fragment_Before_FragColor ? this.CustomParts.Fragment_Before_FragColor : ""));

                // #define CUSTOM_FRAGMENT_BEFORE_LIGHTS

                // #define CUSTOM_FRAGMENT_BEFORE_FOG

            this._isCreatedShader = true;
            this._createdShaderName = name;

            return name;
        }

        constructor(name: string, scene: Scene) {
            super(name, scene);
            this.CustomParts = new ShaderSpecialParts();
            this.customShaderNameResolve = this.Builder;

            this.FragmentShader = BABYLON.Effect.ShadersStore["defaultPixelShader"];
            this.VertexShader = BABYLON.Effect.ShadersStore["defaultVertexShader"];
        }

        public AddUniform(name: string, kind: string, param: any): CustomMaterial {
            if (!this._customUniform) {
                this._customUniform = new Array();
                this._newUniforms = new Array();
                this._newSamplerInstances = new Array();
                this._newUniformInstances = new Array();
            }
            if (param) {
                if (kind.indexOf("sampler") == -1) {
                    (<any>this._newUniformInstances)[kind + "-" + name] = param;
                }
                else {
                    (<any>this._newUniformInstances)[kind + "-" + name] = param;
                }
            }
            this._customUniform.push("uniform " + kind + " " + name + ";");
            this._newUniforms.push(name);

            return this;
        }

        public Fragment_Begin(shaderPart: string): CustomMaterial {
            this.CustomParts.Fragment_Begin = shaderPart;
            return this;
        }

        public Fragment_Definitions(shaderPart: string): CustomMaterial {
            this.CustomParts.Fragment_Definitions = shaderPart;
            return this;
        }

        public Fragment_MainBegin(shaderPart: string): CustomMaterial {
            this.CustomParts.Fragment_MainBegin = shaderPart;
            return this;
        }

        public Fragment_Custom_Diffuse(shaderPart: string): CustomMaterial {
            this.CustomParts.Fragment_Custom_Diffuse = shaderPart.replace("result", "diffuseColor");
            return this;
        }

        public Fragment_Custom_Alpha(shaderPart: string): CustomMaterial {
            this.CustomParts.Fragment_Custom_Alpha = shaderPart.replace("result", "alpha");
            return this;
        }

        public Fragment_Before_FragColor(shaderPart: string): CustomMaterial {
            this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result", "color");
            return this;
        }

        public Vertex_Begin(shaderPart: string): CustomMaterial {
            this.CustomParts.Vertex_Begin = shaderPart;
            return this;
        }

        public Vertex_Definitions(shaderPart: string): CustomMaterial {
            this.CustomParts.Vertex_Definitions = shaderPart;
            return this;
        }

        public Vertex_MainBegin(shaderPart: string): CustomMaterial {
            this.CustomParts.Vertex_MainBegin = shaderPart;
            return this;
        }

        public Vertex_Before_PositionUpdated(shaderPart: string): CustomMaterial {
            this.CustomParts.Vertex_Before_PositionUpdated = shaderPart.replace("result", "positionUpdated");
            return this;
        }

        public Vertex_Before_NormalUpdated(shaderPart: string): CustomMaterial {
            this.CustomParts.Vertex_Before_NormalUpdated = shaderPart.replace("result", "normalUpdated");
            return this;
        }
    }
}
