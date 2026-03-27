import * as React from "react";
import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { StringTools } from "shared-ui-components/stringTools";
import { FileButtonLineComponent } from "../../sharedComponents/fileButtonLineComponent";
import { Tools } from "core/Misc/tools";
import { SerializationTools } from "../../serializationTools";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { DataStorage } from "core/Misc/dataStorage";
import { Engine } from "core/Engines/engine";
import { FramePropertyTabComponent } from "../../graphSystem/properties/framePropertyComponent";
import { FrameNodePortPropertyTabComponent } from "../../graphSystem/properties/frameNodePortPropertyComponent";
import { NodePortPropertyTabComponent } from "../../graphSystem/properties/nodePortPropertyComponent";
import type { Observer } from "core/Misc/observable";
import { LogEntry } from "../log/logComponent";
import "./propertyTab.scss";
import { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { NodePort } from "shared-ui-components/nodeGraphSystem/nodePort";
import type { FrameNodePort } from "shared-ui-components/nodeGraphSystem/frameNodePort";
import { IsFramePortData } from "shared-ui-components/nodeGraphSystem/tools";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { Constants } from "core/Engines/constants";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";

interface IPropertyTabComponentProps {
    globalState: GlobalState;
    lockObject: LockObject;
}

interface IPropertyTabComponentState {
    currentNode: Nullable<GraphNode>;
    currentFrame: Nullable<GraphFrame>;
    currentFrameNodePort: Nullable<FrameNodePort>;
    currentNodePort: Nullable<NodePort>;
    uploadInProgress: boolean;
}

export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, IPropertyTabComponentState> {
    private _onBuiltObserver: Nullable<Observer<void>>;

    constructor(props: IPropertyTabComponentProps) {
        super(props);

        this.state = { currentNode: null, currentFrame: null, currentFrameNodePort: null, currentNodePort: null, uploadInProgress: false };
    }

    override componentDidMount() {
        this.props.globalState.stateManager.onSelectionChangedObservable.add((options) => {
            const { selection } = options || {};
            if (selection instanceof GraphNode) {
                this.setState({ currentNode: selection, currentFrame: null, currentFrameNodePort: null, currentNodePort: null });
            } else if (selection instanceof GraphFrame) {
                this.setState({ currentNode: null, currentFrame: selection, currentFrameNodePort: null, currentNodePort: null });
            } else if (IsFramePortData(selection)) {
                this.setState({ currentNode: null, currentFrame: selection.frame, currentFrameNodePort: selection.port, currentNodePort: null });
            } else if (selection instanceof NodePort) {
                this.setState({ currentNode: null, currentFrame: null, currentFrameNodePort: null, currentNodePort: selection });
            } else {
                this.setState({ currentNode: null, currentFrame: null, currentFrameNodePort: null, currentNodePort: null });
            }
        });

        this._onBuiltObserver = this.props.globalState.onBuiltObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        this.props.globalState.onBuiltObservable.remove(this._onBuiltObserver);
    }

    load(file: File) {
        Tools.ReadFile(
            file,
            (data) => {
                const decoder = new TextDecoder("utf-8");
                const doLoadAsync = async () => {
                    await SerializationTools.DeserializeAsync(JSON.parse(decoder.decode(data)), this.props.globalState);
                    this.props.globalState.onResetRequiredObservable.notifyObservers(false);
                    this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                    this.props.globalState.onClearUndoStack.notifyObservers();
                };
                void doLoadAsync();
            },
            undefined,
            true
        );
    }

    save() {
        const json = SerializationTools.Serialize(this.props.globalState.flowGraph, this.props.globalState);
        StringTools.DownloadAsFile(this.props.globalState.hostDocument, json, "flowGraph.json");
    }

    customSave() {
        this.setState({ uploadInProgress: true });
        this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Saving your flow graph to Babylon.js snippet server...", false));
        this.props.globalState
            .customSave!.action(SerializationTools.Serialize(this.props.globalState.flowGraph, this.props.globalState))
            // eslint-disable-next-line github/no-then
            .then(() => {
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Flow graph saved successfully", false));
                this.setState({ uploadInProgress: false });
            })
            // eslint-disable-next-line github/no-then
            .catch((err: any) => {
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(err, true));
                this.setState({ uploadInProgress: false });
            });
    }

    async saveToSnippetServerAsync() {
        const json = SerializationTools.Serialize(this.props.globalState.flowGraph, this.props.globalState);
        const dataToSend = {
            payload: JSON.stringify({ flowGraph: json }),
            name: "",
            description: "",
            tags: "",
        };

        const snippetId = this.props.globalState.flowGraphSnippetId;
        const url = Constants.SnippetUrl + (snippetId ? "/" + snippetId : "");

        try {
            const response = await fetch(url, {
                method: "POST",
                // eslint-disable-next-line @typescript-eslint/naming-convention
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                const snippet = await response.json();
                let newId = snippet.id;
                if (snippet.version && snippet.version !== "0") {
                    newId += "#" + snippet.version;
                }
                this.props.globalState.flowGraphSnippetId = newId;
                this.forceUpdate();

                if (navigator.clipboard) {
                    try {
                        await navigator.clipboard.writeText(newId);
                    } catch {
                        /* clipboard may not be available in all contexts */
                    }
                }

                const windowAsAny = window as any;
                if (windowAsAny.Playground && snippetId) {
                    windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                        regex: new RegExp(snippetId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
                        replace: newId,
                    });
                }

                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Flow graph saved with ID: " + newId, false));
                this.props.globalState.hostDocument.defaultView!.alert("Flow graph saved with ID: " + newId + " (the ID was also copied to your clipboard)");
            } else {
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Unable to save flow graph to snippet server", true));
                this.props.globalState.hostDocument.defaultView!.alert(`Unable to save your flow graph (${(dataToSend.payload.length / 1024).toFixed(0)} KB). Please try again.`);
            }
        } catch {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Unable to save flow graph to snippet server", true));
        }
    }

    async loadFromSnippetAsync(snippetId?: string) {
        const id = snippetId || this.props.globalState.hostDocument.defaultView!.prompt("Please enter the snippet ID to load");
        if (!id) {
            return;
        }

        this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
        this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Loading flow graph from snippet " + id + "...", false));

        const url = Constants.SnippetUrl + "/" + id.replace(/#/g, "/");

        try {
            const response = await fetch(url);
            if (response.ok) {
                const snippet = await response.json();
                const jsonPayload = JSON.parse(snippet.jsonPayload);
                const serializationObject = JSON.parse(jsonPayload.flowGraph);

                try {
                    await SerializationTools.DeserializeAsync(serializationObject, this.props.globalState);
                    this.props.globalState.flowGraphSnippetId = id;
                    this.props.globalState.onResetRequiredObservable.notifyObservers(false);
                    this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                    this.props.globalState.onClearUndoStack.notifyObservers();
                    this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Flow graph loaded from snippet " + id, false));
                    this.forceUpdate();
                } catch (err) {
                    this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Error loading snippet: " + err, true));
                }
            } else {
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Unable to load snippet " + id, true));
                this.props.globalState.hostDocument.defaultView!.alert("Unable to load snippet " + id);
            }
        } catch {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Unable to load snippet " + id, true));
        }
    }

    override render() {
        if (this.state.currentNode) {
            return (
                <div id="propertyTab">
                    <div id="header">
                        <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                        <div id="title">FLOW GRAPH EDITOR</div>
                    </div>
                    {this.state.currentNode?.renderProperties() || this.state.currentNodePort?.node.renderProperties()}
                </div>
            );
        }

        if (this.state.currentFrameNodePort && this.state.currentFrame) {
            return (
                <FrameNodePortPropertyTabComponent
                    globalState={this.props.globalState}
                    stateManager={this.props.globalState.stateManager}
                    frame={this.state.currentFrame}
                    frameNodePort={this.state.currentFrameNodePort}
                />
            );
        }

        if (this.state.currentNodePort) {
            return <NodePortPropertyTabComponent stateManager={this.props.globalState.stateManager} nodePort={this.state.currentNodePort} />;
        }

        if (this.state.currentFrame) {
            return <FramePropertyTabComponent globalState={this.props.globalState} frame={this.state.currentFrame} />;
        }

        const gridSize = DataStorage.ReadNumber("GridSize", 20);

        return (
            <div id="propertyTab">
                <div id="header">
                    <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div id="title">FLOW GRAPH EDITOR</div>
                </div>
                <div>
                    <LineContainerComponent title="GENERAL">
                        <TextLineComponent label="Version" value={Engine.Version} />
                        <TextLineComponent
                            label="Help"
                            value="doc.babylonjs.com"
                            underline={true}
                            onLink={() => this.props.globalState.hostDocument.defaultView!.open("https://doc.babylonjs.com/features/featuresDeepDive/flowGraph", "_blank")}
                        />
                    </LineContainerComponent>
                    <LineContainerComponent title="UI">
                        <ButtonLineComponent
                            label="Zoom to fit"
                            onClick={() => {
                                this.props.globalState.onZoomToFitRequiredObservable.notifyObservers();
                            }}
                        />
                        <ButtonLineComponent
                            label="Reorganize"
                            onClick={() => {
                                this.props.globalState.onReOrganizedRequiredObservable.notifyObservers();
                            }}
                        />
                    </LineContainerComponent>
                    <LineContainerComponent title="OPTIONS">
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Grid size"
                            minimum={0}
                            maximum={100}
                            step={5}
                            decimalCount={0}
                            directValue={gridSize}
                            onChange={(value) => {
                                DataStorage.WriteNumber("GridSize", value);
                                this.props.globalState.stateManager.onGridSizeChanged.notifyObservers();
                                this.forceUpdate();
                            }}
                        />
                        <CheckBoxLineComponent
                            label="Show grid"
                            isSelected={() => DataStorage.ReadBoolean("ShowGrid", true)}
                            onSelect={(value: boolean) => {
                                DataStorage.WriteBoolean("ShowGrid", value);
                                this.props.globalState.stateManager.onGridSizeChanged.notifyObservers();
                            }}
                        />
                    </LineContainerComponent>
                    <LineContainerComponent title="FILE">
                        <FileButtonLineComponent label="Load" onClick={(file) => this.load(file)} accept=".json" />
                        <ButtonLineComponent
                            label="Save"
                            onClick={() => {
                                this.save();
                            }}
                        />
                        {this.props.globalState.customSave && (
                            <ButtonLineComponent
                                label={this.props.globalState.customSave.label}
                                isDisabled={this.state.uploadInProgress}
                                onClick={() => {
                                    this.customSave();
                                }}
                            />
                        )}
                    </LineContainerComponent>
                    <LineContainerComponent title="SNIPPET">
                        {this.props.globalState.flowGraphSnippetId && (
                            <TextInputLineComponent
                                label="Snippet ID"
                                lockObject={this.props.lockObject}
                                value={this.props.globalState.flowGraphSnippetId}
                                target={this.props.globalState}
                                propertyName="flowGraphSnippetId"
                            />
                        )}
                        <ButtonLineComponent label="Load from snippet server" onClick={async () => await this.loadFromSnippetAsync()} />
                        <ButtonLineComponent label="Save to snippet server" onClick={async () => await this.saveToSnippetServerAsync()} />
                    </LineContainerComponent>
                </div>
            </div>
        );
    }
}
