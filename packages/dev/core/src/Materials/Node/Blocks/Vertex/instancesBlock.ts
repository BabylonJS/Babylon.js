import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues";
import { InputBlock } from "../Input/inputBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { SubMesh } from "../../../../Meshes/subMesh";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to add support for instances
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances
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
    public override getClassName() {
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
     * Gets the instanceID component
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public get instanceID(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.world0.connectedPoint) {
            let world0Input = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "world0" && additionalFilteringInfo(b));

            if (!world0Input) {
                world0Input = new InputBlock("world0");
                world0Input.setAsAttribute("world0");
            }
            world0Input.output.connectTo(this.world0);
        }
        if (!this.world1.connectedPoint) {
            let world1Input = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "world1" && additionalFilteringInfo(b));

            if (!world1Input) {
                world1Input = new InputBlock("world1");
                world1Input.setAsAttribute("world1");
            }
            world1Input.output.connectTo(this.world1);
        }
        if (!this.world2.connectedPoint) {
            let world2Input = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "world2" && additionalFilteringInfo(b));

            if (!world2Input) {
                world2Input = new InputBlock("world2");
                world2Input.setAsAttribute("world2");
            }
            world2Input.output.connectTo(this.world2);
        }
        if (!this.world3.connectedPoint) {
            let world3Input = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "world3" && additionalFilteringInfo(b));

            if (!world3Input) {
                world3Input = new InputBlock("world3");
                world3Input.setAsAttribute("world3");
            }
            world3Input.output.connectTo(this.world3);
        }
        if (!this.world.connectedPoint) {
            let worldInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "world" && additionalFilteringInfo(b));

            if (!worldInput) {
                worldInput = new InputBlock("world");
                worldInput.setAsSystemValue(NodeMaterialSystemValues.World);
            }
            worldInput.output.connectTo(this.world);
        }

        this.world.define = "!INSTANCES || THIN_INSTANCES";
    }

    public override prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines, useInstances: boolean = false, subMesh?: SubMesh) {
        let changed = false;
        if (defines["INSTANCES"] !== useInstances) {
            defines.setValue("INSTANCES", useInstances);
            changed = true;
        }

        if (subMesh && defines["THIN_INSTANCES"] !== !!subMesh?.getRenderingMesh().hasThinInstances) {
            defines.setValue("THIN_INSTANCES", !!subMesh?.getRenderingMesh().hasThinInstances);
            changed = true;
        }

        if (changed) {
            defines.markAsUnprocessed();
        }
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const engine = state.sharedData.scene.getEngine();

        // Register for defines
        state.sharedData.blocksWithDefines.push(this);

        // Emit code
        const output = this._outputs[0];
        const instanceID = this._outputs[1];
        const world0 = this.world0;
        const world1 = this.world1;
        const world2 = this.world2;
        const world3 = this.world3;

        let mat4 = "mat4";
        let instance = "gl_InstanceID";
        let floatCast = "float";
        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            mat4 = "mat4x4f";
            instance = "vertexInputs.instanceIndex";
            floatCast = "f32";
        }

        state.compilationString += `#ifdef INSTANCES\n`;
        state.compilationString +=
            state._declareOutput(output) +
            ` = ${mat4}(${world0.associatedVariableName}, ${world1.associatedVariableName}, ${world2.associatedVariableName}, ${world3.associatedVariableName});\n`;
        state.compilationString += `#ifdef THIN_INSTANCES\n`;
        state.compilationString += `${output.associatedVariableName} = ${this.world.associatedVariableName} * ${output.associatedVariableName};\n`;
        state.compilationString += `#endif\n`;
        if (engine._caps.canUseGLInstanceID) {
            state.compilationString += state._declareOutput(instanceID) + ` = ${floatCast}(${instance});\n`;
        } else {
            state.compilationString += state._declareOutput(instanceID) + ` = 0.0;\n`;
        }
        state.compilationString += `#else\n`;
        state.compilationString += state._declareOutput(output) + ` = ${this.world.associatedVariableName};\n`;
        state.compilationString += state._declareOutput(instanceID) + ` = 0.0;\n`;
        state.compilationString += `#endif\n`;
        return this;
    }
}

RegisterClass("BABYLON.InstancesBlock", InstancesBlock);
