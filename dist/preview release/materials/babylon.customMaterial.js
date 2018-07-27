/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var BABYLON;
(function (BABYLON) {
    var CustomShaderStructure = /** @class */ (function () {
        function CustomShaderStructure() {
        }
        return CustomShaderStructure;
    }());
    BABYLON.CustomShaderStructure = CustomShaderStructure;
    var ShaderSpecialParts = /** @class */ (function () {
        function ShaderSpecialParts() {
        }
        return ShaderSpecialParts;
    }());
    BABYLON.ShaderSpecialParts = ShaderSpecialParts;
    var CustomMaterial = /** @class */ (function (_super) {
        __extends(CustomMaterial, _super);
        function CustomMaterial(name, scene) {
            var _this = _super.call(this, name, scene) || this;
            _this.CustomParts = new ShaderSpecialParts();
            _this.customShaderNameResolve = _this.Builder;
            _this.FragmentShader = BABYLON.Effect.ShadersStore["defaultPixelShader"];
            _this.VertexShader = BABYLON.Effect.ShadersStore["defaultVertexShader"];
            return _this;
        }
        CustomMaterial.prototype.AttachAfterBind = function (mesh, effect) {
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
        };
        CustomMaterial.prototype.ReviewUniform = function (name, arr) {
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
        };
        CustomMaterial.prototype.Builder = function (shaderName, uniforms, uniformBuffers, samplers, defines) {
            var _this = this;
            if (this._isCreatedShader) {
                return this._createdShaderName;
            }
            this._isCreatedShader = false;
            CustomMaterial.ShaderIndexer++;
            var name = "custom_" + CustomMaterial.ShaderIndexer;
            this.ReviewUniform("uniform", uniforms);
            this.ReviewUniform("sampler", samplers);
            var fn_afterBind = this._afterBind.bind(this);
            this._afterBind = function (m, e) {
                if (!e) {
                    return;
                }
                _this.AttachAfterBind(m, e);
                try {
                    fn_afterBind(m, e);
                }
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
        };
        CustomMaterial.prototype.AddUniform = function (name, kind, param) {
            if (!this._customUniform) {
                this._customUniform = new Array();
                this._newUniforms = new Array();
                this._newSamplerInstances = new Array();
                this._newUniformInstances = new Array();
            }
            if (param) {
                if (kind.indexOf("sampler") == -1) {
                    this._newUniformInstances[kind + "-" + name] = param;
                }
                else {
                    this._newUniformInstances[kind + "-" + name] = param;
                }
            }
            this._customUniform.push("uniform " + kind + " " + name + ";");
            this._newUniforms.push(name);
            return this;
        };
        CustomMaterial.prototype.Fragment_Begin = function (shaderPart) {
            this.CustomParts.Fragment_Begin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_Definitions = function (shaderPart) {
            this.CustomParts.Fragment_Definitions = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_MainBegin = function (shaderPart) {
            this.CustomParts.Fragment_MainBegin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Fragment_Custom_Diffuse = function (shaderPart) {
            this.CustomParts.Fragment_Custom_Diffuse = shaderPart.replace("result", "diffuseColor");
            return this;
        };
        CustomMaterial.prototype.Fragment_Custom_Alpha = function (shaderPart) {
            this.CustomParts.Fragment_Custom_Alpha = shaderPart.replace("result", "alpha");
            return this;
        };
        CustomMaterial.prototype.Fragment_Before_FragColor = function (shaderPart) {
            this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result", "color");
            return this;
        };
        CustomMaterial.prototype.Vertex_Begin = function (shaderPart) {
            this.CustomParts.Vertex_Begin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_Definitions = function (shaderPart) {
            this.CustomParts.Vertex_Definitions = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_MainBegin = function (shaderPart) {
            this.CustomParts.Vertex_MainBegin = shaderPart;
            return this;
        };
        CustomMaterial.prototype.Vertex_Before_PositionUpdated = function (shaderPart) {
            this.CustomParts.Vertex_Before_PositionUpdated = shaderPart.replace("result", "positionUpdated");
            return this;
        };
        CustomMaterial.prototype.Vertex_Before_NormalUpdated = function (shaderPart) {
            this.CustomParts.Vertex_Before_NormalUpdated = shaderPart.replace("result", "normalUpdated");
            return this;
        };
        CustomMaterial.ShaderIndexer = 1;
        return CustomMaterial;
    }(BABYLON.StandardMaterial));
    BABYLON.CustomMaterial = CustomMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.customMaterial.js.map
