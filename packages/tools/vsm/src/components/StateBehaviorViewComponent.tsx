import type { FC } from "react";
import { SelectionContext } from "./SelectionContext";
import { useState, useRef, useCallback, useEffect, useContext } from "react";
import { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { GraphCanvasComponent } from "shared-ui-components/nodeGraphSystem/graphCanvas";
import type { Nullable } from "core/types";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { PortDataDirection } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import style from "./StatesViewComponent.modules.scss";
import { RegisterToDisplayManagers } from "./nodesDisplay/registerToDisplayLedger";
import { NodeLink } from "shared-ui-components/nodeGraphSystem/nodeLink";
import type { NodePort } from "shared-ui-components/nodeGraphSystem/nodePort";
import { NodeTypes } from "./types";
import { stateValuesProvider } from "../workbench";

const connectToFn = (self: IPortData, port: IPortData) => {
    self.isConnected = true;
    self.connectedPort = port;
    self.hasEndpoints = true;

    port.isConnected = true;
    port.connectedPort = self;
    port.hasEndpoints = true;
};

const disconnectFromFn = (self: IPortData, port: IPortData) => {
    self.isConnected = false;
    self.connectedPort = null;
    self.hasEndpoints = false;

    port.isConnected = false;
    port.connectedPort = null;
    port.hasEndpoints = false;
};

// Only ports of different types can connect
const checkCompatFn = (self: IPortData, port: IPortData) => {
    return 0;
};

const getCompatIssueMsgFn = (self: IPortData, issue: number, targetNode: GraphNode, targetPort: IPortData) => {
    return "";
};

function createNewPortData(name: string, output: boolean, ownerData: INodeData) {
    const outputData = {
        name,
        data: {},
        internalName: name,
        isExposedOnFrame: false,
        exposedPortPosition: -1,
        isConnected: false,
        direction: output ? PortDataDirection.Output : PortDataDirection.Input,
        ownerData: {},
        connectedPort: null,
        needDualDirectionValidation: false,
        hasEndpoints: false,
        endpoints: null,
        updateDisplayName: () => {},
        canConnectTo: () => true,
        connectTo: (port: IPortData) => {},
        disconnectFrom: (port: IPortData) => {},
        checkCompatibilityState: (port: IPortData) => 0,
        getCompatibilityIssueMessage: (issue: number, targetNode: GraphNode, targetPort: IPortData) => "",
    };
    outputData.connectTo = (port: IPortData) => connectToFn(outputData, port);
    outputData.disconnectFrom = (port: IPortData) => disconnectFromFn(outputData, port);
    outputData.checkCompatibilityState = (port: IPortData) => checkCompatFn(outputData, port);
    outputData.getCompatibilityIssueMessage = (issue: number, targetNode: GraphNode, targetPort: IPortData) => getCompatIssueMsgFn(outputData, issue, targetNode, targetPort);
    outputData.ownerData = ownerData.data;

    if (output) {
        ownerData.outputs.push(outputData);
    } else {
        ownerData.inputs.push(outputData);
    }

    return outputData;
}

function createNewNodeData(name: string, inputs: string[], outputs: string[], type: string, extra: Object = {}) {
    const outputNodeData = {
        name: name,
        data: { ...extra },
        uniqueId: Date.now(),
        isInput: true,
        comments: "Test comment",
        prepareHeaderIcon: () => {},
        getClassName: () => type,
        dispose: () => {},
        getPortByName: () => {
            return null;
        },
        inputs: [],
        outputs: [],
    };

    for (let i = 0; i < inputs.length; i++) {
        createNewPortData(inputs[i], false, outputNodeData);
    }

    for (let i = 0; i < outputs.length; i++) {
        createNewPortData(outputs[i], true, outputNodeData);
    }

    return outputNodeData;
}

export const StateBehaviorViewComponent: FC = () => {
    const { selectedNode } = useContext(SelectionContext);
    const { stateValues } = useContext(stateValuesProvider);
    const [stateManager, setStateManager] = useState<Nullable<StateManager>>(null);
    const [graphCanvasComponent, setGraphCanvasComponent] = useState<Nullable<GraphCanvasComponent>>(null);
    const [, setNodes] = useState(new Array<GraphNode>());
    const [, setLinks] = useState(new Array<NodeLink>());

    const rootContainer: React.MutableRefObject<Nullable<HTMLDivElement>> = useRef(null);
    const graphCanvasComponentRef = useCallback((gccRef: Nullable<GraphCanvasComponent>) => {
        setGraphCanvasComponent(gccRef);
    }, []);

    useEffect(() => {
        RegisterToDisplayManagers();
    }, []);

    // Initialize the state manager
    useEffect(() => {
        if (rootContainer.current) {
            const newStateManager = new StateManager();
            newStateManager.hostDocument = rootContainer.current.ownerDocument;
            newStateManager.applyNodePortDesign = (data, element, img) => {
                element.style.background = data.ownerData.color || "gray";
                img.src =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IxPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48Y2lyY2xlIGNsYXNzPSJjbHMtMSIgY3g9IjEwLjUiIGN5PSIxMC41IiByPSI3LjUiLz48L2c+PC9zdmc+";
            };
            newStateManager.onErrorMessageDialogRequiredObservable.add((message) => {
                console.log("error when connecting nodes!", message);
            });
            setStateManager(newStateManager);
        }
    }, [rootContainer]);

    // Initialize the nodes
    useEffect(() => {
        if (stateManager && graphCanvasComponent && selectedNode) {
            // Have to clear out existing nodes.
            graphCanvasComponent.reset();

            const newNodes = new Array<GraphNode>();

            // Create nodes
            const nodesToAdd = [
                { name: "START", output: "out", color: "green", type: NodeTypes.StartActionNode },
                { name: "READY", inputs: "in", color: "red", type: NodeTypes.ReadyActionNode },
                { name: "setPosition", inputs: "action,value", output: "action", type: NodeTypes.ActionNode },
                { name: "vectorValue", output: "value", type: NodeTypes.ValueNode, value: stateValues[selectedNode.name] },
            ];
            for (const nodeToAdd of nodesToAdd) {
                const graphNode = onAddNewNode(nodeToAdd);
                if (graphNode) {
                    newNodes.push(graphNode);
                }
            }
            // Position and link nodes
            const origin = newNodes[0];
            const dest = newNodes[1];
            const setPos = newNodes[2];
            const vectorValue = newNodes[3];

            const nodeSpacing = 400;

            origin.x = 100;
            origin.y = 100;

            vectorValue.x = origin.x;
            vectorValue.y = 250;

            setPos.x = origin.x + nodeSpacing;
            setPos.y = 100;

            dest.x = setPos.x + nodeSpacing;
            dest.y = 100;

            const newLinks = new Array<NodeLink>();

            newLinks.push(linkPorts(graphCanvasComponent, origin, origin.outputPorts[0], setPos, setPos.inputPorts[0]));
            newLinks.push(linkPorts(graphCanvasComponent, setPos, setPos.outputPorts[0], dest, dest.inputPorts[0]));
            newLinks.push(linkPorts(graphCanvasComponent, vectorValue, vectorValue.outputPorts[0], setPos, setPos.inputPorts[1]));

            setNodes(newNodes);
            setLinks(newLinks);
        }
    }, [stateManager, graphCanvasComponent, selectedNode]);

    const linkPorts = (graphCanvasComponent: GraphCanvasComponent, node: GraphNode, port: NodePort, targetNode: GraphNode, targetPort: NodePort) => {
        port.portData.connectTo(targetPort.portData);
        const newLink = new NodeLink(graphCanvasComponent, port, node, targetPort, targetNode);
        node.links.push(newLink);
        targetNode.links.push(newLink);
        return newLink;
    };

    // Set up key handling
    useEffect(() => {
        if (graphCanvasComponent && rootContainer.current) {
            rootContainer.current.addEventListener("keydown", (evt) => {
                graphCanvasComponent!.handleKeyDown(
                    evt,
                    (nodeData: INodeData) => {},
                    0,
                    0,
                    (nodeData: INodeData) => {
                        // const name = nodeData.name;
                        // const inputs = nodeData.inputs.map((i) => i.name);
                        // const outputs = nodeData.outputs.map((o) => o.name);
                        // return graphCanvasComponent.appendNode(createNewNodeData(name, inputs, outputs));
                    },
                    graphCanvasComponent!.canvasContainer
                );
            });
        }
    }, [graphCanvasComponent]);

    // Create a new node and pass the state manager
    const onAddNewNode = (props: { name: string; inputs?: string; output?: string; color?: string; type: string; value?: any }): Nullable<GraphNode> => {
        const name = props.name as string;
        const inputs = props.inputs as string;
        const output = props.output as string;
        if (graphCanvasComponent !== null) {
            // OUTPUT NODE
            return graphCanvasComponent.appendNode(
                createNewNodeData(name, inputs ? inputs.split(",").filter((v) => v !== "") : [], output ? output.split(",").filter((v) => v !== "") : [], props.type, {
                    color: props.color,
                    value: props.value,
                })
            );
        } else {
            return null;
        }
    };

    const onEmitNewNode = (nodeData: INodeData) => {
        const node = new GraphNode(nodeData, stateManager!);
        return node;
    };

    return (
        <div className={style.vsmRoot} ref={rootContainer}>
            {stateManager !== null && <GraphCanvasComponent ref={graphCanvasComponentRef} stateManager={stateManager} onEmitNewNode={onEmitNewNode}></GraphCanvasComponent>}
        </div>
    );
};
