import * as React from "react";
import { type GlobalState } from "../../globalState";
import { type Nullable } from "core/types";
import { StringTools } from "shared-ui-components/stringTools";
import { Tools } from "core/Misc/tools";
import { SerializationTools } from "../../serializationTools";
import { DataStorage } from "core/Misc/dataStorage";
import { Engine } from "core/Engines/engine";
import { FramePropertyTabComponent } from "../../graphSystem/properties/framePropertyComponent";
import { FrameNodePortPropertyTabComponent } from "../../graphSystem/properties/frameNodePortPropertyComponent";
import { NodePortPropertyTabComponent } from "../../graphSystem/properties/nodePortPropertyComponent";
import { type Observer } from "core/Misc/observable";
import { LogEntry } from "../log/logComponent";
import { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { NodePort } from "shared-ui-components/nodeGraphSystem/nodePort";
import { type FrameNodePort } from "shared-ui-components/nodeGraphSystem/frameNodePort";
import { IsFramePortData } from "shared-ui-components/nodeGraphSystem/tools";
import { type LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { Constants } from "core/Engines/constants";
import { ShowToast } from "../toast/toastComponent";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { makeStyles, tokens } from "@fluentui/react-components";

interface IPropertyTabComponentProps {
    globalState: GlobalState;
    lockObject: LockObject;
}

interface IPropertyTabInnerProps extends IPropertyTabComponentProps {
    classes: ReturnType<typeof useStyles>;
}

interface IPropertyTabComponentState {
    currentNode: Nullable<GraphNode>;
    currentFrame: Nullable<GraphFrame>;
    currentFrameNodePort: Nullable<FrameNodePort>;
    currentNodePort: Nullable<NodePort>;
    uploadInProgress: boolean;
}

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
        background: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
    },
    buttonStack: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
        alignItems: "stretch",
        padding: `${tokens.spacingVerticalXS} 0`,
    },
});

/**
 * Property tab - right-pane content.
 *
 * Displays either the property panel of the currently selected node/frame/port, or a
 * default view of editor-wide controls (UI, options, file, snippet) organised into a
 * Fluent `Accordion`.  Wraps the stateful inner class so we can use `makeStyles`.
 * @param props - The component props.
 * @returns The rendered property tab.
 */
export const PropertyTabComponent: React.FunctionComponent<IPropertyTabComponentProps> = (props) => {
    const classes = useStyles();
    return <PropertyTabInner {...props} classes={classes} />;
};

class PropertyTabInner extends React.Component<IPropertyTabInnerProps, IPropertyTabComponentState> {
    private _onBuiltObserver: Nullable<Observer<void>>;
    private _onHashChange = () => {
        void this._loadSnippetFromHashAsync();
    };

    constructor(props: IPropertyTabInnerProps) {
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

        this.props.globalState.hostDocument.defaultView?.addEventListener("hashchange", this._onHashChange);
        void this._loadSnippetFromHashAsync();
    }

    override componentWillUnmount() {
        this.props.globalState.onBuiltObservable.remove(this._onBuiltObserver);
        this.props.globalState.hostDocument.defaultView?.removeEventListener("hashchange", this._onHashChange);
    }

    private _getSnippetIdFromHash(): string {
        const hash = this.props.globalState.hostDocument.defaultView?.location.hash.substring(1) ?? "";
        try {
            return decodeURIComponent(hash);
        } catch {
            return hash;
        }
    }

    private _setSnippetIdInHash(snippetId: string): void {
        const hostWindow = this.props.globalState.hostDocument.defaultView;
        if (!hostWindow) {
            return;
        }
        const { pathname, search } = hostWindow.location;
        hostWindow.history.replaceState(null, "", `${pathname}${search}#${snippetId}`);
    }

    private async _loadSnippetFromHashAsync(): Promise<void> {
        const snippetId = this._getSnippetIdFromHash();
        if (!snippetId || snippetId === this.props.globalState.flowGraphSnippetId) {
            return;
        }
        await this.loadFromSnippetAsync(snippetId);
    }

    load(file: File) {
        Tools.ReadFile(
            file,
            (data) => {
                const decoder = new TextDecoder("utf-8");
                const doLoadAsync = async () => {
                    await SerializationTools.DeserializeAsync(JSON.parse(decoder.decode(data)), this.props.globalState);
                    this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                    this.props.globalState.onClearUndoStack.notifyObservers();
                    ShowToast(this.props.globalState, "Flow graph loaded from file", "success");
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
        ShowToast(this.props.globalState, "Flow graph saved to file", "success");
    }

    /**
     * Load a flow graph from a .glb/.gltf file that contains the BABYLON_flow_graph extension.
     * @param file - the glb/gltf file to load
     */
    loadGlb(file: File) {
        const doLoadAsync = async () => {
            try {
                const imported = await SerializationTools.ImportFromGlbAsync(file, this.props.globalState);
                if (imported) {
                    this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Flow graph loaded from glTF file", false));
                } else {
                    this.props.globalState.onLogRequiredObservable.notifyObservers(
                        new LogEntry("No BABYLON_flow_graph extension found in this file. Drop the file on the preview pane to load its scene and KHR_interactivity data.", true)
                    );
                }
            } catch (err) {
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Error loading glTF: " + err, true));
            }
        };
        void doLoadAsync();
    }

    /**
     * Export the flow graph (and optionally the preview scene) as a .glb file.
     */
    async exportGlbAsync() {
        try {
            const scene = this.props.globalState.sceneContext?.scene ?? null;
            await SerializationTools.ExportGlbAsync(this.props.globalState.flowGraph, this.props.globalState, scene);
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Flow graph exported as flowGraph.glb", false));
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Error exporting glTF: " + err, true));
        }
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
                this._setSnippetIdInHash(newId);
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

                ShowToast(this.props.globalState, "Graph saved - ID: " + newId + " (copied to clipboard)", "success");
            } else {
                ShowToast(this.props.globalState, `Unable to save flow graph (${(dataToSend.payload.length / 1024).toFixed(0)} KB). Please try again.`, "error");
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
                    this._setSnippetIdInHash(id);
                    this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                    this.props.globalState.onClearUndoStack.notifyObservers();
                    this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Flow graph loaded from snippet " + id, false));
                    ShowToast(this.props.globalState, "Flow graph loaded from snippet " + id, "success");
                    this.forceUpdate();
                } catch (err) {
                    this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Error loading snippet: " + err, true));
                    ShowToast(this.props.globalState, "Error loading snippet: " + err, "error");
                }
            } else {
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Unable to load snippet " + id, true));
                ShowToast(this.props.globalState, "Unable to load snippet " + id, "error");
            }
        } catch {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Unable to load snippet " + id, true));
        }
    }

    override render() {
        const { classes } = this.props;
        if (this.state.currentNode) {
            return <div className={classes.root}>{this.state.currentNode?.renderProperties() || this.state.currentNodePort?.node.renderProperties()}</div>;
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
        const showGrid = DataStorage.ReadBoolean("ShowGrid", true);
        const docUrl = "https://doc.babylonjs.com/features/featuresDeepDive/flowGraph";

        return (
            <div className={classes.root}>
                <Accordion uniqueId="FlowGraphPropertyTab" enablePinnedItems enableSearchItems>
                    <AccordionSection title="General" collapseByDefault={false}>
                        <TextPropertyLine label="Version" value={Engine.Version} />
                        <LinkPropertyLine label="Help" value="doc.babylonjs.com" url={docUrl} />
                    </AccordionSection>

                    <AccordionSection title="UI" collapseByDefault={false}>
                        <div className={classes.buttonStack}>
                            <Button label="Zoom to fit" title="Zoom to fit" onClick={() => this.props.globalState.onZoomToFitRequiredObservable.notifyObservers()} />
                            <Button label="Reorganize" title="Reorganize" onClick={() => this.props.globalState.onReOrganizedRequiredObservable.notifyObservers()} />
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Options" collapseByDefault={false}>
                        <SyncedSliderPropertyLine
                            label="Grid size"
                            min={0}
                            max={100}
                            step={5}
                            value={gridSize}
                            onChange={(value) => {
                                DataStorage.WriteNumber("GridSize", value);
                                this.props.globalState.stateManager.onGridSizeChanged.notifyObservers();
                                this.forceUpdate();
                            }}
                        />
                        <SwitchPropertyLine
                            label="Show grid"
                            value={showGrid}
                            onChange={(value) => {
                                DataStorage.WriteBoolean("ShowGrid", value);
                                this.props.globalState.stateManager.onGridSizeChanged.notifyObservers();
                                this.forceUpdate();
                            }}
                        />
                    </AccordionSection>

                    <AccordionSection title="File" collapseByDefault={false}>
                        <div className={classes.buttonStack}>
                            <FileUploadLine label="Load" accept=".json" onClick={(files) => this.load(files[0])} />
                            <FileUploadLine label="Load glTF" accept=".glb,.gltf" onClick={(files) => this.loadGlb(files[0])} />
                            <Button label="Save" title="Save" onClick={() => this.save()} />
                            {this.props.globalState.customSave && (
                                <Button
                                    label={this.props.globalState.customSave.label}
                                    title={this.props.globalState.customSave.label}
                                    disabled={this.state.uploadInProgress}
                                    onClick={() => this.customSave()}
                                />
                            )}
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Snippet" collapseByDefault={false}>
                        {this.props.globalState.flowGraphSnippetId && (
                            <TextInputPropertyLine
                                label="Snippet ID"
                                value={this.props.globalState.flowGraphSnippetId}
                                onChange={(value) => {
                                    this.props.globalState.flowGraphSnippetId = value;
                                    this.forceUpdate();
                                }}
                            />
                        )}
                        <div className={classes.buttonStack}>
                            <Button label="Load from snippet server" title="Load from snippet server" onClick={async () => await this.loadFromSnippetAsync()} />
                            <Button label="Save to snippet server" title="Save to snippet server" onClick={async () => await this.saveToSnippetServerAsync()} />
                        </div>
                    </AccordionSection>
                </Accordion>
            </div>
        );
    }
}
