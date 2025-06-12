import { GraphFrame } from "@babylonjs/shared-ui-components/nodeGraphSystem/graphFrame.js";
import { GraphNode } from "@babylonjs/shared-ui-components/nodeGraphSystem/graphNode.js";
import { NodePort } from "@babylonjs/shared-ui-components/nodeGraphSystem/nodePort.js";
import * as react from "react";
import { DataStorage } from "@babylonjs/core/Misc/dataStorage.js";

import { FileButtonLineComponent } from "../../sharedComponents/fileButtonLineComponent.js";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent.js";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent.js";

import { IsFramePortData } from "@babylonjs/shared-ui-components/nodeGraphSystem/tools.js";
// import { OptionsLineComponent } from "@babylonjs/shared-ui-components/lines/optionsLineComponent";
import { TextLineComponent } from "@babylonjs/shared-ui-components/lines/textLineComponent.js";
import { TextInputLineComponent } from "@babylonjs/shared-ui-components/lines/textInputLineComponent.js";
import { ButtonLineComponent } from "@babylonjs/shared-ui-components/lines/buttonLineComponent.js";
import { SliderLineComponent } from "@babylonjs/shared-ui-components/lines/sliderLineComponent.js";
import { InputsPropertyTabComponent } from "./inputsPropertyTabComponent.js";
import { BlockTools } from "../../blockTools.js";

import type { Nullable } from "@babylonjs/core/types";
import type { FrameNodePort } from "@babylonjs/shared-ui-components/nodeGraphSystem/frameNodePort";
import type { LockObject } from "@babylonjs/shared-ui-components/tabs/propertyGrids/lockObject";
import { ForceWebGL1StorageKey, type GlobalState } from "../../globalState.js";
import type { ISelectionChangedOptions } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/selectionChangedOptions";
import { SmartFilterCoreVersion, type AnyInputBlock } from "@babylonjs/smart-filters";
import type { Observer } from "@babylonjs/core/Misc/observable.js";
import { OnlyShowCustomBlocksDefaultValue } from "../../constants.js";

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
    optimize: Nullable<boolean>;
}

export class PropertyTabComponent extends react.Component<IPropertyTabComponentProps, IPropertyTabComponentState> {
    private _onResetRequiredObserver?: Observer<boolean>;
    private _onOptimizerEnabledChangedObserver?: Observer<boolean>;

    // private _modeSelect: React.RefObject<OptionsLineComponent>;

    constructor(props: IPropertyTabComponentProps) {
        super(props);

        const optimize = this.props.globalState.optimizerEnabled?.value || null;

        this.state = {
            currentNode: null,
            currentFrame: null,
            currentFrameNodePort: null,
            currentNodePort: null,
            uploadInProgress: false,
            optimize,
        };

        // this._modeSelect = React.createRef();
    }

    override componentDidMount() {
        this.props.globalState.stateManager.onSelectionChangedObservable.add(
            (options: Nullable<ISelectionChangedOptions>) => {
                const { selection } = options || {};
                if (selection instanceof GraphNode) {
                    this.setState({
                        currentNode: selection,
                        currentFrame: null,
                        currentFrameNodePort: null,
                        currentNodePort: null,
                    });
                } else if (selection instanceof GraphFrame) {
                    this.setState({
                        currentNode: null,
                        currentFrame: selection,
                        currentFrameNodePort: null,
                        currentNodePort: null,
                    });
                } else if (IsFramePortData(selection)) {
                    this.setState({
                        currentNode: null,
                        currentFrame: selection.frame,
                        currentFrameNodePort: selection.port,
                        currentNodePort: null,
                    });
                } else if (selection instanceof NodePort) {
                    this.setState({
                        currentNode: null,
                        currentFrame: null,
                        currentFrameNodePort: null,
                        currentNodePort: selection,
                    });
                } else {
                    this.setState({
                        currentNode: null,
                        currentFrame: null,
                        currentFrameNodePort: null,
                        currentNodePort: null,
                    });
                }
            }
        );

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable?.add(() => {
            this.forceUpdate();
        });

        if (this.props.globalState.optimizerEnabled) {
            this._onOptimizerEnabledChangedObserver = this.props.globalState.optimizerEnabled.onChangedObservable.add(
                (value: boolean) => {
                    this.setState({ optimize: value });
                }
            );
        }
    }

    override componentWillUnmount() {
        if (this._onResetRequiredObserver) {
            this._onResetRequiredObserver.remove();
        }
        if (this._onOptimizerEnabledChangedObserver) {
            this._onOptimizerEnabledChangedObserver.remove();
        }
    }

    processInputBlockUpdate(ib: AnyInputBlock) {
        this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(ib);

        // if (ib.isConstant) {
        //     this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers(true);
        // }
    }

    async load(_file: File) {
        if (this.props.globalState.engine && this.props.globalState.loadSmartFilter) {
            const newSmartFilter = await this.props.globalState.loadSmartFilter(_file, this.props.globalState.engine);
            if (newSmartFilter) {
                this.props.globalState.smartFilter = newSmartFilter;
                this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                this.props.globalState.onResetRequiredObservable.notifyObservers(false);
            }
        }
    }

    loadFrame(_file: File) {
        // Tools.ReadFile(
        //     file,
        //     (data) => {
        //         // get Frame Data from file
        //         const decoder = new TextDecoder("utf-8");
        //         const frameData = JSON.parse(decoder.decode(data));
        //         SerializationTools.AddFrameToMaterial(frameData, this.props.globalState, this.props.globalState.nodeMaterial);
        //     },
        //     undefined,
        //     true
        // );
    }

    downloadSmartFilter() {
        if (this.props.globalState.downloadSmartFilter) {
            this.props.globalState.onSaveEditorDataRequiredObservable.notifyObservers();
            this.props.globalState.downloadSmartFilter();
        }
    }

    copySmartFilter() {
        if (this.props.globalState.copySmartFilter) {
            this.props.globalState.onSaveEditorDataRequiredObservable.notifyObservers();
            this.props.globalState.copySmartFilter();
        }
    }

    async pasteSmartFilter() {
        if (this.props.globalState.pasteSmartFilter) {
            this.props.globalState.onSaveEditorDataRequiredObservable.notifyObservers();
            await this.props.globalState.pasteSmartFilter();
        }
    }

    async saveToSnippetServer() {
        this.setState({ uploadInProgress: true });
        try {
            this.props.globalState.onSaveEditorDataRequiredObservable.notifyObservers();
            await this.props.globalState.saveToSnippetServer!();
        } finally {
            this.setState({ uploadInProgress: false });
        }
    }

    loadFromSnippet() {
        // const material = this.props.globalState.nodeMaterial;
        // const scene = material.getScene();
        // const snippedId = this.props.globalState.hostDocument.defaultView!.prompt("Please enter the snippet ID to use");
        // if (!snippedId) {
        //     return;
        // }
        // this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
        // NodeMaterial.ParseFromSnippetAsync(snippedId, scene, "", material)
        //     .then(() => {
        //         material.build();
        //         if (!this.changeMode(this.props.globalState.nodeMaterial!.mode, true, false)) {
        //             this.props.globalState.onResetRequiredObservable.notifyObservers(true);
        //         }
        //     })
        //     .catch((err) => {
        //         this.props.globalState.hostDocument.defaultView!.alert("Unable to load your node material: " + err);
        //     });
    }

    override render() {
        if (this.state.currentNode) {
            return (
                <div id="propertyTab">
                    <div id="header">
                        <img
                            id="logo"
                            src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png"
                            alt="Babylon Logo"
                        />
                        <div id="title">SMART FILTER EDITOR</div>
                    </div>
                    {this.state.currentNode?.renderProperties() || this.state.currentNodePort?.node.renderProperties()}
                </div>
            );
        }

        // if (this.state.currentFrameNodePort && this.state.currentFrame) {
        //     return (
        //         <FrameNodePortPropertyTabComponent
        //             globalState={this.props.globalState}
        //             stateManager={this.props.globalState.stateManager}
        //             frame={this.state.currentFrame}
        //             frameNodePort={this.state.currentFrameNodePort}
        //         />
        //     );
        // }

        // if (this.state.currentNodePort) {
        //     return <NodePortPropertyTabComponent stateManager={this.props.globalState.stateManager} nodePort={this.state.currentNodePort} />;
        // }

        // if (this.state.currentFrame) {
        //     return <FramePropertyTabComponent globalState={this.props.globalState} frame={this.state.currentFrame} />;
        // }

        const gridSize = DataStorage.ReadNumber("GridSize", 20);

        return (
            <div id="propertyTab">
                <div id="header">
                    <img
                        id="logo"
                        src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png"
                        alt="Babylon Logo"
                    />
                    <div id="title">SMART FILTER EDITOR</div>
                </div>
                <div>
                    <LineContainerComponent title="GENERAL">
                        <TextLineComponent label="Version" value={SmartFilterCoreVersion} />
                        <TextLineComponent
                            label="Help"
                            value="doc.babylonjs.com"
                            underline={true}
                            onLink={() =>
                                this.props.globalState.hostDocument.defaultView!.open(
                                    "https://doc.babylonjs.com/features/featuresDeepDive/smartFilters/",
                                    "_blank"
                                )
                            }
                        />
                        <TextInputLineComponent
                            label="Name"
                            lockObject={this.props.globalState.lockObject}
                            target={this.props.globalState.smartFilter}
                            propertyName="name"
                        />
                        <TextInputLineComponent
                            label="Namespace"
                            lockObject={this.props.globalState.lockObject}
                            target={this.props.globalState.smartFilter}
                            propertyName="namespace"
                        />
                        <TextInputLineComponent
                            label="Comment"
                            multilines={true}
                            lockObject={this.props.globalState.lockObject}
                            target={this.props.globalState.smartFilter}
                            propertyName="comments"
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
                        {/* <CheckBoxLineComponent
                            label="Embed textures when saving"
                            isSelected={() => DataStorage.ReadBoolean("EmbedTextures", true)}
                            onSelect={(value: boolean) => {
                                DataStorage.WriteBoolean("EmbedTextures", value);
                            }}
                        /> */}
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
                            label="Only show custom blocks"
                            isSelected={() =>
                                DataStorage.ReadBoolean("OnlyShowCustomBlocks", OnlyShowCustomBlocksDefaultValue)
                            }
                            onSelect={(value: boolean) => {
                                DataStorage.WriteBoolean("OnlyShowCustomBlocks", value);
                                this.props.globalState.onlyShowCustomBlocksObservable.notifyObservers(value);
                            }}
                        />
                        {this.props.globalState.optimizerEnabled && (
                            <CheckBoxLineComponent
                                label="Optimize Smart Filter"
                                isSelected={() => !!this.state.optimize}
                                onSelect={(value: boolean) => {
                                    if (this.props.globalState.optimizerEnabled) {
                                        this.props.globalState.optimizerEnabled.value = value;
                                    }
                                }}
                            />
                        )}
                        {this.props.globalState.onNewEngine && ( // NOTE: only display this option if the Editor controls creating the Engine
                            <CheckBoxLineComponent
                                label="Force WebGL v1"
                                isSelected={() => this.props.globalState.forceWebGL1}
                                onSelect={(value: boolean) => {
                                    if (window.confirm("Any unsaved changes will be lost. Do you want to continue?")) {
                                        localStorage.setItem(ForceWebGL1StorageKey, value ? "true" : "");
                                        window.location.reload();
                                    } else {
                                        // Re-apply the original value (this.props.globalState.forceWebGL1)
                                        this.forceUpdate();
                                    }
                                }}
                            />
                        )}
                    </LineContainerComponent>
                    {(this.props.globalState.loadSmartFilter ||
                        this.props.globalState.downloadSmartFilter ||
                        this.props.globalState.copySmartFilter ||
                        this.props.globalState.pasteSmartFilter ||
                        this.props.globalState.saveToSnippetServer) && (
                        <LineContainerComponent title="FILE">
                            {this.props.globalState.loadSmartFilter && (
                                <FileButtonLineComponent
                                    label="Load"
                                    onClick={(file) => this.load(file)}
                                    accept=".json"
                                />
                            )}
                            {this.props.globalState.downloadSmartFilter && (
                                <ButtonLineComponent
                                    label="Save"
                                    onClick={() => {
                                        this.downloadSmartFilter();
                                    }}
                                />
                            )}
                            {this.props.globalState.copySmartFilter && (
                                <ButtonLineComponent
                                    label="Copy to Clipboard"
                                    onClick={() => {
                                        this.copySmartFilter();
                                    }}
                                />
                            )}
                            {this.props.globalState.pasteSmartFilter && (
                                <ButtonLineComponent
                                    label="Paste from Clipboard"
                                    onClick={() => {
                                        if (
                                            window.confirm("Any unsaved changes will be lost. Do you want to continue?")
                                        ) {
                                            this.pasteSmartFilter();
                                        }
                                    }}
                                />
                            )}
                            {this.props.globalState.saveToSnippetServer && (
                                <ButtonLineComponent
                                    label="Save to unique URL"
                                    isDisabled={this.state.uploadInProgress}
                                    onClick={() => {
                                        this.saveToSnippetServer();
                                    }}
                                />
                            )}
                            {/*<ButtonLineComponent
                        label="Generate code"
                        onClick={() => {
                            StringTools.DownloadAsFile(this.props.globalState.hostDocument, this.props.globalState.nodeMaterial!.generateCode(), "code.txt");
                        }}
                    />
                    <ButtonLineComponent
                        label="Export shaders"
                        onClick={() => {
                            this.props.globalState.nodeMaterial.build();
                            StringTools.DownloadAsFile(this.props.globalState.hostDocument, this.props.globalState.nodeMaterial!.compiledShaders, "shaders.txt");
                        }}
                    />
                    <FileButtonLineComponent label="Load Frame" uploadName={"frame-upload"} onClick={(file) => this.loadFrame(file)} accept=".json" />*/}
                        </LineContainerComponent>
                    )}
                    {/*
                    {!this.props.globalState.customSave && (
                        <LineContainerComponent title="SNIPPET">
                            {this.props.globalState.nodeMaterial!.snippetId && <TextLineComponent label="Snippet ID" value={this.props.globalState.nodeMaterial!.snippetId} />}
                            <ButtonLineComponent label="Load from snippet server" onClick={() => this.loadFromSnippet()} />
                            <ButtonLineComponent
                                label="Save to snippet server"
                                onClick={() => {
                                    this.saveToSnippetServer();
                                }}
                            />
                        </LineContainerComponent>
                    )}
                    <LineContainerComponent title="TRANSPARENCY">
                        <CheckBoxLineComponent
                            label="Force alpha blending"
                            target={this.props.globalState.nodeMaterial}
                            propertyName="forceAlphaBlending"
                            onValueChanged={() => this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(null)}
                        />
                        <OptionsLineComponent
                            label="Alpha mode"
                            options={alphaModeOptions}
                            target={this.props.globalState.nodeMaterial}
                            propertyName="alphaMode"
                            onSelect={() => this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(null)}
                        />
                    </LineContainerComponent> */}
                    <InputsPropertyTabComponent
                        lockObject={this.props.lockObject}
                        globalState={this.props.globalState}
                        inputs={BlockTools.GetInputBlocks(this.props.globalState.smartFilter)}
                    ></InputsPropertyTabComponent>
                </div>
            </div>
        );
    }
}
