import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';

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

        // Auto-configuration
        this.world0.setAsAttribute();
        this.world1.setAsAttribute();
        this.world2.setAsAttribute();
        this.world3.setAsAttribute();
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
}