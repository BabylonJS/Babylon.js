import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to apply rgb/hsl convertions
 */
export class ColorConverterBlock extends NodeMaterialBlock {
    /**
     * Create a new ColorConverterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("rgb ", NodeMaterialBlockConnectionPointTypes.Color3, true);
        this.registerInput("hsl ", NodeMaterialBlockConnectionPointTypes.Color3, true);

        this.registerOutput("rgb", NodeMaterialBlockConnectionPointTypes.Color3);
        this.registerOutput("hsl", NodeMaterialBlockConnectionPointTypes.Color3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ColorConverterBlock";
    }

    /**
     * Gets the rgb value (input)
     */
    public get rgbIn(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the hsl value (input)
     */
    public get hslIn(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the rgb value (output)
     */
    public get rgbOut(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the hsl value (output)
     */
    public get hslOut(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    protected override _inputRename(name: string) {
        if (name === "rgb ") {
            return "rgbIn";
        }
        if (name === "hsl ") {
            return "hslIn";
        }
        return name;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const rgbInput = this.rgbIn;
        const hslInput = this.hslIn;

        const rbgOutput = this._outputs[0];
        const hslOutput = this._outputs[1];

        const vec3 = state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector3);

        let rgb2hsl = `
            vec3 rgb2hsl(vec3 color) {
                float r = color.r;
                float g = color.g;
                float b = color.b;

                float maxc = max(r, max(g, b));
                float minc = min(r, min(g, b));
                float h = 0.0;
                float s = 0.0;
                float l = (maxc + minc) / 2.0;

                if (maxc != minc) {
                    float d = maxc - minc;
                    if (l > 0.5) {
                        s = d / (2.0 - maxc - minc);
                    } else {
                        s = d / (maxc + minc);
                    }

                    if (maxc == r) {
                        float add = 0.0;
                        if (g < b) {
                            add = 6.0;
                        }
                        h = (g - b) / d + add;
                    } else if (maxc == g) {
                        h = (b - r) / d + 2.0;
                    } else if (maxc == b) {
                        h = (r - g) / d + 4.0;
                    }
                    h /= 6.0;
                }

                return vec3(h, s, l);
            }`;

        let hue2rgb = `
            float hue2rgb(float p, float q, float tt) {
                float t = tt;
                if (t < 0.0) {
                    t += 1.0;
                }
                if (t > 1.0) {
                    t -= 1.0;
                }
                if (t < 1.0/6.0) {
                    return p + (q - p) * 6.0 * t;
                }
                if (t < 1.0/2.0) {
                    return q;
                }
                if (t < 2.0/3.0) {
                    return p + (q - p) * (2.0/3.0 - t) * 6.0;
                }
                return p;
            }`;

        let hsl2rgb = `
            vec3 hsl2rgb(vec3 hsl) {
                float h = hsl.x;
                float s = hsl.y;
                float l = hsl.z;

                float r;
                float g;
                float b;

                if (s == 0.0) {
                    // Achromatic (grey)
                    r = l;
                    g = l;
                    b = l; 
                } else {
                    float q;
                
                    if (l < 0.5) {
                        q = l * (1.0 + s);
                    } else {
                        q = (l + s - l * s);
                    }

                    float p = 2.0 * l - q;

                    r = hue2rgb(p, q, h + 1.0/3.0);
                    g = hue2rgb(p, q, h);
                    b = hue2rgb(p, q, h - 1.0/3.0);
                }

                return vec3(r, g, b);
            }`;

        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            rgb2hsl = state._babylonSLtoWGSL(rgb2hsl);
            hue2rgb = state._babylonSLtoWGSL(hue2rgb);
            hsl2rgb = state._babylonSLtoWGSL(hsl2rgb);
        }

        state._emitFunction("rgb2hsl", rgb2hsl, "");
        state._emitFunction("hue2rgb", hue2rgb, "");
        state._emitFunction("hsl2rgb", hsl2rgb, "");

        if (rgbInput.isConnected) {
            if (rbgOutput.hasEndpoints) {
                state.compilationString += state._declareOutput(rbgOutput) + ` = ${rgbInput.associatedVariableName};\n`;
            }

            if (hslOutput.hasEndpoints) {
                state.compilationString += state._declareOutput(hslOutput) + ` = rgb2hsl(${rgbInput.associatedVariableName});\n`;
            }
        } else if (hslInput.isConnected) {
            if (rbgOutput.hasEndpoints) {
                state.compilationString += state._declareOutput(rbgOutput) + ` = hsl2rgb(${hslInput.associatedVariableName});\n`;
            }
            if (hslOutput.hasEndpoints) {
                state.compilationString += state._declareOutput(hslOutput) + ` = ${hslInput.associatedVariableName};\n`;
            }
        } else {
            if (rbgOutput.hasEndpoints) {
                state.compilationString += state._declareOutput(rbgOutput) + ` =  ${vec3}(0.);\n`;
            }

            if (hslOutput.hasEndpoints) {
                state.compilationString += state._declareOutput(hslOutput) + ` =  ${vec3}(0.);\n`;
            }
        }

        return this;
    }
}

RegisterClass("BABYLON.ColorConverterBlock", ColorConverterBlock);
