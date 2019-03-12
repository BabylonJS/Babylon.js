import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { NodeMaterialWellKnownValues } from '../../nodeMaterialWellKnownValues';

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
            this.world0.setAsAttribute();
        }
        if (!this.world1.connectedPoint) {
            this.world1.setAsAttribute();
        }
        if (!this.world2.connectedPoint) {
            this.world2.setAsAttribute();
        }
        if (!this.world3.connectedPoint) {
            this.world3.setAsAttribute();
        }
        if (!this.world.connectedPoint) {
            this.world.setAsWellKnownValue(NodeMaterialWellKnownValues.World);
        }
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