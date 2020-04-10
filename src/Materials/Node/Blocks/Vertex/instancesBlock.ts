import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { NodeMaterialSystemValues } from '../../Enums/nodeMaterialSystemValues';
import { InputBlock } from '../Input/inputBlock';
import { _TypeStore } from '../../../../Misc/typeStore';

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
        this.registerOutput("instanceID", NodeMaterialBlockConnectionPointTypes.Float);
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

    /**
     * Gets the isntanceID component
     */
    public get instanceID(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.world0.connectedPoint) {
            let world0Input = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "world0");

            if (!world0Input) {
                world0Input = new InputBlock("world0");
                world0Input.setAsAttribute("world0");
            }
            world0Input.output.connectTo(this.world0);
        }
        if (!this.world1.connectedPoint) {
            let world1Input = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "world1");

            if (!world1Input) {
                world1Input = new InputBlock("world1");
                world1Input.setAsAttribute("world1");
            }
            world1Input.output.connectTo(this.world1);
        }
        if (!this.world2.connectedPoint) {
            let world2Input = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "world2");

            if (!world2Input) {
                world2Input = new InputBlock("world2");
                world2Input.setAsAttribute("world2");
            }
            world2Input.output.connectTo(this.world2);
        }
        if (!this.world3.connectedPoint) {
            let world3Input = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "world3");

            if (!world3Input) {
                world3Input = new InputBlock("world3");
                world3Input.setAsAttribute("world3");
            }
            world3Input.output.connectTo(this.world3);
        }
        if (!this.world.connectedPoint) {
            let worldInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "world");

            if (!worldInput) {
                worldInput = new InputBlock("world");
                worldInput.setAsSystemValue(NodeMaterialSystemValues.World);
            }
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
        let instanceID = this._outputs[1];
        let world0 = this.world0;
        let world1 = this.world1;
        let world2 = this.world2;
        let world3 = this.world3;

        state.compilationString += `#ifdef INSTANCES\r\n`;
        state.compilationString += this._declareOutput(output, state) + ` = mat4(${world0.associatedVariableName}, ${world1.associatedVariableName}, ${world2.associatedVariableName}, ${world3.associatedVariableName});\r\n`;
        state.compilationString += this._declareOutput(instanceID, state) + ` = float(gl_InstanceID);\r\n`;
        state.compilationString += `#else\r\n`;
        state.compilationString += this._declareOutput(output, state) + ` = ${this.world.associatedVariableName};\r\n`;
        state.compilationString += this._declareOutput(instanceID, state) + ` = 0.0;\r\n`;
        state.compilationString += `#endif\r\n`;
        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.InstancesBlock"] = InstancesBlock;