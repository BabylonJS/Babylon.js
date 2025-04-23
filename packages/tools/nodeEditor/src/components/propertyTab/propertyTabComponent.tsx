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
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import type { Observer } from "core/Misc/observable";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { NodeMaterialModes } from "core/Materials/Node/Enums/nodeMaterialModes";
import { PreviewType } from "../preview/previewType";
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
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { SetToDefaultGaussianSplatting, SetToDefaultSFE } from "core/Materials/Node/nodeMaterialDefault";
import { alphaModeOptions } from "shared-ui-components/constToOptionsMaps";

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
    private _modeSelect: React.RefObject<OptionsLine>;

    constructor(props: IPropertyTabComponentProps) {
        super(props);

        this.state = { currentNode: null, currentFrame: null, currentFrameNodePort: null, currentNodePort: null, uploadInProgress: false };

        this._modeSelect = React.createRef();
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

    processInputBlockUpdate(ib: InputBlock) {
        this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(ib);

        if (ib.isConstant) {
            this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
        }
    }

    renderInputBlock(block: InputBlock) {
        switch (block.type) {
            case NodeMaterialBlockConnectionPointTypes.Float: {
                const cantDisplaySlider = isNaN(block.min) || isNaN(block.max) || block.min === block.max;
                return (
                    <div key={block.uniqueId}>
                        {block.isBoolean && (
                            <CheckBoxLineComponent
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                onValueChanged={() => {
                                    this.processInputBlockUpdate(block);
                                }}
                            />
                        )}
                        {!block.isBoolean && cantDisplaySlider && (
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                onChange={() => this.processInputBlockUpdate(block)}
                            />
                        )}
                        {!block.isBoolean && !cantDisplaySlider && (
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                key={block.uniqueId}
                                label={block.name}
                                target={block}
                                propertyName="value"
                                step={(block.max - block.min) / 100.0}
                                minimum={block.min}
                                maximum={block.max}
                                onChange={() => this.processInputBlockUpdate(block)}
                            />
                        )}
                    </div>
                );
            }
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return (
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <Color4LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return (
                    <Vector2LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return (
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return (
                    <Vector4LineComponent
                        lockObject={this.props.lockObject}
                        key={block.uniqueId}
                        label={block.name}
                        target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
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

                if (!this.changeMode(this.props.globalState.nodeMaterial!.mode, true, false)) {
                    this.props.globalState.onResetRequiredObservable.notifyObservers(false);
                }
                this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
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
                SerializationTools.AddFrameToMaterial(frameData, this.props.globalState, this.props.globalState.nodeMaterial);
            },
            undefined,
            true
        );
    }

    save() {
        const json = SerializationTools.Serialize(this.props.globalState.nodeMaterial, this.props.globalState);
        StringTools.DownloadAsFile(this.props.globalState.hostDocument, json, "nodeMaterial.json");
    }

    customSave() {
        this.setState({ uploadInProgress: true });
        this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Saving your material to Babylon.js snippet server...", false));
        this.props.globalState
            .customSave!.action(SerializationTools.Serialize(this.props.globalState.nodeMaterial, this.props.globalState))
            .then(() => {
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Material saved successfully", false));
                this.setState({ uploadInProgress: false });
            })
            .catch((err) => {
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(err, true));
                this.setState({ uploadInProgress: false });
            });
    }

    saveToSnippetServer() {
        const material = this.props.globalState.nodeMaterial;
        const xmlHttp = new XMLHttpRequest();

        const json = SerializationTools.Serialize(material, this.props.globalState);

        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    const snippet = JSON.parse(xmlHttp.responseText);
                    const oldId = material.snippetId;
                    material.snippetId = snippet.id;
                    if (snippet.version && snippet.version != "0") {
                        material.snippetId += "#" + snippet.version;
                    }

                    this.forceUpdate();
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(material.snippetId);
                    }

                    const windowAsAny = window as any;

                    if (windowAsAny.Playground && oldId) {
                        windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                            regex: new RegExp(oldId, "g"),
                            replace: material.snippetId,
                        });
                    }

                    this.props.globalState.hostDocument.defaultView!.alert(
                        "NodeMaterial saved with ID: " + material.snippetId + " (please note that the id was also saved to your clipboard)"
                    );
                } else {
                    this.props.globalState.hostDocument.defaultView!.alert(
                        `Unable to save your node material. It may be too large (${(dataToSend.payload.length / 1024).toFixed(
                            2
                        )} KB) because of embedded textures. Please reduce texture sizes or point to a specific url instead of embedding them and try again.`
                    );
                }
            }
        };

        xmlHttp.open("POST", NodeMaterial.SnippetUrl + (material.snippetId ? "/" + material.snippetId : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        const dataToSend = {
            payload: JSON.stringify({
                nodeMaterial: json,
            }),
            name: "",
            description: "",
            tags: "",
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    }

    loadFromSnippet() {
        const material = this.props.globalState.nodeMaterial;
        const scene = material.getScene();

        const snippedId = this.props.globalState.hostDocument.defaultView!.prompt("Please enter the snippet ID to use");

        if (!snippedId) {
            return;
        }

        this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);

        NodeMaterial.ParseFromSnippetAsync(snippedId, scene, "", material)
            .then(() => {
                material.build();
                if (!this.changeMode(this.props.globalState.nodeMaterial!.mode, true, false)) {
                    this.props.globalState.onResetRequiredObservable.notifyObservers(true);
                }
                this.props.globalState.onClearUndoStack.notifyObservers();
            })
            .catch((err) => {
                this.props.globalState.hostDocument.defaultView!.alert("Unable to load your node material: " + err);
            });
    }

    changeMode(value: any, force = false, loadDefault = true): boolean {
        if (this.props.globalState.mode === value) {
            return false;
        }

        if (!force && !this.props.globalState.hostDocument.defaultView!.confirm("Are your sure? You will lose your current changes (if any) if they are not saved!")) {
            this._modeSelect.current?.setValue(this.props.globalState.mode);
            return false;
        }

        if (force) {
            this._modeSelect.current?.setValue(value);
        }

        if (loadDefault) {
            switch (value) {
                case NodeMaterialModes.Material:
                    this.props.globalState.nodeMaterial!.setToDefault();
                    break;
                case NodeMaterialModes.PostProcess:
                    this.props.globalState.nodeMaterial!.setToDefaultPostProcess();
                    break;
                case NodeMaterialModes.SFE:
                    SetToDefaultSFE(this.props.globalState.nodeMaterial!);
                    break;
                case NodeMaterialModes.Particle:
                    this.props.globalState.nodeMaterial!.setToDefaultParticle();
                    break;
                case NodeMaterialModes.ProceduralTexture:
                    this.props.globalState.nodeMaterial!.setToDefaultProceduralTexture();
                    break;
                case NodeMaterialModes.GaussianSplatting:
                    SetToDefaultGaussianSplatting(this.props.globalState.nodeMaterial!);
                    break;
            }
        }

        switch (value) {
            case NodeMaterialModes.Material:
                this.props.globalState.previewType = PreviewType.Sphere;
                break;
            case NodeMaterialModes.Particle:
                this.props.globalState.previewType = PreviewType.Bubbles;
                break;
            case NodeMaterialModes.GaussianSplatting:
                this.props.globalState.previewType = PreviewType.BricksSkull;
                break;
        }

        this.props.globalState.listOfCustomPreviewFiles = [];
        (this.props.globalState.previewFile as any) = undefined;

        DataStorage.WriteNumber("PreviewType", this.props.globalState.previewType);

        this.props.globalState.mode = value as NodeMaterialModes;

        this.props.globalState.onResetRequiredObservable.notifyObservers(true);
        this.props.globalState.onClearUndoStack.notifyObservers();
        // Env
        (this.props.globalState.envFile as any) = undefined;

        DataStorage.WriteNumber("EnvType", this.props.globalState.envType);

        return true;
    }

    override render() {
        if (this.state.currentNode) {
            return (
                <div id="propertyTab">
                    <div id="header">
                        <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                        <div id="title">NODE MATERIAL EDITOR</div>
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

        const modeList = [
            { label: "Material", value: NodeMaterialModes.Material },
            { label: "Post Process", value: NodeMaterialModes.PostProcess },
            { label: "Particle", value: NodeMaterialModes.Particle },
            { label: "Procedural", value: NodeMaterialModes.ProceduralTexture },
            { label: "Gaussian Splatting", value: NodeMaterialModes.GaussianSplatting },
            { label: "Smart Filters", value: NodeMaterialModes.SFE },
        ];

        const engineList = [
            { label: "WebGL", value: 0 },
            { label: "WebGPU", value: 1 },
        ];

        return (
            <div id="propertyTab">
                <div id="header">
                    <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div id="title">NODE MATERIAL EDITOR</div>
                </div>
                <div>
                    <LineContainerComponent title="GENERAL">
                        <OptionsLine
                            ref={this._modeSelect}
                            label="Mode"
                            target={this}
                            extractValue={() => this.props.globalState.mode}
                            options={modeList}
                            onSelect={(value) => this.changeMode(value)}
                            propertyName={""}
                        />
                        <OptionsLine
                            label="Engine"
                            target={this}
                            extractValue={() => this.props.globalState.engine}
                            options={engineList}
                            onSelect={(value) => {
                                this.props.globalState.engine = value as number;
                                this.forceUpdate();
                            }}
                            propertyName={""}
                        />
                        <TextLineComponent label="Version" value={Engine.Version} />
                        <TextLineComponent
                            label="Help"
                            value="doc.babylonjs.com"
                            underline={true}
                            onLink={() => this.props.globalState.hostDocument.defaultView!.open("https://doc.babylonjs.com/how_to/node_material", "_blank")}
                        />
                        <TextInputLineComponent
                            label="Comment"
                            multilines={true}
                            lockObject={this.props.globalState.lockObject}
                            value={this.props.globalState.nodeMaterial!.comment}
                            target={this.props.globalState.nodeMaterial}
                            propertyName="comment"
                        />
                        <ButtonLineComponent
                            label="Reset to default"
                            onClick={() => {
                                switch (this.props.globalState.mode) {
                                    case NodeMaterialModes.Material:
                                        this.props.globalState.nodeMaterial!.setToDefault();
                                        break;
                                    case NodeMaterialModes.PostProcess:
                                        this.props.globalState.nodeMaterial!.setToDefaultPostProcess();
                                        break;
                                    case NodeMaterialModes.SFE:
                                        SetToDefaultSFE(this.props.globalState.nodeMaterial!);
                                        break;
                                    case NodeMaterialModes.Particle:
                                        this.props.globalState.nodeMaterial!.setToDefaultParticle();
                                        break;
                                    case NodeMaterialModes.ProceduralTexture:
                                        this.props.globalState.nodeMaterial!.setToDefaultProceduralTexture();
                                        break;
                                    case NodeMaterialModes.GaussianSplatting:
                                        SetToDefaultGaussianSplatting(this.props.globalState.nodeMaterial!);
                                        break;
                                }
                                this.props.globalState.onResetRequiredObservable.notifyObservers(true);
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
                        <CheckBoxLineComponent
                            label="Embed textures when saving"
                            isSelected={() => DataStorage.ReadBoolean("EmbedTextures", true)}
                            onSelect={(value: boolean) => {
                                DataStorage.WriteBoolean("EmbedTextures", value);
                            }}
                        />
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
                        <FileButtonLine label="Load" onClick={(file) => this.load(file)} accept=".json" />
                        <ButtonLineComponent
                            label="Save"
                            onClick={() => {
                                this.save();
                            }}
                        />
                        {this.props.globalState.mode === NodeMaterialModes.SFE && (
                            <ButtonLineComponent
                                label="Export shaders for SFE"
                                onClick={async () => {
                                    this.props.globalState.nodeMaterial.build();
                                    const fragment = await this.props.globalState.nodeMaterial!._getProcessedFragmentAsync();
                                    StringTools.DownloadAsFile(this.props.globalState.hostDocument, fragment, "nme.block.glsl");
                                }}
                            />
                        )}
                        <ButtonLineComponent
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
                        {this.props.globalState.customSave && (
                            <ButtonLineComponent
                                label={this.props.globalState.customSave!.label}
                                isDisabled={this.state.uploadInProgress}
                                onClick={() => {
                                    this.customSave();
                                }}
                            />
                        )}
                        <FileButtonLine label="Load Frame" onClick={(file) => this.loadFrame(file)} accept=".json" />
                    </LineContainerComponent>
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
                        <OptionsLine
                            label="Alpha mode"
                            options={alphaModeOptions}
                            target={this.props.globalState.nodeMaterial}
                            propertyName="alphaMode"
                            onSelect={() => this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(null)}
                        />
                    </LineContainerComponent>
                    <InputsPropertyTabComponent
                        lockObject={this.props.lockObject}
                        globalState={this.props.globalState}
                        inputs={this.props.globalState.nodeMaterial.getInputBlocks()}
                    ></InputsPropertyTabComponent>
                </div>
            </div>
        );
    }
}
