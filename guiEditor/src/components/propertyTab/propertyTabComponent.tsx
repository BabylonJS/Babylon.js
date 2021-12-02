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
import { SliderGenericPropertyGridComponent } from "./propertyGrids/gui/sliderGenericPropertyGridComponent";
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
import { Vector2 } from "babylonjs/Maths/math.vector";
import { OptionsLineComponent } from "../../sharedUiComponents/lines/optionsLineComponent";
import { FloatLineComponent } from "../../sharedUiComponents/lines/floatLineComponent";
import { Color3LineComponent } from "../../sharedUiComponents/lines/color3LineComponent";
import { TextInputLineComponent } from "../../sharedUiComponents/lines/textInputLineComponent";
import { ParentingPropertyGridComponent } from "../parentingPropertyGridComponent";
import { DisplayGridPropertyGridComponent } from "./propertyGrids/gui/displayGridPropertyGridComponent";
import { DisplayGrid } from "babylonjs-gui/2D/controls/displayGrid";
import { Button } from "babylonjs-gui/2D/controls/button";
import { ButtonPropertyGridComponent } from "./propertyGrids/gui/buttonPropertyGridComponent";
import { GUINodeTools } from "../../guiNodeTools";

require("./propertyTab.scss");
const adtIcon: string = require("../../../public/imgs/adtIcon.svg");
const responsiveIcon: string = require("../../../public/imgs/responsiveIcon.svg");
const canvasSizeIcon: string = require("../../../public/imgs/canvasSizeIcon.svg");
const artboardColorIcon: string = require("../../../public/imgs/artboardColorIcon.svg");
const rectangleIcon: string = require("../../../public/imgs/rectangleIconDark.svg");
const ellipseIcon: string = require("../../../public/imgs/ellipseIconDark.svg");
const gridIcon: string = require("../../../public/imgs/gridIconDark.svg");
const stackPanelIcon: string = require("../../../public/imgs/stackPanelIconDark.svg");
const textBoxIcon: string = require("../../../public/imgs/textBoxIconDark.svg");
const sliderIcon: string = require("../../../public/imgs/sliderIconDark.svg");
const buttonIcon: string = require("../../../public/imgs/buttonIconDark.svg");
const checkboxIcon: string = require("../../../public/imgs/checkboxIconDark.svg");
const imageIcon: string = require("../../../public/imgs/imageIconDark.svg");
const keyboardIcon: string = require("../../../public/imgs/keyboardIconDark.svg");
const inputFieldIcon: string = require("../../../public/imgs/inputFieldIconDark.svg");
const lineIcon: string = require("../../../public/imgs/lineIconDark.svg");
const displaygridIcon: string = require("../../../public/imgs/displaygridIconDark.svg");
const colorPickerIcon: string = require("../../../public/imgs/colorPickerIconDark.svg");
const scrollbarIcon: string = require("../../../public/imgs/scrollbarIconDark.svg");
const imageSliderIcon: string = require("../../../public/imgs/imageSliderIconDark.svg");
const radioButtonIcon: string = require("../../../public/imgs/radioButtonIconDark.svg");
const MAX_TEXTURE_SIZE = 16384; //2^14

interface IPropertyTabComponentProps {
    globalState: GlobalState;
}

interface IPropertyTabComponentState {
    currentNode: Nullable<Control>;
}

export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, IPropertyTabComponentState> {
    private _onBuiltObserver: Nullable<Observer<void>>;
    private _timerIntervalId: number;
    private _lockObject: LockObject;
    private _sizeOption: number;

    constructor(props: IPropertyTabComponentProps) {
        super(props);

        this.state = { currentNode: null };
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
        this.props.globalState.onSelectionChangedObservable.add((selection) => {
            if (selection instanceof Control) {
                this.setState({ currentNode: selection });
            } else {
                this.setState({ currentNode: null });
            }
        });
        this.props.globalState.onResizeObservable.add((newSize) => {
            this.props.globalState.workbench.artBoardBackground._markAsDirty(true);
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

                this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
            },
            undefined,
            true
        );
    }

    save(saveCallback: () => void) {
        //removing the art board background from the adt.
        this.props.globalState.guiTexture.removeControl(this.props.globalState.workbench.artBoardBackground);
        saveCallback();
        //readding the art board at the front of the list so it will be the first thing rendered.
        if (this.props.globalState.guiTexture.getChildren()[0].children.length) {
            this.props.globalState.guiTexture.getChildren()[0].children.unshift(this.props.globalState.workbench.artBoardBackground);
        } else {
            this.props.globalState.guiTexture.getChildren()[0].children.push(this.props.globalState.workbench.artBoardBackground);
        }
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
                                regex: new RegExp(oldId, "g"),
                                replace: `parseFromSnippetAsync("${adt.snippetId}`,
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
                if (navigator.clipboard) {
                    navigator.clipboard
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

    renderProperties() {
        const className = this.state.currentNode?.getClassName();
        switch (className) {
            case "TextBlock": {
                const textBlock = this.state.currentNode as TextBlock;
                return (
                    <TextBlockPropertyGridComponent
                        textBlock={textBlock}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "InputText": {
                const inputText = this.state.currentNode as InputText;
                return (
                    <InputTextPropertyGridComponent
                        inputText={inputText}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "ColorPicker": {
                const colorPicker = this.state.currentNode as ColorPicker;
                return (
                    <ColorPickerPropertyGridComponent
                        colorPicker={colorPicker}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Image": {
                const image = this.state.currentNode as Image;
                return <ImagePropertyGridComponent image={image} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "Slider": {
                const slider = this.state.currentNode as Slider;
                return (
                    <SliderGenericPropertyGridComponent slider={slider} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />
                );
            }
            case "ImageBasedSlider": {
                const imageBasedSlider = this.state.currentNode as ImageBasedSlider;
                return (
                    <ImageBasedSliderPropertyGridComponent
                        imageBasedSlider={imageBasedSlider}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Rectangle": {
                const rectangle = this.state.currentNode as Rectangle;
                return (
                    <RectanglePropertyGridComponent
                        rectangle={rectangle}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "StackPanel": {
                const stackPanel = this.state.currentNode as StackPanel;
                return (
                    <StackPanelPropertyGridComponent
                        stackPanel={stackPanel}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Grid": {
                const grid = this.state.currentNode as Grid;
                return <GridPropertyGridComponent grid={grid} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "ScrollViewer": {
                const scrollViewer = this.state.currentNode as ScrollViewer;
                return (
                    <ScrollViewerPropertyGridComponent
                        scrollViewer={scrollViewer}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Ellipse": {
                const ellipse = this.state.currentNode as Ellipse;
                return (
                    <EllipsePropertyGridComponent
                        ellipse={ellipse}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Checkbox": {
                const checkbox = this.state.currentNode as Checkbox;
                return (
                    <CheckboxPropertyGridComponent
                        checkbox={checkbox}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "RadioButton": {
                const radioButton = this.state.currentNode as RadioButton;
                return (
                    <RadioButtonPropertyGridComponent
                        radioButton={radioButton}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Line": {
                const line = this.state.currentNode as Line;
                return <LinePropertyGridComponent line={line} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />;
            }
            case "DisplayGrid": {
                const displayGrid = this.state.currentNode as DisplayGrid;
                return (
                    <DisplayGridPropertyGridComponent
                        displayGrid={displayGrid}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                    />
                );
            }
            case "Button": {
                const button = this.state.currentNode as Button;
                return (
                    <ButtonPropertyGridComponent
                        key="buttonMenu"
                        rectangle={button}
                        lockObject={this._lockObject}
                        onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                        onAddComponent={(value) => {
                            const guiElement = GUINodeTools.CreateControlFromString(value);
                            const newGuiNode = this.props.globalState.workbench.createNewGuiNode(guiElement);
                            button.addControl(newGuiNode);
                            this.props.globalState.onSelectionChangedObservable.notifyObservers(newGuiNode);
                        }}
                    />
                );
            }
        }

        if (className !== "") {
            const control = this.state.currentNode as Control;
            return (
                <ControlPropertyGridComponent control={control} lockObject={this._lockObject} onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable} />
            );
        }
        return null;
    }

    renderControlIcon() {
        const className = this.state.currentNode?.getClassName();
        switch (className) {
            case "TextBlock": {
                return textBoxIcon;
            }
            case "InputText": {
                return inputFieldIcon;
            }
            case "ColorPicker": {
                return colorPickerIcon;
            }
            case "Image": {
                return imageIcon;
            }
            case "Slider": {
                return sliderIcon;
            }
            case "ImageBasedSlider": {
                return imageSliderIcon;
            }
            case "Rectangle": {
                return rectangleIcon;
            }
            case "StackPanel": {
                return stackPanelIcon;
            }
            case "Grid": {
                return gridIcon;
            }
            case "ScrollViewer": {
                return scrollbarIcon;
            }
            case "Ellipse": {
                return ellipseIcon;
            }
            case "Checkbox": {
                return checkboxIcon;
            }
            case "RadioButton": {
                return radioButtonIcon;
            }
            case "Line": {
                return lineIcon;
            }
            case "DisplayGrid": {
                return displaygridIcon;
            }
            case "VirtualKeyboard": {
                return keyboardIcon;
            }
            case "Button": {
                return buttonIcon;
            }
        }
        return adtIcon;
    }

    render() {
        if (this.props.globalState.guiTexture == undefined) return null;
        const _sizeValues = [
            new Vector2(1920, 1080),
            new Vector2(1366, 768),
            new Vector2(1280, 800),
            new Vector2(3840, 2160),
            new Vector2(750, 1334),
            new Vector2(1125, 2436),
            new Vector2(1170, 2532),
            new Vector2(1284, 2778),
            new Vector2(1080, 2220),
            new Vector2(1080, 2340),
            new Vector2(1024, 1024),
            new Vector2(2048, 2048),
        ];
        const _sizeOptions = [
            { label: "Web (1920)", value: 0 },
            { label: "Web (1366)", value: 1 },
            { label: "Web (1280)", value: 2 },
            { label: "Web (3840)", value: 3 },
            { label: "iPhone 8 (750)", value: 4 },
            { label: "iPhone X, 11 (1125)", value: 5 },
            { label: "iPhone 12 (1170)", value: 6 },
            { label: "iPhone Pro Max (1284)", value: 7 },
            { label: "Google Pixel 4 (1080)", value: 8 },
            { label: "Google Pixel 5 (1080)", value: 9 },
            { label: "Square (1024)", value: 10 },
            { label: "Square (2048)", value: 11 },
        ];

        const size = this.props.globalState.guiTexture.getSize();
        let textureSize = new Vector2(size.width, size.height);
        this._sizeOption = _sizeValues.findIndex((value) => value.x == textureSize.x && value.y == textureSize.y);
        if (this._sizeOption < 0) {
            this.props.globalState.onResponsiveChangeObservable.notifyObservers(false);
            DataStorage.WriteBoolean("Responsive", false);
        }

        if (this.state.currentNode && this.props.globalState.workbench.selectedGuiNodes.length === 1) {
            return (
                <div id="ge-propertyTab">
                    <div id="header">
                        <img id="logo" src={this.renderControlIcon()} />
                        <div id="title">
                            <TextInputLineComponent
                                noUnderline={true}
                                lockObject={this._lockObject}
                                label=""
                                target={this.state.currentNode}
                                propertyName="name"
                                onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                            />
                        </div>
                    </div>
                    {this.renderProperties()}
                    {this.state.currentNode?.parent?.typeName === "Grid" && (
                        <ParentingPropertyGridComponent
                            control={this.state.currentNode}
                            onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                            lockObject={this._lockObject}
                        ></ParentingPropertyGridComponent>
                    )}
                    {this.state.currentNode !== this.props.globalState.guiTexture.getChildren()[0] && (
                        <>
                            <hr className="ge" />
                            <ButtonLineComponent
                                label="DELETE ELEMENT"
                                onClick={() => {
                                    if (this.state.currentNode) {
                                        this.props.globalState.guiTexture.removeControl(this.state.currentNode);
                                        this.props.globalState.liveGuiTexture?.removeControl(this.state.currentNode);
                                        this.state.currentNode.dispose();
                                    }
                                    this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                                }}
                            />
                            <ButtonLineComponent
                                label="COPY ELEMENT"
                                onClick={() => {
                                    if (this.state.currentNode) {
                                        this.props.globalState.workbench.CopyGUIControl(this.state.currentNode);
                                    }
                                }}
                            />
                        </>
                    )}
                </div>
            );
        }

        return (
            <div id="ge-propertyTab">
                <div id="header">
                    <img id="logo" src={adtIcon} />
                    <div id="title">AdvancedDynamicTexture</div>
                </div>
                <div>
                    <TextLineComponent tooltip="" label="ART BOARD" value=" " color="grey"></TextLineComponent>
                    {this.props.globalState.workbench._scene !== undefined && (
                        <Color3LineComponent
                            iconLabel={"Background Color"}
                            lockObject={this._lockObject}
                            icon={artboardColorIcon}
                            label=""
                            target={this.props.globalState.workbench._scene}
                            propertyName="clearColor"
                            onPropertyChangedObservable={this.props.globalState.onPropertyChangedObservable}
                        />
                    )}
                    <hr className="ge" />
                    <TextLineComponent tooltip="" label="CANVAS" value=" " color="grey"></TextLineComponent>
                    <CheckBoxLineComponent
                        label="RESPONSIVE"
                        iconLabel="A responsive layout for the AdvancedDynamicTexture will resize the UI layout and reflow controls to accommodate different device screen sizes"
                        icon={responsiveIcon}
                        isSelected={() => DataStorage.ReadBoolean("Responsive", true)}
                        onSelect={(value: boolean) => {
                            this.props.globalState.onResponsiveChangeObservable.notifyObservers(value);
                            DataStorage.WriteBoolean("Responsive", value);
                            this._sizeOption = _sizeOptions.length;
                            if (value) {
                                this._sizeOption = 0;
                                this.props.globalState.workbench.resizeGuiTexture(_sizeValues[this._sizeOption]);
                            }
                            this.forceUpdate();
                        }}
                    />
                    {DataStorage.ReadBoolean("Responsive", true) && (
                        <OptionsLineComponent
                            label=""
                            iconLabel="Size"
                            options={_sizeOptions}
                            icon={canvasSizeIcon}
                            target={this}
                            propertyName={"_sizeOption"}
                            noDirectUpdate={true}
                            onSelect={(value: any) => {
                                this._sizeOption = value;
                                if (this._sizeOption !== _sizeOptions.length) {
                                    const newSize = _sizeValues[this._sizeOption];

                                    this.props.globalState.workbench.resizeGuiTexture(newSize);
                                }
                                this.forceUpdate();
                            }}
                        />
                    )}
                    {!DataStorage.ReadBoolean("Responsive", true) && (
                        <div className="ge-divider">
                            <FloatLineComponent
                                icon={canvasSizeIcon}
                                iconLabel="Canvas Size"
                                label="W"
                                target={textureSize}
                                propertyName="x"
                                isInteger={true}
                                min={1}
                                max={MAX_TEXTURE_SIZE}
                                onChange={(newvalue) => {
                                    if (!isNaN(newvalue)) {
                                        this.props.globalState.workbench.resizeGuiTexture(new Vector2(newvalue, textureSize.y));
                                    }
                                }}
                            ></FloatLineComponent>
                            <FloatLineComponent
                                icon={canvasSizeIcon}
                                label="H"
                                target={textureSize}
                                propertyName="y"
                                isInteger={true}
                                min={1}
                                max={MAX_TEXTURE_SIZE}
                                onChange={(newvalue) => {
                                    if (!isNaN(newvalue)) {
                                        this.props.globalState.workbench.resizeGuiTexture(new Vector2(textureSize.x, newvalue));
                                    }
                                }}
                            ></FloatLineComponent>
                        </div>
                    )}
                    <hr className="ge" />
                    <TextLineComponent tooltip="" label="FILE" value=" " color="grey"></TextLineComponent>
                    <FileButtonLineComponent label="Load" onClick={(file) => this.load(file)} accept=".json" />
                    <ButtonLineComponent
                        label="Save"
                        onClick={() => {
                            this.props.globalState.onSaveObservable.notifyObservers();
                        }}
                    />
                    <hr className="ge" />
                    <TextLineComponent tooltip="" label="SNIPPET" value=" " color="grey"></TextLineComponent>
                    <ButtonLineComponent label="Load from snippet server" onClick={() => this.loadFromSnippet()} />
                    <ButtonLineComponent
                        label="Save to snippet server"
                        onClick={() => {
                            this.props.globalState.onSnippetSaveObservable.notifyObservers();
                        }}
                    />
                </div>
            </div>
        );
    }
}
