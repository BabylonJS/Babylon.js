import { Color4 } from "core/Maths/math.color";
import { Vector2, Vector3 } from "../../../Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";

/**
 * Block used to create a Vector2/3 and Color4 out of individual or partial inputs
 */
export class ParticleConverterBlock extends NodeParticleBlock {
    /**
     * Create a new ParticleConverterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("color ", NodeParticleBlockConnectionPointTypes.Color4, true);
        this.registerInput("xyz ", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("xy ", NodeParticleBlockConnectionPointTypes.Vector2, true);
        this.registerInput("zw ", NodeParticleBlockConnectionPointTypes.Vector2, true);
        this.registerInput("x ", NodeParticleBlockConnectionPointTypes.Float, true);
        this.registerInput("y ", NodeParticleBlockConnectionPointTypes.Float, true);
        this.registerInput("z ", NodeParticleBlockConnectionPointTypes.Float, true);
        this.registerInput("w ", NodeParticleBlockConnectionPointTypes.Float, true);

        this.registerOutput("color", NodeParticleBlockConnectionPointTypes.Color4);
        this.registerOutput("xyz", NodeParticleBlockConnectionPointTypes.Vector3);
        this.registerOutput("xy", NodeParticleBlockConnectionPointTypes.Vector2);
        this.registerOutput("zw", NodeParticleBlockConnectionPointTypes.Vector2);
        this.registerOutput("x", NodeParticleBlockConnectionPointTypes.Float);
        this.registerOutput("y", NodeParticleBlockConnectionPointTypes.Float);
        this.registerOutput("z", NodeParticleBlockConnectionPointTypes.Float);
        this.registerOutput("w", NodeParticleBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleConverterBlock";
    }

    /**
     * Gets the color component (input)
     */
    public get colorIn(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the xyz component (input)
     */
    public get xyzIn(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the xy component (input)
     */
    public get xyIn(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the zw component (input)
     */
    public get zwIn(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the x component (input)
     */
    public get xIn(): NodeParticleConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the y component (input)
     */
    public get yIn(): NodeParticleConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the z component (input)
     */
    public get zIn(): NodeParticleConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the w component (input)
     */
    public get wIn(): NodeParticleConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the xyzw component (output)
     */
    public get colorOut(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the xyz component (output)
     */
    public get xyzOut(): NodeParticleConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the xy component (output)
     */
    public get xyOut(): NodeParticleConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the zw component (output)
     */
    public get zwOut(): NodeParticleConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the x component (output)
     */
    public get xOut(): NodeParticleConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the y component (output)
     */
    public get yOut(): NodeParticleConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the z component (output)
     */
    public get zOut(): NodeParticleConnectionPoint {
        return this._outputs[6];
    }

    /**
     * Gets the w component (output)
     */
    public get wOut(): NodeParticleConnectionPoint {
        return this._outputs[7];
    }

    protected override _inputRename(name: string) {
        if (name === "color ") {
            return "colorIn";
        }
        if (name === "xyz ") {
            return "xyzIn";
        }
        if (name === "xy ") {
            return "xyIn";
        }
        if (name === "zw ") {
            return "zwIn";
        }
        if (name === "x ") {
            return "xIn";
        }
        if (name === "y ") {
            return "yIn";
        }
        if (name === "z ") {
            return "zIn";
        }
        if (name === "w ") {
            return "wIn";
        }
        return name;
    }

    protected override _outputRename(name: string) {
        switch (name) {
            case "x":
                return "xOut";
            case "y":
                return "yOut";
            case "z":
                return "zOut";
            case "w":
                return "wOut";
            case "xy":
                return "xyOut";
            case "zw":
                return "zwOut";
            case "xyz":
                return "xyzOut";
            case "color":
                return "colorOut";
            default:
                return name;
        }
    }

    public override _build(state: NodeParticleBuildState) {
        super._build(state);

        const xInput = this.xIn;
        const yInput = this.yIn;
        const zInput = this.zIn;
        const wInput = this.wIn;
        const xyInput = this.xyIn;
        const zwInput = this.zwIn;
        const xyzInput = this.xyzIn;
        const colorInput = this.colorIn;

        const colorOutput = this.colorOut;
        const xyzOutput = this.xyzOut;
        const xyOutput = this.xyOut;
        const zwOutput = this.zwOut;
        const xOutput = this.xOut;
        const yOutput = this.yOut;
        const zOutput = this.zOut;
        const wOutput = this.wOut;

        const getData = (state: NodeParticleBuildState): Color4 => {
            if (colorInput.isConnected) {
                return colorInput.getConnectedValue(state);
            }

            let x: number = 0;
            let y: number = 0;
            let z: number = 0;
            let w: number = 0;

            if (xInput.isConnected) {
                x = xInput.getConnectedValue(state);
            }
            if (yInput.isConnected) {
                y = yInput.getConnectedValue(state);
            }
            if (zInput.isConnected) {
                z = zInput.getConnectedValue(state);
            }
            if (wInput.isConnected) {
                w = wInput.getConnectedValue(state);
            }

            if (xyInput.isConnected) {
                const temp = xyInput.getConnectedValue(state);
                if (temp) {
                    x = temp.x;
                    y = temp.y;
                }
            }
            if (zwInput.isConnected) {
                const temp = zwInput.getConnectedValue(state);
                if (temp) {
                    z = temp.x;
                    w = temp.y;
                }
            }
            if (xyzInput.isConnected) {
                const temp = xyzInput.getConnectedValue(state);
                if (temp) {
                    x = temp.x;
                    y = temp.y;
                    z = temp.z;
                }
            }

            return new Color4(x, y, z, w);
        };

        colorOutput._storedFunction = (state) => getData(state);
        xyzOutput._storedFunction = (state) => {
            const data = getData(state);
            return new Vector3(data.r, data.g, data.b);
        };
        xyOutput._storedFunction = (state) => {
            const data = getData(state);
            return new Vector2(data.r, data.g);
        };
        zwOutput._storedFunction = (state) => {
            const data = getData(state);
            return new Vector2(data.b, data.a);
        };
        xOutput._storedFunction = (state) => getData(state).r;
        yOutput._storedFunction = (state) => getData(state).g;
        zOutput._storedFunction = (state) => getData(state).b;
        wOutput._storedFunction = (state) => getData(state).a;
    }
}

RegisterClass("BABYLON.ParticleConverterBlock", ParticleConverterBlock);
