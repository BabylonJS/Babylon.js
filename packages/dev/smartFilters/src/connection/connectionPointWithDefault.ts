import type { BaseBlock } from "../blockFoundation/baseBlock";
import { ConnectionPoint, type RuntimeData } from "./connectionPoint.js";
import type { ConnectionPointDirection } from "./connectionPointDirection";
import type { ConnectionPointType } from "./connectionPointType";

/**
 * A ConnectionPoint whose runtimeData is never null - if not hooked up to a connection, it will use a default value.
 */
export class ConnectionPointWithDefault<
    U extends ConnectionPointType = ConnectionPointType,
> extends ConnectionPoint<U> {
    /**
     * The runtime data for this ConnectionPoint - it will never be null - if not hooked up to a connection, it will use the default value.
     */
    public override runtimeData: RuntimeData<U>;

    /**
     * Create a new ConnectionPointWithDefault
     * @param name - The name the connection point has in the block
     * @param ownerBlock - The block the connection point belongs to
     * @param type - The type of the connection point
     * @param direction - The direction of the connection point
     * @param runtimeData - The runtimeData to use for this connection point if no connection is made
     */
    constructor(
        name: string,
        ownerBlock: BaseBlock,
        type: U,
        direction: ConnectionPointDirection,
        runtimeData: RuntimeData<U>
    ) {
        super(name, ownerBlock, type, direction, runtimeData);
        this.runtimeData = runtimeData;
    }
}
