import * as React from "react";
import { GlobalState } from "../../globalState";
import { Nullable } from "babylonjs/types";
import { ButtonLineComponent } from "../../sharedUiComponents/lines/buttonLineComponent";
import { FileButtonLineComponent } from "../../sharedUiComponents/lines/fileButtonLineComponent";
import { Tools } from "babylonjs/Misc/tools";
import { CheckBoxLineComponent } from "../../sharedUiComponents/lines/checkBoxLineComponent";
import { DataStorage } from "babylonjs/Misc/dataStorage";
import { Observer } from "babylonjs/Misc/observable";
import { TextLineComponent } from "../../sharedUiComponents/lines/textLineComponent";
import { StringTools } from "../../sharedUiComponents/stringTools";
import { LockObject } from "../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { SliderPropertyGridComponent } from "./propertyGrids/gui/sliderPropertyGridComponent";
import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
import { LinePropertyGridComponent } from "./propertyGrids/gui/linePropertyGridComponent";
import { RadioButtonPropertyGridComponent } from "./propertyGrids/gui/radioButtonPropertyGridComponent";
import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
import { InputText } from "babylonjs-gui/2D/controls/inputText";
import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
import { Image } from "babylonjs-gui/2D/controls/image";
import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
import { RadioButton } from "babylonjs-gui/2D/controls/radioButton";
import { Line } from "babylonjs-gui/2D/controls/line";
import { ScrollViewer } from "babylonjs-gui/2D/controls/scrollViewers/scrollViewer";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
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
import { Control } from "babylonjs-gui/2D/controls/control";
import { ControlPropertyGridComponent } from "./propertyGrids/gui/controlPropertyGridComponent";
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { Vector2LineComponent } from "../../sharedUiComponents/lines/vector2LineComponent";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { Button } from "babylonjs-gui/2D/controls/button";
import { ParentingPropertyGridComponent } from "../parentingPropertyGridComponent";
import { OptionsLineComponent } from "../../sharedUiComponents/lines/optionsLineComponent";
import { TextInputLineComponent } from "../../sharedUiComponents/lines/textInputLineComponent";

require("./propertyTab.scss");
const adtIcon: string = require("../../../public/imgs/adtIcon.svg");
const responsiveIcon: string = require("../../../public/imgs/responsiveIcon.svg");
const canvasSizeIcon: string = require("../../../public/imgs/canvasSizeIcon.svg");
const artboardColorIcon: string = require("../../../public/imgs/artboardColorIcon.svg");

interface IPropertyTabComponentProps {
    globalState: GlobalState;
}

interface IPropertyTabComponentState {
    currentNode: Nullable<Control>;
    textureSize: Vector2;
}

export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, IPropertyTabComponentState> {
    private _onBuiltObserver: Nullable<Observer<void>>;
    private _timerIntervalId: number;
    private _lockObject = new LockObject();
    private _sizeOption: number = 2;
    constructor(props: IPropertyTabComponentProps) {
        super(props);

        this.state = { currentNode: null, textureSize: new Vector2(1200, 1200) };

        this.props.globalState.onSaveObservable.add(() => {
            this.save();
        });
        this.props.globalState.onSnippetSaveObservable.add(() => {
            this.saveToSnippetServer();
        });
        this.props.globalState.onSnippetLoadObservable.add(() => {
            this.loadFromSnippet();
        });

    }

    timerRefresh() {
        if (!this._lockObject.lock) {
            this.forceUpdate();
        }
    }
    componentDidMount() {
        this._timerIntervalId = window.setInterval(() => this.timerRefresh(), 500);
        this.props.globalState.onSelectionChangedObservable.add((selection) => {
            if (selection instanceof Control) {
                this.setState({ currentNode: selection });
            } else {
                this.setState({ currentNode: null });
            }
        });
        this.props.globalState.onResizeObservable.add((newSize) => {
            this.setState({ textureSize: newSize });
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

                this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
            },
            undefined,
            true
        );
    }

    save() {
        try {
            const json = JSON.stringify(this.props.globalState.guiTexture.serializeContent());
            StringTools.DownloadAsFile(this.props.globalState.hostDocument, json, "guiTexture.json");
        } catch (error) {
            alert("Unable to save your GUI");
        }
    }

    saveToSnippetServer() {
        const adt = this.props.globalState.guiTexture;
        const content = JSON.stringify(adt.serializeContent());

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
                    this.forceUpdate();
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(adt.snippetId);
                    }

                    const windowAsAny = window as any;

                    if (windowAsAny.Playground && oldId) {
                        windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                            regex: new RegExp(oldId, "g"),
                            replace: `parseFromSnippetAsync("${adt.snippetId}`,
                        });
                    }

                    alert("GUI saved with ID: " + adt.snippetId + " (please note that the id was also saved to your clipboard)");
                } else {
                    alert("Unable to save your GUI");
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
    }

    loadFromSnippet() {
        const snippedId = window.prompt("Please enter the snippet ID to use");

        if (!snippedId) {
            return;
        }
        this.props.globalState.workbench.loadFromSnippet(snippedId);
    }

    renderProperties() {
        const className = this.state.currentNode?.getClassName();
        switch (className) {
            case "TextBlock": {
                const textBlock = this.state.currentNode as TextBlock;
                return <TextBlockPropertyGridComponent textBlock={textBlock} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "InputText": {
                const inputText = this.state.currentNode as InputText;
                return <InputTextPropertyGridComponent inputText={inputText} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "ColorPicker": {
                const colorPicker = this.state.currentNode as ColorPicker;
                return <ColorPickerPropertyGridComponent colorPicker={colorPicker} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "Image": {
                const image = this.state.currentNode as Image;
                return <ImagePropertyGridComponent image={image} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "Slider": {
                const slider = this.state.currentNode as Slider;
                return <SliderPropertyGridComponent slider={slider} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "ImageBasedSlider": {
                const imageBasedSlider = this.state.currentNode as ImageBasedSlider;
                return <ImageBasedSliderPropertyGridComponent imageBasedSlider={imageBasedSlider} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "Rectangle": {
                const rectangle = this.state.currentNode as Rectangle;
                return <RectanglePropertyGridComponent rectangle={rectangle} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "StackPanel": {
                const stackPanel = this.state.currentNode as StackPanel;
                return <StackPanelPropertyGridComponent stackPanel={stackPanel} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "Grid": {
                const grid = this.state.currentNode as Grid;
                return <GridPropertyGridComponent grid={grid} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "ScrollViewer": {
                const scrollViewer = this.state.currentNode as ScrollViewer;
                return <ScrollViewerPropertyGridComponent scrollViewer={scrollViewer} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "Ellipse": {
                const ellipse = this.state.currentNode as Ellipse;
                return <EllipsePropertyGridComponent ellipse={ellipse} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "Checkbox": {
                const checkbox = this.state.currentNode as Checkbox;
                return <CheckboxPropertyGridComponent checkbox={checkbox} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "RadioButton": {
                const radioButton = this.state.currentNode as RadioButton;
                return <RadioButtonPropertyGridComponent radioButton={radioButton} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "Line": {
                const line = this.state.currentNode as Line;
                return <LinePropertyGridComponent line={line} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "Button": {
                const control = this.state.currentNode as Control;
                const button = this.state.currentNode as Button;
                var buttonMenu = [];
                buttonMenu.push(<ControlPropertyGridComponent key="buttonMenu" control={control} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />);
                if (button.textBlock) {
                    buttonMenu.push(<TextBlockPropertyGridComponent key="textBlockMenu" textBlock={button.textBlock} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />);
                }
                if (button.image) {
                    buttonMenu.push(<ImagePropertyGridComponent key="imageMenu" image={button.image} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />);
                }

                return buttonMenu;
            }
        }

        if (className !== "") {
            const control = this.state.currentNode as Control;
            return <ControlPropertyGridComponent control={control} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
        }
        return null;
    }

    render() {
        if (this.state.currentNode) {
            return (
                <div id="ge-propertyTab">
                    <div id="header">
                        <img id="logo" src={adtIcon} />
                        <div id="title">{this.state.currentNode.name}</div>
                    </div>
                    {this.renderProperties()}
                    <ParentingPropertyGridComponent guiNode={this.state.currentNode} guiNodes={this.props.globalState.guiTexture.getChildren()[0].children} globalState={this.props.globalState}></ParentingPropertyGridComponent>
                    <ButtonLineComponent
                        label="REMOVE ELEMENT"
                        onClick={() => {
                            this.state.currentNode?.dispose();
                            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                        }}
                    />
                </div>
            );
        }

        const sizeOptions = [
            { label: "Web (1920)", value: 0 },
            { label: "Phone (720)", value: 1 },
            { label: "Square (1200)", value: 2 },
            { label: "Custom", value: 3 }];
        const sizeValues = [
            new Vector2(1920, 1080),
            new Vector2(750, 1334),
            new Vector2(1200, 1200)];

        return (
            <div id="ge-propertyTab">
                <div id="header">
                    <img id="logo" src={adtIcon} />
                    <div id="title">AdvanceDyanamicTexture</div>
                </div>
                <div>
                    <TextLineComponent label="ART BOARD" value=" " color="grey"></TextLineComponent>
                    {
                        this.props.globalState.workbench.artBoardBackground !== undefined &&
                        <TextInputLineComponent icon={artboardColorIcon} lockObject={this._lockObject} label="Background" target={this.props.globalState.workbench.artBoardBackground} propertyName="background" onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />
                    }
                    <hr></hr>
                    <TextLineComponent label="CANVAS" value=" " color="grey"></TextLineComponent>
                    <CheckBoxLineComponent
                        label="Responsive"
                        icon={responsiveIcon}
                        isSelected={() => DataStorage.ReadBoolean("Responsive", true)}
                        onSelect={(value: boolean) => {
                            this.props.globalState.onResponsiveChangeObservable.notifyObservers(value);
                            DataStorage.WriteBoolean("Responsive", value);
                        }}
                    />
                    <OptionsLineComponent
                        label="Size"
                        options={sizeOptions}
                        icon={canvasSizeIcon}
                        target={this}
                        propertyName={"_sizeOption"}
                        noDirectUpdate={true}
                        onSelect={(value: any) => {
                            this._sizeOption = value;
                            if (this._sizeOption != (sizeOptions.length - 1)) {
                                const newSize = sizeValues[this._sizeOption];
                                this.props.globalState.workbench.resizeGuiTexture(newSize);
                            }
                            this.forceUpdate();
                        }}
                    />
                    {this._sizeOption == (sizeOptions.length - 1) &&
                        <Vector2LineComponent
                            label="Custom Size"
                            target={this.state}
                            propertyName="textureSize"
                            onChange={(newvalue) => {
                                this.props.globalState.workbench.resizeGuiTexture(newvalue);
                            }}
                        ></Vector2LineComponent>
                    }
                    <hr></hr>
                    <TextLineComponent label="FILE" value=" " color="grey"></TextLineComponent>
                    <FileButtonLineComponent label="Load" onClick={(file) => this.load(file)} accept=".json" />
                    <ButtonLineComponent
                        label="Save"
                        onClick={() => {
                            this.save();
                        }}
                    />
                    <hr></hr>
                    <TextLineComponent label="SNIPPET" value=" " color="grey"></TextLineComponent>
                    <ButtonLineComponent label="Load from snippet server" onClick={() => this.loadFromSnippet()} />
                    <ButtonLineComponent
                        label="Save to snippet server"
                        onClick={() => {
                            this.saveToSnippetServer();
                        }}
                    />
                </div>
            </div>
        );
    }
}
