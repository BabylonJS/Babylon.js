import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { NodeMaterialWellKnownValues } from '../../nodeMaterialWellKnownValues';
import { InputBlock } from '../Input/inputBlock';

/**
 * Block used to add support for instances
 * @see https://doc.babylonjs.com/how_to/how_to_use_instances
 */
export class InstancesBlock extends NodeMaterialBlock {
    /**
     * Creates a new InstancesBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Vertex);

        this.registerInput("world0", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("world1", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("world2", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("world3", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("world", NodeMaterialBlockConnectionPointTypes.Matrix, true);

        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "InstancesBlock";
    }

    /**
     * Gets the first world row input component
     */
    public get world0(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the second world row input component
     */
    public get world1(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the third world row input component
     */
    public get world2(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the forth world row input component
     */
    public get world3(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the world input component
     */
    public get world(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure() {
        if (!this.world0.connectedPoint) {
            let world0Input = new InputBlock("world0");
            world0Input.setAsAttribute("world0");
            world0Input.output.connectTo(this.world0);
        }
        if (!this.world1.connectedPoint) {
            let world1Input = new InputBlock("world1");
            world1Input.setAsAttribute("world1");
            world1Input.output.connectTo(this.world1);
        }
        if (!this.world2.connectedPoint) {
            let world2Input = new InputBlock("world2");
            world2Input.setAsAttribute("world2");
            world2Input.output.connectTo(this.world2);
        }
        if (!this.world3.connectedPoint) {
            let world3Input = new InputBlock("world3");
            world3Input.setAsAttribute("world3");
            world3Input.output.connectTo(this.world3);
        }
        if (!this.world.connectedPoint) {
            let worldInput = new InputBlock("world");
            worldInput.setAsWellKnownValue(NodeMaterialWellKnownValues.World);
            worldInput.output.connectTo(this.world);
        }

        this.world.define = "!INSTANCES";
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines, useInstances: boolean = false) {
        let changed = false;
        if (defines["INSTANCES"] !== useInstances) {
            defines.setValue("INSTANCES", useInstances);
            changed = true;
        }

        if (changed) {
            defines.markAsUnprocessed();
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        // Register for defines
        state.sharedData.blocksWithDefines.push(this);

        // Emit code
        let output = this._outputs[0];
        let world0 = this.world0;
        let world1 = this.world1;
        let world2 = this.world2;
        let world3 = this.world3;

        state.compilationString += `#ifdef INSTANCES\r\n`;
        state.compilationString += this._declareOutput(output, state) + ` = mat4(${world0.associatedVariableName}, ${world1.associatedVariableName}, ${world2.associatedVariableName}, ${world3.associatedVariableName});\r\n`;
        state.compilationString += `#else\r\n`;
        state.compilationString += this._declareOutput(output, state) + ` = ${this.world.associatedVariableName};\r\n`;
        state.compilationString += `#endif\r\n`;
        return this;
    }
}