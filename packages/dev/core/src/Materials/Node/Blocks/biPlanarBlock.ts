import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { RegisterClass } from "../../../Misc/typeStore";
import { TriPlanarBlock } from "./triPlanarBlock";

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
    public getClassName() {
        return "BiPlanarBlock";
    }

    protected _generateTextureLookup(state: NodeMaterialBuildState): void {
        const samplerName = this.samplerName;
        const samplerYName = this.samplerYName ?? this.samplerName;

        const sharpness = this.sharpness.isConnected ? this.sharpness.associatedVariableName : "1.0";

        const dpdx = state._getFreeVariableName("dpdx");
        const dpdy = state._getFreeVariableName("dpdy");
        const n = state._getFreeVariableName("n");
        const ma = state._getFreeVariableName("ma");
        const mi = state._getFreeVariableName("mi");
        const me = state._getFreeVariableName("me");
        const x = state._getFreeVariableName("x");
        const y = state._getFreeVariableName("y");
        const w = state._getFreeVariableName("y");

        state.compilationString += `
            // grab coord derivatives for texturing
            vec3 ${dpdx} = dFdx(${this.position.associatedVariableName}.xyz);
            vec3 ${dpdy} = dFdy(${this.position.associatedVariableName}.xyz);
            vec3 ${n} = abs(${this.normal.associatedVariableName}.xyz);
        
            // determine major axis (in x; yz are following axis)
            ivec3 ${ma} = (${n}.x>${n}.y && ${n}.x>${n}.z) ? ivec3(0,1,2) :
                    (${n}.y>${n}.z)            ? ivec3(1,2,0) :
                                            ivec3(2,0,1) ;
            // determine minor axis (in x; yz are following axis)
            ivec3 ${mi} = (${n}.x<${n}.y && ${n}.x<${n}.z) ? ivec3(0,1,2) :
                    (${n}.y<${n}.z)            ? ivec3(1,2,0) :
                                            ivec3(2,0,1) ;
            // determine median axis (in x;  yz are following axis)
            ivec3 ${me} = ivec3(3) - ${mi} - ${ma};
            
            // project+fetch
            vec4 ${x} = textureGrad( ${samplerName}, vec2(   ${this.position.associatedVariableName}[${ma}.y],   ${this.position.associatedVariableName}[${ma}.z]), 
                                    vec2(${dpdx}[${ma}.y],${dpdx}[${ma}.z]), 
                                    vec2(${dpdy}[${ma}.y],${dpdy}[${ma}.z]) );
            vec4 ${y} = textureGrad( ${samplerYName}, vec2(   ${this.position.associatedVariableName}[${me}.y],   ${this.position.associatedVariableName}[${me}.z]), 
                                    vec2(${dpdx}[${me}.y],${dpdx}[${me}.z]),
                                    vec2(${dpdy}[${me}.y],${dpdy}[${me}.z]) );
            
            // blend factors
            vec2 ${w} = vec2(${n}[${ma}.x],${n}[${me}.x]);
            // make local support
            ${w} = clamp( (${w}-0.5773)/(1.0-0.5773), 0.0, 1.0 );
            // shape transition
            ${w} = pow( ${w}, vec2(${sharpness}/8.0) );
            // blend and return
            vec4 ${this._tempTextureRead} = (${x}*${w}.x + ${y}*${w}.y) / (${w}.x + ${w}.y);
        `;
    }
}

RegisterClass("BABYLON.BiPlanarBlock", BiPlanarBlock);
