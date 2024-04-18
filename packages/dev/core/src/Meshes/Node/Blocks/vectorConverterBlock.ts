import { Vector2, Vector3, Vector4 } from "../../../Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";

/**
 * Block used to create a Vector2/3/4 out of individual or partial inputs
 */
export class VectorConverterBlock extends NodeGeometryBlock {
    /**
     * Create a new VectorConverterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("xyzw ", NodeGeometryBlockConnectionPointTypes.Vector4, true);
        this.registerInput("xyz ", NodeGeometryBlockConnectionPointTypes.Vector3, true);
        this.registerInput("xy ", NodeGeometryBlockConnectionPointTypes.Vector2, true);
        this.registerInput("zw ", NodeGeometryBlockConnectionPointTypes.Vector2, true);
        this.registerInput("x ", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("y ", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("z ", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("w ", NodeGeometryBlockConnectionPointTypes.Float, true);

        this.registerOutput("xyzw", NodeGeometryBlockConnectionPointTypes.Vector4);
        this.registerOutput("xyz", NodeGeometryBlockConnectionPointTypes.Vector3);
        this.registerOutput("xy", NodeGeometryBlockConnectionPointTypes.Vector2);
        this.registerOutput("zw", NodeGeometryBlockConnectionPointTypes.Vector2);
        this.registerOutput("x", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("y", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("z", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("w", NodeGeometryBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "VectorConverterBlock";
    }

    /**
     * Gets the xyzw component (input)
     */
    public get xyzwIn(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the xyz component (input)
     */
    public get xyzIn(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the xy component (input)
     */
    public get xyIn(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the zw component (input)
     */
    public get zwIn(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the x component (input)
     */
    public get xIn(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the y component (input)
     */
    public get yIn(): NodeGeometryConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the z component (input)
     */
    public get zIn(): NodeGeometryConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the w component (input)
     */
    public get wIn(): NodeGeometryConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the xyzw component (output)
     */
    public get xyzwOut(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the xyz component (output)
     */
    public get xyzOut(): NodeGeometryConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the xy component (output)
     */
    public get xyOut(): NodeGeometryConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the zw component (output)
     */
    public get zwOut(): NodeGeometryConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the x component (output)
     */
    public get xOut(): NodeGeometryConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the y component (output)
     */
    public get yOut(): NodeGeometryConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the z component (output)
     */
    public get zOut(): NodeGeometryConnectionPoint {
        return this._outputs[6];
    }

    /**
     * Gets the w component (output)
     */
    public get wOut(): NodeGeometryConnectionPoint {
        return this._outputs[7];
    }

    protected override _inputRename(name: string) {
        if (name === "xyzw ") {
            return "xyzwIn";
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
            case "xyzw":
                return "xyzwOut";
            default:
                return name;
        }
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        super._buildBlock(state);

        const xInput = this.xIn;
        const yInput = this.yIn;
        const zInput = this.zIn;
        const wInput = this.wIn;
        const xyInput = this.xyIn;
        const zwInput = this.zwIn;
        const xyzInput = this.xyzIn;
        const xyzwInput = this.xyzwIn;

        const xyzwOutput = this.xyzwOut;
        const xyzOutput = this.xyzOut;
        const xyOutput = this.xyOut;
        const zwOutput = this.zwOut;
        const xOutput = this.xOut;
        const yOutput = this.yOut;
        const zOutput = this.zOut;
        const wOutput = this.wOut;

        const getData = (state: NodeGeometryBuildState): Vector4 => {
            if (xyzwInput.isConnected) {
                return xyzwInput.getConnectedValue(state);
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

            return new Vector4(x, y, z, w);
        };

        xyzwOutput._storedFunction = (state) => getData(state);
        xyzOutput._storedFunction = (state) => {
            const data = getData(state);
            return new Vector3(data.x, data.y, data.z);
        };
        xyOutput._storedFunction = (state) => {
            const data = getData(state);
            return new Vector2(data.x, data.y);
        };
        zwOutput._storedFunction = (state) => {
            const data = getData(state);
            return new Vector2(data.z, data.w);
        };
        xOutput._storedFunction = (state) => getData(state).x;
        yOutput._storedFunction = (state) => getData(state).y;
        zOutput._storedFunction = (state) => getData(state).z;
        wOutput._storedFunction = (state) => getData(state).w;
    }
}

RegisterClass("BABYLON.VectorConverterBlock", VectorConverterBlock);
