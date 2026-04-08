import { type IFlowGraphBlockConfiguration, FlowGraphBlock } from "../../../flowGraphBlock";
import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeAny, RichTypeNumber, RichTypeVector3 } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { type PhysicsBody } from "../../../../Physics/v2/physicsBody";
import { type Vector3 } from "../../../../Maths/math.vector";

/**
 * @experimental
 * A data block that reads the mass properties of a physics body.
 * Outputs the mass, center of mass (local space), and principal inertia.
 */
export class FlowGraphGetPhysicsMassPropertiesBlock extends FlowGraphBlock {
    /**
     * Input connection: The physics body to read mass properties from.
     */
    public readonly body: FlowGraphDataConnection<PhysicsBody>;

    /**
     * Output connection: The total mass in kilograms.
     */
    public readonly mass: FlowGraphDataConnection<number>;

    /**
     * Output connection: The center of mass in local space.
     */
    public readonly centerOfMass: FlowGraphDataConnection<Vector3>;

    /**
     * Output connection: The principal moments of inertia.
     */
    public readonly inertia: FlowGraphDataConnection<Vector3>;

    /**
     * Constructs a new FlowGraphGetPhysicsMassPropertiesBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.body = this.registerDataInput("body", RichTypeAny);
        this.mass = this.registerDataOutput("mass", RichTypeNumber);
        this.centerOfMass = this.registerDataOutput("centerOfMass", RichTypeVector3);
        this.inertia = this.registerDataOutput("inertia", RichTypeVector3);
    }

    /**
     * @internal
     */
    public override _updateOutputs(context: FlowGraphContext): void {
        const physicsBody = this.body.getValue(context);
        if (!physicsBody) {
            return;
        }
        const props = physicsBody.getMassProperties();
        if (props.mass !== undefined) {
            this.mass.setValue(props.mass, context);
        }
        if (props.centerOfMass) {
            this.centerOfMass.setValue(props.centerOfMass, context);
        }
        if (props.inertia) {
            this.inertia.setValue(props.inertia, context);
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PhysicsGetMassProperties;
    }
}
RegisterClass(FlowGraphBlockNames.PhysicsGetMassProperties, FlowGraphGetPhysicsMassPropertiesBlock);
