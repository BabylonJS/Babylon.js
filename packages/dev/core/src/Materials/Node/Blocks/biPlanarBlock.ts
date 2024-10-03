import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { TriPlanarBlock } from "./triPlanarBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import { ShaderLanguage } from "../../../Materials/shaderLanguage";
import { Constants } from "../../../Engines/constants";

/**
 * Block used to read a texture with triplanar mapping (see https://iquilezles.org/articles/biplanar/)
 */
export class BiPlanarBlock extends TriPlanarBlock {
    /**
     * Create a new BiPlanarBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, true);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "BiPlanarBlock";
    }

    private _declareLocalVarAsVec3I(name: string, state: NodeMaterialBuildState): string {
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            return `var ${name}: vec3<i32>`;
        } else {
            return `ivec3 ${name}`;
        }
    }

    private _getTextureGrad(state: NodeMaterialBuildState, samplerName: string) {
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            return `textureSampleGrad(${samplerName},${samplerName + Constants.AUTOSAMPLERSUFFIX}`;
        }

        return `textureGrad(${samplerName}`;
    }

    protected override _generateTextureLookup(state: NodeMaterialBuildState): void {
        const samplerName = this.samplerName;
        const samplerYName = this.samplerYName ?? this.samplerName;

        const sharpness = this.sharpness.isConnected ? this.sharpness.associatedVariableName : "1.0";

        const dpdx = state._getFreeVariableName("dxValue");
        const dpdy = state._getFreeVariableName("dyValue");
        const n = state._getFreeVariableName("n");
        const ma = state._getFreeVariableName("ma");
        const mi = state._getFreeVariableName("mi");
        const me = state._getFreeVariableName("me");
        const x = state._getFreeVariableName("x");
        const y = state._getFreeVariableName("y");
        const w = state._getFreeVariableName("w");

        let ivec3 = "ivec3";
        let dpdxFunc = "dFdx";
        let dpdyFunc = "dFdy";
        const suffix = state.fSuffix;

        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            ivec3 = "vec3<i32>";
            dpdxFunc = "dpdx";
            dpdyFunc = "dpdy";
        }

        state.compilationString += `
            // grab coord derivatives for texturing
            ${state._declareLocalVar(dpdx, NodeMaterialBlockConnectionPointTypes.Vector3)} = ${dpdxFunc}(${this.position.associatedVariableName}.xyz);
            ${state._declareLocalVar(dpdy, NodeMaterialBlockConnectionPointTypes.Vector3)} = ${dpdyFunc}(${this.position.associatedVariableName}.xyz);
            ${state._declareLocalVar(n, NodeMaterialBlockConnectionPointTypes.Vector3)} = abs(${this.normal.associatedVariableName}.xyz);
        
            // determine major axis (in x; yz are following axis)
            ${this._declareLocalVarAsVec3I(ma, state)} = ${state._generateTernary(
                `${ivec3}(0,1,2)`,
                `${state._generateTernary(`${ivec3}(1,2,0)`, `${ivec3}(2,0,1)`, `(${n}.y>${n}.z)`)}`,
                `(${n}.x>${n}.y && ${n}.x>${n}.z)`
            )};                    

            // determine minor axis (in x; yz are following axis)
            ${this._declareLocalVarAsVec3I(mi, state)} =  ${state._generateTernary(
                `${ivec3}(0,1,2)`,
                `${state._generateTernary(`${ivec3}(1,2,0)`, `${ivec3}(2,0,1)`, `(${n}.y<${n}.z)`)}`,
                `(${n}.x<${n}.y && ${n}.x<${n}.z)`
            )};  
                              
            // determine median axis (in x;  yz are following axis)
            ${this._declareLocalVarAsVec3I(me, state)} = ${ivec3}(3) - ${mi} - ${ma};
            
            // project+fetch
            ${state._declareLocalVar(x, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this._getTextureGrad(state, samplerName)}, vec2${suffix}(${this.position.associatedVariableName}[${ma}.y], ${this.position.associatedVariableName}[${ma}.z]), 
                                    vec2${suffix}(${dpdx}[${ma}.y],${dpdx}[${ma}.z]), 
                                    vec2${suffix}(${dpdy}[${ma}.y],${dpdy}[${ma}.z]));
            ${state._declareLocalVar(y, NodeMaterialBlockConnectionPointTypes.Vector4)} = ${this._getTextureGrad(state, samplerYName)}, vec2${suffix}(${this.position.associatedVariableName}[${me}.y], ${this.position.associatedVariableName}[${me}.z]), 
                                    vec2${suffix}(${dpdx}[${me}.y],${dpdx}[${me}.z]),
                                    vec2${suffix}(${dpdy}[${me}.y],${dpdy}[${me}.z]));
            
            // blend factors
            ${state._declareLocalVar(w, NodeMaterialBlockConnectionPointTypes.Vector2)} = vec2${suffix}(${n}[${ma}.x],${n}[${me}.x]);
            // make local support
            ${w} = clamp( (${w}-0.5773)/(1.0-0.5773), vec2${suffix}(0.0), vec2${suffix}(1.0) );
            // shape transition
            ${w} = pow( ${w}, vec2${suffix}(${sharpness}/8.0) );
            // blend and return
            ${state._declareLocalVar(this._tempTextureRead, NodeMaterialBlockConnectionPointTypes.Vector4)} = (${x}*${w}.x + ${y}*${w}.y) / (${w}.x + ${w}.y);
        `;
    }
}
