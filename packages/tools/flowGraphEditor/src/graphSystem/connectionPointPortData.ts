import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { type FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { FlowGraphConnectionType } from "core/FlowGraph/flowGraphConnection";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { type Nullable } from "core/types";
import { type INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import { type IPortData, type IPortDirectValueDefinition, PortDataDirection, PortDirectValueTypes } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { type GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";

export type FlowGraphConnectionPoint = FlowGraphDataConnection<any> | FlowGraphSignalConnection;

/**
 * Adapts a flow graph connection point to the IPortData interface used by the graph canvas.
 */
export class ConnectionPointPortData implements IPortData {
    private _connectedPort: Nullable<IPortData> = null;
    private _nodeContainer: INodeContainer;
    private _integerProxy: { value: number } | null = null;

    /**
     * Map of input type names to arrays of output type names they can additionally accept
     * (beyond same-type and Any connections).
     */
    private static readonly _ACCEPTED_INPUT_TYPES: Record<string, string[]> = {
        // Quaternion's typeTransformer can accept Vector4, Vector3, Matrix
        [FlowGraphTypes.Quaternion]: [FlowGraphTypes.Vector4, FlowGraphTypes.Vector3, FlowGraphTypes.Matrix],
        // Number and Integer are interchangeable
        [FlowGraphTypes.Number]: [FlowGraphTypes.Integer],
        [FlowGraphTypes.Integer]: [FlowGraphTypes.Number],
    };

    /** The underlying flow graph connection point */
    public data: FlowGraphConnectionPoint;
    /** Whether this is a data or signal connection */
    public connectionKind: "data" | "signal";

    /** Gets the display name of the port */
    public get name() {
        return this.data.name;
    }

    /** Gets the internal name of the port */
    public get internalName() {
        return this.data.name;
    }

    private _isExposedOnFrame = false;
    private _exposedPortPosition = -1;

    /** Whether this port is exposed on a frame */
    public get isExposedOnFrame() {
        return this._isExposedOnFrame;
    }

    /** Sets whether this port is exposed on a frame */
    public set isExposedOnFrame(value: boolean) {
        this._isExposedOnFrame = value;
    }

    /** Gets the exposed port position */
    public get exposedPortPosition() {
        return this._exposedPortPosition;
    }

    /** Sets the exposed port position */
    public set exposedPortPosition(value: number) {
        this._exposedPortPosition = value;
    }

    /** Whether this port has any connections */
    public get isConnected() {
        return this.data._connectedPoint && this.data._connectedPoint.length > 0;
    }

    /**
     * For primitive data input ports, returns a definition that lets the shared
     * GraphNode render an inline editor directly on the port.
     */
    public get directValueDefinition(): IPortDirectValueDefinition | undefined {
        if (this.connectionKind !== "data" || this.direction !== PortDataDirection.Input) {
            return undefined;
        }

        const conn = this.data as FlowGraphDataConnection<any>;
        const typeName = conn.richType.typeName;

        if (typeName === FlowGraphTypes.Number) {
            return {
                source: conn,
                propertyName: "_defaultValue",
                valueMin: undefined,
                valueMax: undefined,
                valueType: PortDirectValueTypes.Float,
            };
        }

        if (typeName === FlowGraphTypes.Integer) {
            if (!this._integerProxy) {
                const c = conn;
                this._integerProxy = {
                    get value() {
                        const def = (c as any)._defaultValue;
                        return def instanceof FlowGraphInteger ? def.value : 0;
                    },
                    set value(v: number) {
                        (c as any)._defaultValue = new FlowGraphInteger(v);
                    },
                };
            }
            return {
                source: this._integerProxy,
                propertyName: "value",
                valueMin: undefined,
                valueMax: undefined,
                valueType: PortDirectValueTypes.Int,
            };
        }

        if (typeName === FlowGraphTypes.String) {
            return {
                source: conn,
                propertyName: "_defaultValue",
                valueMin: undefined,
                valueMax: undefined,
                valueType: PortDirectValueTypes.String,
            };
        }

        return undefined;
    }

    /** Whether this port is inactive */
    public get isInactive() {
        return false;
    }

    /** Gets the first connected port */
    public get connectedPort() {
        if (!this.isConnected) {
            return null;
        }
        if (!this._connectedPort && this.data._connectedPoint.length > 0) {
            const connectedPoint = this.data._connectedPoint[0];
            const otherBlock = (connectedPoint as any)._ownerBlock;
            if (otherBlock) {
                const otherNode = this._nodeContainer.nodes.find((n) => n.content.data === otherBlock);
                if (otherNode) {
                    this._connectedPort = otherNode.getPortDataForPortDataContent(connectedPoint);
                }
            }
        }
        return this._connectedPort;
    }

    /** Sets the connected port */
    public set connectedPort(value: Nullable<IPortData>) {
        this._connectedPort = value;
    }

    /** Gets the port direction (input or output) */
    public get direction() {
        if (this.data._connectionType === FlowGraphConnectionType.Input) {
            return PortDataDirection.Input;
        }
        return PortDataDirection.Output;
    }

    /** Gets the block that owns this port */
    public get ownerData() {
        return (this.data as any)._ownerBlock;
    }

    /** Whether this port needs dual-direction validation */
    public get needDualDirectionValidation() {
        return false;
    }

    /** Whether this port has connected endpoints */
    public get hasEndpoints() {
        return this.data._connectedPoint && this.data._connectedPoint.length > 0;
    }

    /** Gets all connected endpoint port data */
    public get endpoints() {
        const endpoints: IPortData[] = [];
        if (this.data._connectedPoint) {
            for (const endpoint of this.data._connectedPoint) {
                const endpointOwnerBlock = (endpoint as any)._ownerBlock;
                const endpointNode = this._nodeContainer.nodes.find((n) => n.content.data === endpointOwnerBlock);
                if (endpointNode) {
                    const portData = endpointNode.getPortDataForPortDataContent(endpoint);
                    if (portData) {
                        endpoints.push(portData);
                    }
                }
            }
        }
        return endpoints;
    }

    /**
     * Creates a new ConnectionPointPortData.
     * @param connectionPoint - the flow graph connection point
     * @param nodeContainer - the node container for resolving connections
     * @param connectionKind - whether this is a "data" or "signal" connection
     */
    public constructor(connectionPoint: FlowGraphConnectionPoint, nodeContainer: INodeContainer, connectionKind: "data" | "signal") {
        this.data = connectionPoint;
        this._nodeContainer = nodeContainer;
        this.connectionKind = connectionKind;
    }

    /**
     * Update the display name (no-op for flow graph connections).
     * @param _newName - the new name (unused)
     */
    public updateDisplayName(_newName: string) {
        // Signal connections don't have a displayName property
    }

    /**
     * Connect this port to another port.
     * @param port - the target port to connect to
     */
    public connectTo(port: IPortData) {
        this.data.connectTo(port.data);
        this._connectedPort = port;
    }

    /**
     * Check if this port can connect to another port.
     * @param port - the target port to check
     * @returns true if connection is allowed
     */
    public canConnectTo(port: IPortData): boolean {
        // Same kind check (signal↔signal, data↔data)
        const otherPort = port as ConnectionPointPortData;
        if (this.connectionKind !== otherPort.connectionKind) {
            return false;
        }
        // Input↔Output only
        if (this.direction === otherPort.direction) {
            return false;
        }
        return true;
    }

    /**
     * Disconnect this port from another port.
     * @param port - the port to disconnect from
     */
    public disconnectFrom(port: IPortData) {
        this.data.disconnectFrom(port.data);
        port.connectedPort = null;
    }

    /**
     * Check if the data types of two data ports are compatible for connection.
     * @param port - the other port to check against
     * @returns true if types are compatible
     */
    private _areDataTypesCompatible(port: IPortData): boolean {
        const otherPort = port as ConnectionPointPortData;

        // Only check data connections
        if (this.connectionKind !== "data" || otherPort.connectionKind !== "data") {
            return true;
        }

        const thisData = this.data as FlowGraphDataConnection<any>;
        const otherData = otherPort.data as FlowGraphDataConnection<any>;

        const thisType = thisData.richType.typeName;
        const otherType = otherData.richType.typeName;

        // Any is compatible with everything
        if (thisType === FlowGraphTypes.Any || otherType === FlowGraphTypes.Any) {
            return true;
        }

        // Same type is always compatible
        if (thisType === otherType) {
            return true;
        }

        // Determine which is input and which is output
        const inputPort = this.direction === PortDataDirection.Input ? this : otherPort;
        const outputPort = this.direction === PortDataDirection.Output ? this : otherPort;
        const inputData = inputPort.data as FlowGraphDataConnection<any>;
        const outputData = outputPort.data as FlowGraphDataConnection<any>;

        const inputType = inputData.richType.typeName;
        const outputType = outputData.richType.typeName;

        // Check if the input type can accept the output type via typeTransformer
        const acceptedTypes = ConnectionPointPortData._ACCEPTED_INPUT_TYPES[inputType];
        if (acceptedTypes && acceptedTypes.indexOf(outputType) !== -1) {
            return true;
        }

        return false;
    }

    /**
     * Check the compatibility state between this port and another.
     * @param port - the target port to check
     * @returns 0 if compatible, 1 if direction/kind incompatible, 2 if type mismatch
     */
    public checkCompatibilityState(port: IPortData) {
        if (!this.canConnectTo(port)) {
            return 1; // incompatible direction or kind
        }
        if (!this._areDataTypesCompatible(port)) {
            return 2; // data type mismatch
        }
        return 0; // compatible
    }

    /**
     * Get a human-readable message for a compatibility issue.
     * @param issue - the issue code
     * @param _targetNode - the target graph node (unused)
     * @param _targetPort - the target port data (unused)
     * @returns a description of the issue
     */
    public getCompatibilityIssueMessage(issue: number, _targetNode: GraphNode, _targetPort: IPortData) {
        switch (issue) {
            case 1:
                return "Incompatible connection types";
            case 2: {
                const thisData = this.data as FlowGraphDataConnection<any>;
                const otherData = _targetPort.data as FlowGraphDataConnection<any>;
                return `Type mismatch: cannot connect ${thisData.richType.typeName} to ${otherData.richType.typeName}`;
            }
            default:
                return "";
        }
    }
}
