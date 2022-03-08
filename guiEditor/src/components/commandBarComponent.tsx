import { DataStorage } from "babylonjs/Misc/dataStorage";
import * as React from "react";
import { GlobalState } from "../globalState";
import { FloatLineComponent } from "../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../sharedUiComponents/lines/checkBoxLineComponent";
import { OptionsLineComponent } from "../sharedUiComponents/lines/optionsLineComponent";
import { CommandButtonComponent } from "./commandButtonComponent";
import { CommandDropdownComponent } from "./commandDropdownComponent";
import { ColorLineComponent } from "../sharedUiComponents/lines/colorLineComponent";

const hamburgerIcon: string = require("../../public/imgs/hamburgerIcon.svg");
const pointerIcon: string = require("../../public/imgs/pointerIcon.svg");
const handIcon: string = require("../../public/imgs/handIcon.svg");
const zoomIcon: string = require("../../public/imgs/zoomIcon.svg");
const guidesIcon: string = require("../../public/imgs/guidesIcon.svg");
const logoIcon: string = require("../../public/imgs/babylonLogo.svg");
const canvasFitIcon: string = require("../../public/imgs/canvasFitIcon.svg");

require("../scss/commandBar.scss");

declare var Versions: any;

interface ICommandBarComponentProps {
    globalState: GlobalState;
}

const _sizeValues = [
    {width: 1920, height: 1080},
    {width: 1366, height: 768},
    {width: 1280, height: 800},
    {width: 3840, height: 2160},
    {width: 750, height: 1334},
    {width: 1125, height: 2436},
    {width: 1170, height: 2532},
    {width: 1284, height: 2778},
    {width: 1080, height: 2220},
    {width: 1080, height: 2340},
    {width: 1024, height: 1024},
    {width: 2048, height: 2048},
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

const MAX_TEXTURE_SIZE = 16384; //2^14

export class CommandBarComponent extends React.Component<ICommandBarComponentProps> {
    private _panning: boolean = false;
    private _zooming: boolean = false;
    private _selecting: boolean = true;
    private _sizeOption: number = 0;
    public constructor(props: ICommandBarComponentProps) {
        super(props);

        props.globalState.onPanObservable.add(() => {
            this._panning = !this._panning;
            this._zooming = false;
            this._selecting = false;
            this.forceUpdate();
        });

        props.globalState.onSelectionButtonObservable.add(() => {
            this._selecting = !this._selecting;
            this._panning = false;
            this._zooming = false;
            this.forceUpdate();
        });

        props.globalState.onZoomObservable.add(() => {
            this._zooming = !this._zooming;
            this._panning = false;
            this._selecting = false;
            this.forceUpdate();
        });

        props.globalState.onOutlineChangedObservable.add(() => {
            this.forceUpdate();
        });

        props.globalState.onResizeObservable.add((newSize) => {
            this.forceUpdate();
        });
    }

    public render() {
        const size = this.props.globalState.workbench ? {...this.props.globalState.workbench.guiSize} : {width: 0, height: 0};
        this._sizeOption = _sizeValues.findIndex((value) => value.width == size.width && value.height == size.height);
        if (this._sizeOption < 0) {
            this.props.globalState.onResponsiveChangeObservable.notifyObservers(false);
            DataStorage.WriteBoolean("Responsive", false);
        }

        return (
            <div className={"ge-commands"}>
                <div className="commands-left">
                    <div className="divider">
                        <img src={logoIcon} color="white" className={"active"} />
                        <CommandDropdownComponent
                            globalState={this.props.globalState}
                            toRight={true}
                            icon={hamburgerIcon}
                            tooltip="Options"
                            items={[
                                {
                                    label: "Save",
                                    onClick: () => {
                                        this.props.globalState.onSaveObservable.notifyObservers();
                                    },
                                },
                                {
                                    label: "Load",
                                    fileButton: true,
                                },
                                {
                                    label: "Save to snippet",
                                    onClick: () => {
                                        this.props.globalState.onSnippetSaveObservable.notifyObservers();
                                    },
                                },
                                {
                                    label: "Load from snippet",
                                    onClick: () => {
                                        this.props.globalState.onSnippetLoadObservable.notifyObservers();
                                    },
                                },
                                {
                                    label: "Copy Selected",
                                    onClick: () => {
                                        this.props.globalState.onCopyObservable.notifyObservers(content => this.props.globalState.hostWindow.navigator.clipboard.writeText(content));

                                    },
                                },
                                {
                                    label: "Paste",
                                    onClick: async () => {
                                        this.props.globalState.onPasteObservable.notifyObservers(await this.props.globalState.hostWindow.navigator.clipboard.readText());
                                    }
                                },
                                {
                                    label: "Delete Selected",
                                    onClick: () => {
                                        this.props.globalState.selectedControls.forEach((guiNode) => {
                                            if (guiNode !== this.props.globalState.guiTexture.getChildren()[0]) {
                                                this.props.globalState.guiTexture.removeControl(guiNode);
                                                this.props.globalState.liveGuiTexture?.removeControl(guiNode);
                                                guiNode.dispose();
                                            }
                                        });
                                        this.props.globalState.setSelection([]);
                                    },
                                },
                                {
                                    label: "Help",
                                    onClick: () => {
                                        window.open("https://doc.babylonjs.com/toolsAndResources/tools/guiEditor", "_blank");
                                    },
                                },
                                {
                                    label: "Give feedback",
                                    onClick: () => {
                                        window.open("https://forum.babylonjs.com/t/introducing-the-gui-editor-alpha/24578", "_blank");
                                    },
                                },

                            ]}
                        />
                        <CommandButtonComponent
                            tooltip="Select"
                            icon={pointerIcon}
                            shortcut="S"
                            isActive={this._selecting}
                            onClick={() => {
                                if (!this._selecting) this.props.globalState.onSelectionButtonObservable.notifyObservers();
                            }}
                        />
                        <CommandButtonComponent
                            tooltip="Pan"
                            icon={handIcon}
                            shortcut="P"
                            isActive={this._panning}
                            onClick={() => {
                                if (!this._panning) this.props.globalState.onPanObservable.notifyObservers();
                            }}
                        />
                        <CommandButtonComponent
                            tooltip="Zoom"
                            shortcut="Z"
                            icon={zoomIcon}
                            isActive={this._zooming}
                            onClick={() => {
                                if (!this._zooming) this.props.globalState.onZoomObservable.notifyObservers();
                            }}
                        />
                    </div>
                    <div className="divider">
                        <CommandButtonComponent
                            tooltip="Fit to Window"
                            shortcut="F"
                            icon={canvasFitIcon}
                            isActive={false}
                            onClick={() => {
                                this.props.globalState.onFitToWindowObservable.notifyObservers();
                            }}
                        />
                        <CommandButtonComponent
                            tooltip="Toggle Guides"
                            shortcut="G"
                            icon={guidesIcon}
                            isActive={this.props.globalState.outlines}
                            onClick={() => this.props.globalState.outlines = !this.props.globalState.outlines}
                        />
                    </div>
                    <div className="divider padded">
                        <ColorLineComponent
                            label={"Artboard:"}
                            target={this.props.globalState}
                            propertyName="backgroundColor"
                            disableAlpha={true}
                        />
                    </div>
                    <div className="divider padded">
                        <CheckBoxLineComponent
                            label="Responsive:"
                            iconLabel="Responsive GUIs will resize the UI layout and reflow controls to accommodate different device screen sizes"
                            isSelected={() => DataStorage.ReadBoolean("Responsive", true)}
                            onSelect={(value: boolean) => {
                                this.props.globalState.onResponsiveChangeObservable.notifyObservers(value);
                                DataStorage.WriteBoolean("Responsive", value);
                                this._sizeOption = _sizeOptions.length;
                                if (value) {
                                    this._sizeOption = 0;
                                    this.props.globalState.workbench.guiSize = _sizeValues[this._sizeOption];
                                }
                                this.forceUpdate();
                            }}
                        />
                        {DataStorage.ReadBoolean("Responsive", true) &&
                        <OptionsLineComponent
                            label=""
                            iconLabel="Size"
                            options={_sizeOptions}
                            target={this}
                            propertyName={"_sizeOption"}
                            noDirectUpdate={true}
                            onSelect={(value: any) => {
                                this._sizeOption = value;
                                if (this._sizeOption !== _sizeOptions.length) {
                                    const newSize = _sizeValues[this._sizeOption];
                                    this.props.globalState.workbench.guiSize = newSize;
                                }
                                this.forceUpdate();
                            }}
                        />
                        }
                        {!DataStorage.ReadBoolean("Responsive", true) && (
                        <>
                            <FloatLineComponent
                                label="W"
                                target={size}
                                propertyName="width"
                                isInteger={true}
                                min={1}
                                max={MAX_TEXTURE_SIZE}
                                onChange={(newvalue) => {
                                    if (!isNaN(newvalue)) {
                                        this.props.globalState.workbench.guiSize = {width: newvalue, height: size.height};
                                    }
                                }}
                            ></FloatLineComponent>
                            <FloatLineComponent
                                label="H"
                                target={size}
                                propertyName="height"
                                isInteger={true}
                                min={1}
                                max={MAX_TEXTURE_SIZE}
                                onChange={(newvalue) => {
                                    if (!isNaN(newvalue)) {
                                        this.props.globalState.workbench.guiSize = {width: size.width, height: newvalue};
                                    }
                                }}
                            ></FloatLineComponent>
                        </>
                    )}
                    </div>
                </div>
                <div className="commands-right"></div>
            </div>
        );
    }
}
