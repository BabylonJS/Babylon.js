import * as React from "react";
import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { StringTools } from "shared-ui-components/stringTools";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { Tools } from "core/Misc/tools";
import { SerializationTools } from "../../serializationTools";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { DataStorage } from "core/Misc/dataStorage";
import { Engine } from "core/Engines/engine";
import { FramePropertyTabComponent } from "../../graphSystem/properties/framePropertyComponent";
import { FrameNodePortPropertyTabComponent } from "../../graphSystem/properties/frameNodePortPropertyComponent";
import { NodePortPropertyTabComponent } from "../../graphSystem/properties/nodePortPropertyComponent";
import type { Observer } from "core/Misc/observable";
import { InputsPropertyTabComponent } from "./inputsPropertyTabComponent";
import { LogEntry } from "../log/logComponent";
import "./propertyTab.scss";
import { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { NodePort } from "shared-ui-components/nodeGraphSystem/nodePort";
import type { FrameNodePort } from "shared-ui-components/nodeGraphSystem/frameNodePort";
import { IsFramePortData } from "shared-ui-components/nodeGraphSystem/tools";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { Vector4LineComponent } from "shared-ui-components/lines/vector4LineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import type { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometry } from "core/Meshes/Node/nodeGeometry";

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

    processInputBlockUpdate() {
        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    renderInputBlock(block: GeometryInputBlock) {
        switch (block.type) {
            case NodeGeometryBlockConnectionPointTypes.Int:
            case NodeGeometryBlockConnectionPointTypes.Float: {
                const cantDisplaySlider = isNaN(block.min) || isNaN(block.max) || block.min === block.max;
                const isInteger = block.type === NodeGeometryBlockConnectionPointTypes.Int;
                return (
                    <div key={block.uniqueId}>
                        {cantDisplaySlider && (
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                isInteger={isInteger}
                                propertyName="value"
                                onChange={() => this.processInputBlockUpdate()}
                            />
                        )}
                        {!cantDisplaySlider && (
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                step={isInteger ? 1 : Math.abs(block.max - block.min) / 100.0}
                                decimalCount={isInteger ? 0 : 2}
                                minimum={block.min}
                                maximum={block.max}
                                onChange={() => this.processInputBlockUpdate()}
                            />
                        )}
                    </div>
                );
            }
            case NodeGeometryBlockConnectionPointTypes.Vector2:
                return (
                    <Vector2LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate()}
                    />
                );
            case NodeGeometryBlockConnectionPointTypes.Vector3:
                return (
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate()}
                    />
                );
            case NodeGeometryBlockConnectionPointTypes.Vector4:
                return (
                    <Vector4LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate()}
                    />
                );
        }
        return null;
    }

    load(file: File) {
        Tools.ReadFile(
            file,
            (data) => {
                const decoder = new TextDecoder("utf-8");
                SerializationTools.Deserialize(JSON.parse(decoder.decode(data)), this.props.globalState);

                this.props.globalState.onResetRequiredObservable.notifyObservers(false);
                this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                this.props.globalState.onFrame.notifyObservers();
                this.props.globalState.onClearUndoStack.notifyObservers();
            },
            undefined,
            true
        );
    }

    loadFrame(file: File) {
        Tools.ReadFile(
            file,
            (data) => {
                // get Frame Data from file
                const decoder = new TextDecoder("utf-8");
                const frameData = JSON.parse(decoder.decode(data));
                SerializationTools.AddFrameToGeometry(frameData, this.props.globalState, this.props.globalState.nodeGeometry);
            },
            undefined,
            true
        );
    }

    save() {
        const json = SerializationTools.Serialize(this.props.globalState.nodeGeometry, this.props.globalState);
        StringTools.DownloadAsFile(this.props.globalState.hostDocument, json, "nodeGeometry.json");
    }

    customSave() {
        this.setState({ uploadInProgress: true });
        this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Saving your geometry to Babylon.js snippet server...", false));
        this.props.globalState
            .customSave!.action(SerializationTools.Serialize(this.props.globalState.nodeGeometry, this.props.globalState))
            .then(() => {
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Geometry saved successfully", false));
                this.setState({ uploadInProgress: false });
            })
            .catch((err) => {
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(err, true));
                this.setState({ uploadInProgress: false });
            });
    }

    saveToSnippetServer() {
        const geometry = this.props.globalState.nodeGeometry;
        const xmlHttp = new XMLHttpRequest();

        const json = SerializationTools.Serialize(geometry, this.props.globalState);

        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    const snippet = JSON.parse(xmlHttp.responseText);
                    const oldId = geometry.snippetId;
                    geometry.snippetId = snippet.id;
                    if (snippet.version && snippet.version != "0") {
                        geometry.snippetId += "#" + snippet.version;
                    }

                    this.forceUpdate();
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(geometry.snippetId);
                    }

                    const windowAsAny = window as any;

                    if (windowAsAny.Playground && oldId) {
                        windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                            regex: new RegExp(oldId, "g"),
                            replace: geometry.snippetId,
                        });
                    }

                    this.props.globalState.hostDocument.defaultView!.alert(
                        "NodeGeometry saved with ID: " + geometry.snippetId + " (please note that the id was also saved to your clipboard)"
                    );
                } else {
                    this.props.globalState.hostDocument.defaultView!.alert(
                        `Unable to save your node geometry. It may be too large (${(dataToSend.payload.length / 1024).toFixed(
                            2
                        )} KB) because of embedded textures. Please reduce texture sizes or point to a specific url instead of embedding them and try again.`
                    );
                }
            }
        };

        xmlHttp.open("POST", NodeGeometry.SnippetUrl + (geometry.snippetId ? "/" + geometry.snippetId : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        const dataToSend = {
            payload: JSON.stringify({
                nodeGeometry: json,
            }),
            name: "",
            description: "",
            tags: "",
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    }

    loadFromSnippet() {
        const geometry = this.props.globalState.nodeGeometry;

        const snippedId = this.props.globalState.hostDocument.defaultView!.prompt("Please enter the snippet ID to use");

        if (!snippedId) {
            return;
        }

        this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);

        NodeGeometry.ParseFromSnippetAsync(snippedId, geometry)
            .then(() => {
                geometry.build();
                this.props.globalState.onFrame.notifyObservers();
                this.props.globalState.onClearUndoStack.notifyObservers();
            })
            .catch((err) => {
                this.props.globalState.hostDocument.defaultView!.alert("Unable to load your node geometry: " + err);
            });
    }

    exportAsGLB() {
        this.props.globalState.onExportToGLBRequired.notifyObservers();
    }

    override render() {
        if (this.state.currentNode) {
            return (
                <div id="propertyTab">
                    <div id="header">
                        <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                        <div id="title">NODE GEOMETRY EDITOR</div>
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
        const useNM = DataStorage.ReadBoolean("UseNM", false);

        return (
            <div id="propertyTab">
                <div id="header">
                    <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div id="title">NODE GEOMETRY EDITOR</div>
                </div>
                <div>
                    <LineContainerComponent title="GENERAL">
                        <TextLineComponent label="Version" value={Engine.Version} />
                        <TextLineComponent
                            label="Help"
                            value="doc.babylonjs.com"
                            underline={true}
                            onLink={() => this.props.globalState.hostDocument.defaultView!.open("https://doc.babylonjs.com/features/featuresDeepDive/mesh/nodeGeometry", "_blank")}
                        />
                        <TextInputLineComponent
                            label="Comment"
                            multilines={true}
                            lockObject={this.props.globalState.lockObject}
                            value={this.props.globalState.nodeGeometry!.comment}
                            target={this.props.globalState.nodeGeometry}
                            propertyName="comment"
                        />
                        <ButtonLineComponent
                            label="Reset to default"
                            onClick={() => {
                                this.props.globalState.nodeGeometry!.setToDefault();
                                this.props.globalState.onResetRequiredObservable.notifyObservers(true);
                                this.props.globalState.onFrame.notifyObservers();
                                this.props.globalState.onClearUndoStack.notifyObservers();
                            }}
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
                        <CheckBoxLineComponent
                            label="Undo / Redo"
                            isSelected={() => DataStorage.ReadBoolean("UndoRedo", true)}
                            onSelect={(value: boolean) => {
                                DataStorage.WriteBoolean("UndoRedo", value);
                                this.props.globalState.stateManager.historyStack.isEnabled = value;
                            }}
                        />
                        <TextInputLineComponent
                            label="Node Material ID"
                            value={DataStorage.ReadString("NMEID", "")}
                            onChange={(value) => {
                                DataStorage.WriteString("NMEID", value);
                                this.forceUpdate();
                            }}
                        />
                        {!useNM && (
                            <ButtonLineComponent
                                label={"Use Node Material for preview"}
                                onClick={() => {
                                    DataStorage.WriteBoolean("UseNM", true);
                                    this.props.globalState.onPreviewModeChanged.notifyObservers();
                                    this.forceUpdate();
                                }}
                            />
                        )}
                        {useNM && (
                            <ButtonLineComponent
                                label={"Use Standard Material for preview"}
                                onClick={() => {
                                    DataStorage.WriteBoolean("UseNM", false);
                                    this.props.globalState.onPreviewModeChanged.notifyObservers();
                                    this.forceUpdate();
                                }}
                            />
                        )}
                    </LineContainerComponent>
                    <LineContainerComponent title="SYNC">
                        {this.props.globalState.resyncHandler && <ButtonLineComponent label="Update mesh in scene" onClick={() => this.props.globalState.resyncHandler!()} />}
                        <ButtonLineComponent label="Rebuild" onClick={() => this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers()} />
                    </LineContainerComponent>
                    <LineContainerComponent title="FILE">
                        <FileButtonLine label="Load" onClick={(file) => this.load(file)} accept=".json" />
                        <ButtonLineComponent
                            label="Save"
                            onClick={() => {
                                this.save();
                            }}
                        />
                        <ButtonLineComponent
                            label="Generate code"
                            onClick={() => {
                                StringTools.DownloadAsFile(this.props.globalState.hostDocument, this.props.globalState.nodeGeometry!.generateCode(), "code.txt");
                            }}
                        />
                        {this.props.globalState.customSave && (
                            <>
                                <ButtonLineComponent
                                    label={this.props.globalState.customSave!.label}
                                    isDisabled={this.state.uploadInProgress}
                                    onClick={() => {
                                        this.customSave();
                                    }}
                                />
                                <TextLineComponent label="(*) Mesh and texture data will NOT be serialized by default" ignoreValue={true} additionalClass="label-center" />
                            </>
                        )}
                        <FileButtonLine label="Load Frame" onClick={(file) => this.loadFrame(file)} accept=".json" />
                        <ButtonLineComponent
                            label="Export as GLB"
                            onClick={() => {
                                this.exportAsGLB();
                            }}
                        />
                    </LineContainerComponent>
                    {!this.props.globalState.customSave && (
                        <LineContainerComponent title="SNIPPET">
                            {this.props.globalState.nodeGeometry!.snippetId && <TextLineComponent label="Snippet ID" value={this.props.globalState.nodeGeometry!.snippetId} />}
                            <ButtonLineComponent label="Load from snippet server" onClick={() => this.loadFromSnippet()} />
                            <ButtonLineComponent
                                label="Save to snippet server"
                                onClick={() => {
                                    this.saveToSnippetServer();
                                }}
                            />
                        </LineContainerComponent>
                    )}
                    <InputsPropertyTabComponent
                        lockObject={this.props.lockObject}
                        globalState={this.props.globalState}
                        inputs={this.props.globalState.nodeGeometry.getInputBlocks()}
                    ></InputsPropertyTabComponent>
                </div>
            </div>
        );
    }
}
