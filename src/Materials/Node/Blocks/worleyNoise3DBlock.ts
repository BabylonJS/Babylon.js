import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
import { Scene } from '../../../scene';
import { editableInPropertyPage, PropertyTypeForEdition } from "../nodeMaterialDecorator";

/**
 * block used to Generate a Worley Noise 3D Noise Pattern
 */

//  Source: https://github.com/Erkaman/glsl-worley
//  Converted to BJS by Pryme8
//
//  Worley Noise 3D
//  Return vec2 value range of -1.0->1.0, F1-F2 respectivly

export class WorleyNoise3DBlock extends NodeMaterialBlock {
    /** Gets or sets a boolean indicating that normal should be inverted on X axis */
    @editableInPropertyPage("Use Manhattan Distance", PropertyTypeForEdition.Boolean, "PROPERTIES", { "notifiers": { "update": false }})
    public manhattanDistance = false;

    /**
     * Creates a new WorleyNoise3DBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("seed", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("jitter", NodeMaterialBlockConnectionPointTypes.Float);

        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector2);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "WorleyNoise3DBlock";
    }

    /**
     * Gets the seed input component
     */
    public get seed(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the jitter input component
     */
    public get jitter(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (!this.seed.isConnected) {
            return;
        }

        if (!this._outputs[0].hasEndpoints) {
            return;
        }

        let functionString = `vec3 permute(vec3 x){\r\n`;
        functionString += `    return mod((34.0 * x + 1.0) * x, 289.0);\r\n`;
        functionString += `}\r\n\r\n`;

        functionString += `vec3 dist(vec3 x, vec3 y, vec3 z,  bool manhattanDistance){\r\n`;
        functionString += `    return manhattanDistance ?  abs(x) + abs(y) + abs(z) :  (x * x + y * y + z * z);\r\n`;
        functionString += `}\r\n\r\n`;

        functionString += `vec2 worley(vec3 P, float jitter, bool manhattanDistance){\r\n`;
        functionString += `    float K = 0.142857142857; // 1/7\r\n`;
        functionString += `    float Ko = 0.428571428571; // 1/2-K/2\r\n`;
        functionString += `    float  K2 = 0.020408163265306; // 1/(7*7)\r\n`;
        functionString += `    float Kz = 0.166666666667; // 1/6\r\n`;
        functionString += `    float Kzo = 0.416666666667; // 1/2-1/6*2\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 Pi = mod(floor(P), 289.0);\r\n`;
        functionString += `    vec3 Pf = fract(P) - 0.5;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 Pfx = Pf.x + vec3(1.0, 0.0, -1.0);\r\n`;
        functionString += `    vec3 Pfy = Pf.y + vec3(1.0, 0.0, -1.0);\r\n`;
        functionString += `    vec3 Pfz = Pf.z + vec3(1.0, 0.0, -1.0);\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 p = permute(Pi.x + vec3(-1.0, 0.0, 1.0));\r\n`;
        functionString += `    vec3 p1 = permute(p + Pi.y - 1.0);\r\n`;
        functionString += `    vec3 p2 = permute(p + Pi.y);\r\n`;
        functionString += `    vec3 p3 = permute(p + Pi.y + 1.0);\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 p11 = permute(p1 + Pi.z - 1.0);\r\n`;
        functionString += `    vec3 p12 = permute(p1 + Pi.z);\r\n`;
        functionString += `    vec3 p13 = permute(p1 + Pi.z + 1.0);\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 p21 = permute(p2 + Pi.z - 1.0);\r\n`;
        functionString += `    vec3 p22 = permute(p2 + Pi.z);\r\n`;
        functionString += `    vec3 p23 = permute(p2 + Pi.z + 1.0);\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 p31 = permute(p3 + Pi.z - 1.0);\r\n`;
        functionString += `    vec3 p32 = permute(p3 + Pi.z);\r\n`;
        functionString += `    vec3 p33 = permute(p3 + Pi.z + 1.0);\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 ox11 = fract(p11*K) - Ko;\r\n`;
        functionString += `    vec3 oy11 = mod(floor(p11*K), 7.0)*K - Ko;\r\n`;
        functionString += `    vec3 oz11 = floor(p11*K2)*Kz - Kzo; // p11 < 289 guaranteed\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 ox12 = fract(p12*K) - Ko;\r\n`;
        functionString += `    vec3 oy12 = mod(floor(p12*K), 7.0)*K - Ko;\r\n`;
        functionString += `    vec3 oz12 = floor(p12*K2)*Kz - Kzo;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 ox13 = fract(p13*K) - Ko;\r\n`;
        functionString += `    vec3 oy13 = mod(floor(p13*K), 7.0)*K - Ko;\r\n`;
        functionString += `    vec3 oz13 = floor(p13*K2)*Kz - Kzo;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 ox21 = fract(p21*K) - Ko;\r\n`;
        functionString += `    vec3 oy21 = mod(floor(p21*K), 7.0)*K - Ko;\r\n`;
        functionString += `    vec3 oz21 = floor(p21*K2)*Kz - Kzo;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 ox22 = fract(p22*K) - Ko;\r\n`;
        functionString += `    vec3 oy22 = mod(floor(p22*K), 7.0)*K - Ko;\r\n`;
        functionString += `    vec3 oz22 = floor(p22*K2)*Kz - Kzo;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 ox23 = fract(p23*K) - Ko;\r\n`;
        functionString += `    vec3 oy23 = mod(floor(p23*K), 7.0)*K - Ko;\r\n`;
        functionString += `    vec3 oz23 = floor(p23*K2)*Kz - Kzo;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 ox31 = fract(p31*K) - Ko;\r\n`;
        functionString += `    vec3 oy31 = mod(floor(p31*K), 7.0)*K - Ko;\r\n`;
        functionString += `    vec3 oz31 = floor(p31*K2)*Kz - Kzo;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 ox32 = fract(p32*K) - Ko;\r\n`;
        functionString += `    vec3 oy32 = mod(floor(p32*K), 7.0)*K - Ko;\r\n`;
        functionString += `    vec3 oz32 = floor(p32*K2)*Kz - Kzo;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 ox33 = fract(p33*K) - Ko;\r\n`;
        functionString += `    vec3 oy33 = mod(floor(p33*K), 7.0)*K - Ko;\r\n`;
        functionString += `    vec3 oz33 = floor(p33*K2)*Kz - Kzo;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 dx11 = Pfx + jitter*ox11;\r\n`;
        functionString += `    vec3 dy11 = Pfy.x + jitter*oy11;\r\n`;
        functionString += `    vec3 dz11 = Pfz.x + jitter*oz11;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 dx12 = Pfx + jitter*ox12;\r\n`;
        functionString += `    vec3 dy12 = Pfy.x + jitter*oy12;\r\n`;
        functionString += `    vec3 dz12 = Pfz.y + jitter*oz12;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 dx13 = Pfx + jitter*ox13;\r\n`;
        functionString += `    vec3 dy13 = Pfy.x + jitter*oy13;\r\n`;
        functionString += `    vec3 dz13 = Pfz.z + jitter*oz13;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 dx21 = Pfx + jitter*ox21;\r\n`;
        functionString += `    vec3 dy21 = Pfy.y + jitter*oy21;\r\n`;
        functionString += `    vec3 dz21 = Pfz.x + jitter*oz21;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 dx22 = Pfx + jitter*ox22;\r\n`;
        functionString += `    vec3 dy22 = Pfy.y + jitter*oy22;\r\n`;
        functionString += `    vec3 dz22 = Pfz.y + jitter*oz22;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 dx23 = Pfx + jitter*ox23;\r\n`;
        functionString += `    vec3 dy23 = Pfy.y + jitter*oy23;\r\n`;
        functionString += `    vec3 dz23 = Pfz.z + jitter*oz23;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 dx31 = Pfx + jitter*ox31;\r\n`;
        functionString += `    vec3 dy31 = Pfy.z + jitter*oy31;\r\n`;
        functionString += `    vec3 dz31 = Pfz.x + jitter*oz31;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 dx32 = Pfx + jitter*ox32;\r\n`;
        functionString += `    vec3 dy32 = Pfy.z + jitter*oy32;\r\n`;
        functionString += `    vec3 dz32 = Pfz.y + jitter*oz32;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 dx33 = Pfx + jitter*ox33;\r\n`;
        functionString += `    vec3 dy33 = Pfy.z + jitter*oy33;\r\n`;
        functionString += `    vec3 dz33 = Pfz.z + jitter*oz33;\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 d11 = dist(dx11, dy11, dz11, manhattanDistance);\r\n`;
        functionString += `    vec3 d12 =dist(dx12, dy12, dz12, manhattanDistance);\r\n`;
        functionString += `    vec3 d13 = dist(dx13, dy13, dz13, manhattanDistance);\r\n`;
        functionString += `    vec3 d21 = dist(dx21, dy21, dz21, manhattanDistance);\r\n`;
        functionString += `    vec3 d22 = dist(dx22, dy22, dz22, manhattanDistance);\r\n`;
        functionString += `    vec3 d23 = dist(dx23, dy23, dz23, manhattanDistance);\r\n`;
        functionString += `    vec3 d31 = dist(dx31, dy31, dz31, manhattanDistance);\r\n`;
        functionString += `    vec3 d32 = dist(dx32, dy32, dz32, manhattanDistance);\r\n`;
        functionString += `    vec3 d33 = dist(dx33, dy33, dz33, manhattanDistance);\r\n`;
        functionString += `\r\n`;
        functionString += `    vec3 d1a = min(d11, d12);\r\n`;
        functionString += `    d12 = max(d11, d12);\r\n`;
        functionString += `    d11 = min(d1a, d13); // Smallest now not in d12 or d13\r\n`;
        functionString += `    d13 = max(d1a, d13);\r\n`;
        functionString += `    d12 = min(d12, d13); // 2nd smallest now not in d13\r\n`;
        functionString += `    vec3 d2a = min(d21, d22);\r\n`;
        functionString += `    d22 = max(d21, d22);\r\n`;
        functionString += `    d21 = min(d2a, d23); // Smallest now not in d22 or d23\r\n`;
        functionString += `    d23 = max(d2a, d23);\r\n`;
        functionString += `    d22 = min(d22, d23); // 2nd smallest now not in d23\r\n`;
        functionString += `    vec3 d3a = min(d31, d32);\r\n`;
        functionString += `    d32 = max(d31, d32);\r\n`;
        functionString += `    d31 = min(d3a, d33); // Smallest now not in d32 or d33\r\n`;
        functionString += `    d33 = max(d3a, d33);\r\n`;
        functionString += `    d32 = min(d32, d33); // 2nd smallest now not in d33\r\n`;
        functionString += `    vec3 da = min(d11, d21);\r\n`;
        functionString += `    d21 = max(d11, d21);\r\n`;
        functionString += `    d11 = min(da, d31); // Smallest now in d11\r\n`;
        functionString += `    d31 = max(da, d31); // 2nd smallest now not in d31\r\n`;
        functionString += `    d11.xy = (d11.x < d11.y) ? d11.xy : d11.yx;\r\n`;
        functionString += `    d11.xz = (d11.x < d11.z) ? d11.xz : d11.zx; // d11.x now smallest\r\n`;
        functionString += `    d12 = min(d12, d21); // 2nd smallest now not in d21\r\n`;
        functionString += `    d12 = min(d12, d22); // nor in d22\r\n`;
        functionString += `    d12 = min(d12, d31); // nor in d31\r\n`;
        functionString += `    d12 = min(d12, d32); // nor in d32\r\n`;
        functionString += `    d11.yz = min(d11.yz,d12.xy); // nor in d12.yz\r\n`;
        functionString += `    d11.y = min(d11.y,d12.z); // Only two more to go\r\n`;
        functionString += `    d11.y = min(d11.y,d11.z); // Done! (Phew!)\r\n`;
        functionString += `    return sqrt(d11.xy); // F1, F2\r\n`;
        functionString += `}\r\n\r\n`;

        state._emitFunction('worley3D', functionString, '// Worley3D');
        state.compilationString += this._declareOutput(this._outputs[0], state) + ` = worley(${this.seed.associatedVariableName}, ${this.jitter.associatedVariableName}, ${this.manhattanDistance});\r\n`;

        return this;
    }
    /**
     * Exposes the properties to the UI?
     */
    protected _dumpPropertiesCode() {
        var codeString = `${this._codeVariableName}.manhattanDistance = ${this.manhattanDistance};\r\n`;

        return codeString;
    }
    /**
     * Exposes the properties to the Seralize?
     */
    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.manhattanDistance = this.manhattanDistance;

        return serializationObject;
    }
    /**
     * Exposes the properties to the deseralize?
     */
    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.manhattanDistance = serializationObject.manhattanDistance;
    }
}

_TypeStore.RegisteredTypes["BABYLON.WorleyNoise3DBlock"] = WorleyNoise3DBlock;