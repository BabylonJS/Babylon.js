import type { Nullable } from "core/types.js";
import type { ConnectionPoint, RuntimeData } from "../connection/connectionPoint.js";
import type { ConnectionPointType } from "../connection/connectionPointType.js";

import { BaseBlock } from "./baseBlock.js";

/**
 * The aggregate block class is the base class for all blocks that be created from other blocks.
 *
 * It is responsible for managing a hidden chain of smart filter blocks in order and expose them through
 * its own connection points.
 *
 * The internal state is basically a filter itself.
 */
export abstract class AggregateBlock extends BaseBlock {
    /**
     * The class name of the block.
     */
    public static override ClassName = "AggregateBlock";

    /**
     * The list of relationships between the internal graph output and the outside ones.
     */
    private readonly _aggregatedOutputs: [ConnectionPoint, ConnectionPoint][] = [];

    /**
     * The list of relationships between the internal graph inputs and the outside ones.
     */
    private readonly _aggregatedInputs: [ConnectionPoint[], ConnectionPoint][] = [];

    /**
     * Do not override prepareForRuntime for aggregate blocks. It is not supported.
     */
    public override prepareForRuntime(): never {
        throw new Error("Aggregate blocks should not be prepared for runtime.");
    }

    /**
     * @internal
     * Merges the internal graph into the SmartFilter
     */
    public _mergeIntoSmartFilter(mergedAggregateBlocks: AggregateBlock[]): void {
        // Rewire output connections
        for (const [internalConnectionPoint, externalConnectionPoint] of this._aggregatedOutputs) {
            const endpointsToConnectTo = externalConnectionPoint.endpoints.slice();
            externalConnectionPoint.disconnectAllEndpoints();
            for (const endpoint of endpointsToConnectTo) {
                internalConnectionPoint.connectTo(endpoint);
            }
        }

        // Rewire input connections
        for (const [internalConnectionPoints, externalConnectionPoint] of this._aggregatedInputs) {
            const connectedToExternalConnectionPoint = externalConnectionPoint.connectedTo;
            if (connectedToExternalConnectionPoint) {
                connectedToExternalConnectionPoint.disconnectFrom(externalConnectionPoint);
                for (const internalConnectionPoint of internalConnectionPoints) {
                    connectedToExternalConnectionPoint.connectTo(internalConnectionPoint);
                }
            } else {
                // If the external connection point is not connected to anything but has a default value,
                // pass that default value along to the internal connection points it is associated with
                const defaultValue = externalConnectionPoint.runtimeData;
                if (defaultValue !== null) {
                    for (const internalConnectionPoint of internalConnectionPoints) {
                        internalConnectionPoint.runtimeData = defaultValue;
                    }
                }
            }
        }

        // Tell any internal aggregate blocks to merge
        // Must be done after the inputs and outputs were merged at our level, or the internal aggregate block may not be wired up to anything
        for (const aggregateOutput of this._aggregatedOutputs) {
            const internalConnectionPoint = aggregateOutput[0];
            internalConnectionPoint.ownerBlock.visit({}, (block: BaseBlock, _extraData: object) => {
                if (block instanceof AggregateBlock) {
                    block._mergeIntoSmartFilter(mergedAggregateBlocks);
                }
            });
        }

        // Add ourselves to the list of merged aggregate blocks
        mergedAggregateBlocks.push(this);
    }

    /**
     * @internal
     * Undoes a previous mergeIntoSmartFilter call.
     */
    public _unmergeFromSmartFilter(): void {
        for (const [internalConnectionPoint, externalConnectionPoint] of this._aggregatedOutputs) {
            const endpointsToConnectTo = internalConnectionPoint.endpoints.slice();
            internalConnectionPoint.disconnectAllEndpoints();
            for (const endpoint of endpointsToConnectTo) {
                externalConnectionPoint.connectTo(endpoint);
            }
        }

        for (const [internalConnectionPoints, externalConnectionPoint] of this._aggregatedInputs) {
            if (internalConnectionPoints[0]) {
                const connectedToInternalConnectionPoint = internalConnectionPoints[0].connectedTo;
                if (connectedToInternalConnectionPoint) {
                    for (const internalConnectionPoint of internalConnectionPoints) {
                        connectedToInternalConnectionPoint.disconnectFrom(internalConnectionPoint);
                    }
                    connectedToInternalConnectionPoint.connectTo(externalConnectionPoint);
                }
            }
        }
    }

    /**
     * Registers an input connection from the internal graph as an input of the aggregated graph.
     * @param name - The name of the exposed input connection point
     * @param internalConnectionPoints - The input connection points in the inner graph to wire up to the new subfilter input
     * @param defaultValue - The default value to use for the input connection point
     * @returns the connection point referencing the input block
     */
    protected _registerSubfilterInput<U extends ConnectionPointType>(
        name: string,
        internalConnectionPoints: ConnectionPoint<U>[],
        defaultValue: Nullable<RuntimeData<U>> = null
    ): ConnectionPoint<U> {
        const type = internalConnectionPoints[0]?.type;
        if (type === undefined) {
            throw new Error("Cannot register an input connection point with no internal connection points");
        }
        const externalInputConnectionPoint = this._registerInput(name, type, defaultValue);

        this._aggregatedInputs.push([internalConnectionPoints, externalInputConnectionPoint]);

        return externalInputConnectionPoint;
    }

    /**
     * Registers an output connection point from the internal graph as an output of the aggregated graph.
     * @param name - The name of the exposed output connection point
     * @param internalConnectionPoint - The output connection point in the inner graph to expose as an output on the aggregate block
     * @returns the connection point referencing the output connection point
     */
    protected _registerSubfilterOutput<U extends ConnectionPointType>(name: string, internalConnectionPoint: ConnectionPoint<U>): ConnectionPoint<U> {
        const externalOutputConnectionPoint = this._registerOutput(name, internalConnectionPoint.type);

        this._aggregatedOutputs.push([internalConnectionPoint, externalOutputConnectionPoint]);
        return externalOutputConnectionPoint;
    }
}
