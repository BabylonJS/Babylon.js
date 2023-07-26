import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Vector4 } from "../../../../Maths/math.vector";
import { CreateTorusVertexData } from "core/Meshes/Builders";

/**
 * Defines a block used to generate torus geometry data
 */
export class TorusBlock extends NodeGeometryBlock {

    /**
     * Create a new SphereBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("diameter", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("thickness", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("tessellation", NodeGeometryBlockConnectionPointTypes.Float, true);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "TorusBlock";
    }

    /**
     * Gets the diameter input component
     */
    public get diameter(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the thickness input component
     */
    public get thickness(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }
    
    /**
     * Gets the tessellation input component
     */
    public get tessellation(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }        

    /**
     * Gets the geometry output component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }   

    public autoConfigure() {
        if (!this.diameter.isConnected) {
            const diameterInput = new GeometryInputBlock("Diameter");
            diameterInput.value = 1;
            diameterInput.output.connectTo(this.diameter);
        }  
    }    

    protected _buildBlock(state: NodeGeometryBuildState) {
        const options: {
            diameter?: number; 
            thickness?: number; 
            tessellation?: number; 
            sideOrientation?: number; 
            frontUVs?: Vector4; 
            backUVs?: Vector4
        } = {};

        if (this.thickness.isConnected) {
            options.thickness = this.thickness.getConnectedValue(state);
        }

        if (this.diameter.isConnected) {
            options.diameter = this.diameter.getConnectedValue(state);
        }

        if (this.tessellation.isConnected) {
            options.tessellation = this.tessellation.getConnectedValue(state);
        }   

        // Append vertex data from the plane builder
        this.geometry._storedValue = CreateTorusVertexData(options);
    }
}


RegisterClass("BABYLON.TorusBlock", TorusBlock);
