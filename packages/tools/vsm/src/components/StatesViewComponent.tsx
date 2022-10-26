import type { FC } from "react";
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
import { SelectionContext } from "./SelectionContext";
import { SceneContext } from "../SceneContext";
import { useStateMachine } from "./tools/useStateMachine";
import { NodeTypes } from "./types";

export const StatesViewComponent: FC = () => {
    const [stateManager, setStateManager] = useState<Nullable<StateManager>>(null);
    const [graphCanvasComponent, setGraphCanvasComponent] = useState<Nullable<GraphCanvasComponent>>(null);
    const [, setNodes] = useState(new Array<GraphNode>());
    const [, setLinks] = useState(new Array<NodeLink>());
    const { setSelectedNode } = useContext(SelectionContext);
    const { scene } = useContext(SceneContext);
    const { stateMachine, lastUpdate } = useStateMachine();

    const rootContainer: React.MutableRefObject<Nullable<HTMLDivElement>> = useRef(null);
    const graphCanvasComponentRef = useCallback((gccRef: Nullable<GraphCanvasComponent>) => {
        setGraphCanvasComponent(gccRef);
    }, []);

    useEffect(() => {
        RegisterToDisplayManagers();
    }, []);

    const connectToFn = (self: IPortData, port: IPortData) => {
        self.isConnected = true;
        self.connectedPort = port;
        self.hasEndpoints = true;

        port.isConnected = true;
        port.connectedPort = self;
        port.hasEndpoints = true;

        const selfOwnerData = self.ownerData;
        const portOwnerData = port.ownerData;
        if (stateMachine && selfOwnerData && portOwnerData) {
            const stateOwner = selfOwnerData.state;
            const statePort = portOwnerData.state;
            if (stateOwner && statePort) {
                stateMachine.addTransition(stateOwner, statePort);
            }
        }
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

    function createNewNodeData(name: string, inputs: string[], outputs: string[], extra: Object = {}) {
        const outputNodeData = {
            name: name,
            data: extra,
            uniqueId: Date.now(),
            isInput: true,
            comments: "Test comment",
            prepareHeaderIcon: () => {},
            getClassName: () => NodeTypes.StateNode,
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

    // Initialize the state manager
    useEffect(() => {
        if (rootContainer.current) {
            const newStateManager = new StateManager();
            newStateManager.hostDocument = rootContainer.current.ownerDocument;
            newStateManager.applyNodePortDesign = (data, element, img) => {
                element.style.background = "black";
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
        if (stateManager && graphCanvasComponent && scene && stateMachine) {
            // Have to clear the existing nodes
            graphCanvasComponent.reset();
            const newNodes = new Array<GraphNode>();

            for (const state of stateMachine.getStates()) {
                const nodeToAdd = { name: state.name, inputs: "in", output: "out", data: state };
                const graphNode = onAddNewNode(nodeToAdd);
                if (graphNode) {
                    newNodes.push(graphNode);
                }
            }

            const newLinks = new Array<NodeLink>();

            for (const [originState, destState] of stateMachine.getTransitions()) {
                const originNode = newNodes.find((n) => n.content.data.state.id === originState);
                const destNode = newNodes.find((n) => n.content.data.state.id === destState.id);

                if (originNode && destNode) {
                    const link = linkPorts(graphCanvasComponent, originNode, originNode.outputPorts[0], destNode, destNode.inputPorts[0]);
                    newLinks.push(link);
                }
            }

            setNodes(newNodes);
            setLinks(newLinks);
        }
    }, [stateManager, graphCanvasComponent, scene, stateMachine, lastUpdate]);

    // Set up responding for node selection
    useEffect(() => {
        if (stateManager) {
            const selectionObserver = stateManager.onSelectionChangedObservable.add((selection) => {
                if (selection && selection.selection instanceof GraphNode) {
                    setSelectedNode(selection.selection);
                } else {
                    setSelectedNode(null);
                }
            });
            return () => {
                stateManager.onSelectionChangedObservable.remove(selectionObserver);
            };
        }
        return () => {};
    }, [stateManager]);

    // @ts-ignore
    const linkPorts = (graphCanvasComponent: GraphCanvasComponent, node: GraphNode, port: NodePort, targetNode: GraphNode, targetPort: NodePort) => {
        port.portData.connectTo(targetPort.portData);
        const newLink = new NodeLink(graphCanvasComponent, port, node, targetPort, targetNode);
        node.links.push(newLink);
        targetNode.links.push(newLink);
        return newLink;
    };

    // Create a new node and pass the state manager
    const onAddNewNode = (props: { name: string; inputs: string; output: string; data: any }): Nullable<GraphNode> => {
        const name = props.name as string;
        const inputs = props.inputs as string;
        const output = props.output as string;
        if (graphCanvasComponent !== null) {
            // OUTPUT NODE
            return graphCanvasComponent.appendNode(
                createNewNodeData(
                    name,
                    inputs.split(",").filter((v) => v !== ""),
                    output.split(",").filter((v) => v !== ""),
                    props.data
                )
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
