import * as React from "react";
import { GlobalState } from "../../globalState";
import { Nullable } from "core/types";
import { Tools } from "core/Misc/tools";
import { Observer } from "core/Misc/observable";
import { StringTools } from "shared-ui-components/stringTools";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { SliderGenericPropertyGridComponent } from "./propertyGrids/gui/sliderGenericPropertyGridComponent";
import { Slider } from "gui/2D/controls/sliders/slider";
import { LinePropertyGridComponent } from "./propertyGrids/gui/linePropertyGridComponent";
import { RadioButtonPropertyGridComponent } from "./propertyGrids/gui/radioButtonPropertyGridComponent";
import { TextBlock } from "gui/2D/controls/textBlock";
import { InputText } from "gui/2D/controls/inputText";
import { ColorPicker } from "gui/2D/controls/colorpicker";
import { Image } from "gui/2D/controls/image";
import { ImageBasedSlider } from "gui/2D/controls/sliders/imageBasedSlider";
import { Rectangle } from "gui/2D/controls/rectangle";
import { Ellipse } from "gui/2D/controls/ellipse";
import { Checkbox } from "gui/2D/controls/checkbox";
import { RadioButton } from "gui/2D/controls/radioButton";
import { Line } from "gui/2D/controls/line";
import { ScrollViewer } from "gui/2D/controls/scrollViewers/scrollViewer";
import { Grid } from "gui/2D/controls/grid";
import { StackPanel } from "gui/2D/controls/stackPanel";
import { TextBlockPropertyGridComponent } from "./propertyGrids/gui/textBlockPropertyGridComponent";
import { InputTextPropertyGridComponent } from "./propertyGrids/gui/inputTextPropertyGridComponent";
import { ColorPickerPropertyGridComponent } from "./propertyGrids/gui/colorPickerPropertyGridComponent";
import { ImagePropertyGridComponent } from "./propertyGrids/gui/imagePropertyGridComponent";
import { ImageBasedSliderPropertyGridComponent } from "./propertyGrids/gui/imageBasedSliderPropertyGridComponent";
import { RectanglePropertyGridComponent } from "./propertyGrids/gui/rectanglePropertyGridComponent";
import { StackPanelPropertyGridComponent } from "./propertyGrids/gui/stackPanelPropertyGridComponent";
import { GridPropertyGridComponent } from "./propertyGrids/gui/gridPropertyGridComponent";
import { ScrollViewerPropertyGridComponent } from "./propertyGrids/gui/scrollViewerPropertyGridComponent";
import { EllipsePropertyGridComponent } from "./propertyGrids/gui/ellipsePropertyGridComponent";
import { CheckboxPropertyGridComponent } from "./propertyGrids/gui/checkboxPropertyGridComponent";
import { Control } from "gui/2D/controls/control";
import { ControlPropertyGridComponent } from "./propertyGrids/gui/controlPropertyGridComponent";
import { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";

import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { ParentingPropertyGridComponent } from "../parentingPropertyGridComponent";
import { DisplayGridPropertyGridComponent } from "./propertyGrids/gui/displayGridPropertyGridComponent";
import { DisplayGrid } from "gui/2D/controls/displayGrid";
import { Button } from "gui/2D/controls/button";
import { ButtonPropertyGridComponent } from "./propertyGrids/gui/buttonPropertyGridComponent";
import { GUINodeTools } from "../../guiNodeTools";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import "./propertyTab.scss";
import adtIcon from "../../imgs/adtIcon.svg";
import { ControlTypes } from "../../controlTypes";

interface IPropertyTabComponentProps {
    globalState: GlobalState;
}

export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps> {
    private _onBuiltObserver: Nullable<Observer<void>>;
    private _timerIntervalId: number;
    private _lockObject: LockObject;

    constructor(props: IPropertyTabComponentProps) {
        super(props);

        this._lockObject = new LockObject();
        this.props.globalState.lockObject = this._lockObject;
        this.props.globalState.onSaveObservable.add(() => {
            this.save(this.saveLocally);
        });
        this.props.globalState.onSnippetSaveObservable.add(() => {
            this.save(this.saveToSnippetServer);
        });
        this.props.globalState.onSnippetLoadObservable.add(() => {
            this.loadFromSnippet();
        });

        this.props.globalState.onPropertyGridUpdateRequiredObservable.add(() => {
            this.forceUpdate();
        });

        this.props.globalState.onLoadObservable.add((file) => this.load(file));
    }

    componentDidMount() {
        this.props.globalState.onSelectionChangedObservable.add(() => {
            this.forceUpdate();
        });
        this.props.globalState.onResizeObservable.add((newSize) => {
            this.forceUpdate();
        });

        this._onBuiltObserver = this.props.globalState.onBuiltObservable.add(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        window.clearInterval(this._timerIntervalId);
        this.props.globalState.onBuiltObservable.remove(this._onBuiltObserver);
    }

    load(file: File) {
        Tools.ReadFile(
            file,
            (data) => {
                const decoder = new TextDecoder("utf-8");
                this.props.globalState.workbench.loadFromJson(JSON.parse(decoder.decode(data)));

                this.props.globalState.setSelection([]);
            },
            undefined,
            true
        );
    }

    save(saveCallback: () => void) {
        this.props.globalState.workbench.removeEditorTransformation();
        const size = this.props.globalState.workbench.guiSize;
        this.props.globalState.guiTexture.scaleTo(size.width, size.height);
        saveCallback();
    }

    saveLocally = () => {
        try {
            const json = JSON.stringify(this.props.globalState.guiTexture.serializeContent());
            StringTools.DownloadAsFile(this.props.globalState.hostDocument, json, "guiTexture.json");
        } catch (error) {
            this.props.globalState.hostWindow.alert("Unable to save your GUI");
            Tools.Error("Unable to save your GUI");
        }
    };

    saveToSnippetServerHelper = (content: string, adt: AdvancedDynamicTexture): Promise<string> => {
        return new Promise((resolve, reject) => {
            const xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = () => {
                if (xmlHttp.readyState == 4) {
                    if (xmlHttp.status == 200) {
                        const snippet = JSON.parse(xmlHttp.responseText);
                        const oldId = adt.snippetId;
                        adt.snippetId = snippet.id;
                        if (snippet.version && snippet.version != "0") {
                            adt.snippetId += "#" + snippet.version;
                        }
                        const windowAsAny = window as any;
                        if (windowAsAny.Playground && oldId) {
                            windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                                regex: new RegExp(`parseFromSnippetAsync("${oldId})`, "g"),
                                replace: `parseFromSnippetAsync("${adt.snippetId})`,
                            });
                        }
                        resolve(adt.snippetId);
                    } else {
                        reject("Unable to save your GUI");
                    }
                }
            };

            xmlHttp.open("POST", AdvancedDynamicTexture.SnippetUrl + (adt.snippetId ? "/" + adt.snippetId : ""), true);
            xmlHttp.setRequestHeader("Content-Type", "application/json");
            const dataToSend = {
                payload: JSON.stringify({
                    gui: content,
                }),
                name: "",
                description: "",
                tags: "",
            };
            xmlHttp.send(JSON.stringify(dataToSend));
        });
    };

    saveToSnippetServer = async () => {
        const adt = this.props.globalState.guiTexture;
        const content = JSON.stringify(adt.serializeContent());

        const savePromise = this.props.globalState.customSave?.action || this.saveToSnippetServerHelper;
        savePromise(content, adt)
            .then((snippetId: string) => {
                adt.snippetId = snippetId;
                const alertMessage = `GUI saved with ID:  ${adt.snippetId}`;
                if (this.props.globalState.hostWindow.navigator.clipboard) {
                    this.props.globalState.hostWindow.navigator.clipboard
                        .writeText(adt.snippetId)
                        .then(() => {
                            this.props.globalState.hostWindow.alert(`${alertMessage}. The ID was copied to your clipboard.`);
                        })
                        .catch((err: any) => {
                            this.props.globalState.hostWindow.alert(alertMessage);
                        });
                } else {
                    this.props.globalState.hostWindow.alert(alertMessage);
                }
                this.props.globalState.onBuiltObservable.notifyObservers();
            })
            .catch((err: any) => {
                this.props.globalState.hostWindow.alert(err);
            });
        this.forceUpdate();
    };

    loadFromSnippet() {
        const snippedId = this.props.globalState.hostWindow.prompt("Please enter the snippet ID to use");
        if (!snippedId) {
            return;
        }
        this.props.globalState.workbench.loadFromSnippet(snippedId);
    }

    renderNode(nodes: Control[]) {
        const node = nodes[0];
        return (
            <>
                <div id="header">
                    <img id="logo" src={this.renderControlIcon(nodes)} />
                    <div id="title">
                        <TextInputLineComponent
                            noUnderline={true}
                            lockObject={this._lockObject}
                            target={makeTargetsProxy(nodes, this.props.globalState.onPropertyChangedObservable)}
                            propertyName="name"
                            onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                        />
                    </div>
                </div>
                {this.renderProperties(nodes)}
                {node?.parent?.typeName === "Grid" && (
                    <ParentingPropertyGridComponent
                        control={node}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                        lockObject={this._lockObject}
                    ></ParentingPropertyGridComponent>
                )}
            </>
        );
    }

    /**
     * returns the class name of a list of controls if they share a class, or an empty string if not
     * @param nodes
     */
    getControlsCommonClassName(nodes: Control[]) {
        if (nodes.length === 0) return "";
        const firstNode = nodes[0];
        const firstClass = firstNode.getClassName();
        for (const node of nodes) {
            if (node.getClassName() !== firstClass) {
                return "";
            }
        }
        return firstClass;
    }

    renderProperties(nodes: Control[]) {
        if (nodes.length === 0) return;
        const className = this.getControlsCommonClassName(nodes);
        switch (className) {
            case "TextBlock": {
                const textBlocks = nodes as TextBlock[];
                return (
                    <TextBlockPropertyGridComponent
                        textBlocks={textBlocks}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "InputText": {
                const inputTexts = nodes as InputText[];
                return (
                    <InputTextPropertyGridComponent
                        inputTexts={inputTexts}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "ColorPicker": {
                const colorPickers = nodes as ColorPicker[];
                return (
                    <ColorPickerPropertyGridComponent
                        colorPickers={colorPickers}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Image": {
                const images = nodes as Image[];
                return (
                    <ImagePropertyGridComponent images={images} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />
                );
            }
            case "Slider": {
                const sliders = nodes as Slider[];
                return (
                    <SliderGenericPropertyGridComponent
                        sliders={sliders}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "ImageBasedSlider": {
                const imageBasedSliders = nodes as ImageBasedSlider[];
                return (
                    <ImageBasedSliderPropertyGridComponent
                        imageBasedSliders={imageBasedSliders}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Rectangle": {
                return (
                    <RectanglePropertyGridComponent
                        rectangles={nodes as Rectangle[]}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "StackPanel": {
                const stackPanels = nodes as StackPanel[];
                return (
                    <StackPanelPropertyGridComponent
                        stackPanels={stackPanels}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Grid": {
                const grids = nodes as Grid[];
                return <GridPropertyGridComponent grids={grids} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "ScrollViewer": {
                const scrollViewers = nodes as ScrollViewer[];
                return (
                    <ScrollViewerPropertyGridComponent
                        scrollViewers={scrollViewers}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Ellipse": {
                const ellipses = nodes as Ellipse[];
                return (
                    <EllipsePropertyGridComponent
                        ellipses={ellipses}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Checkbox": {
                const checkboxes = nodes as Checkbox[];
                return (
                    <CheckboxPropertyGridComponent
                        checkboxes={checkboxes}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "RadioButton": {
                const radioButtons = nodes as RadioButton[];
                return (
                    <RadioButtonPropertyGridComponent
                        radioButtons={radioButtons}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Line": {
                const lines = nodes as Line[];
                return <LinePropertyGridComponent lines={lines} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "DisplayGrid": {
                const displayGrids = nodes as DisplayGrid[];
                return (
                    <DisplayGridPropertyGridComponent
                        displayGrids={displayGrids}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Button": {
                const buttons = nodes as Button[];
                return (
                    <ButtonPropertyGridComponent
                        key="buttonMenu"
                        rectangles={buttons}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                        onAddComponent={(value) => {
                            for (const button of buttons) {
                                const guiElement = GUINodeTools.CreateControlFromString(value);
                                const newGuiNode = this.props.globalState.workbench.createNewGuiNode(guiElement);
                                button.addControl(newGuiNode);
                                this.props.globalState.select(newGuiNode);
                            }
                        }}
                    />
                );
            }
        }

        const controls = nodes as Control[];
        return <ControlPropertyGridComponent controls={controls} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
    }

    renderControlIcon(nodes: Control[]) {
        const node = nodes[0];
        const className = node.getClassName();
        for (const node of nodes) {
            if (node.getClassName() !== className) {
                return adtIcon;
            }
        }
        const type = ControlTypes.find((control) => control.className === className);
        return type ? type.icon : adtIcon;
    }

    render() {
        if (this.props.globalState.guiTexture == undefined) return null;
        const nodesToRender = this.props.globalState.selectedControls.length > 0 ? this.props.globalState.selectedControls : [this.props.globalState.workbench.trueRootContainer];
        return <div id="ge-propertyTab">{this.renderNode(nodesToRender)}</div>;
    }
}
