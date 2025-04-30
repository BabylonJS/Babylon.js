import { DataStorage } from "core/Misc/dataStorage";
import * as React from "react";
import type { GlobalState } from "../globalState";
import { GUIEditorTool } from "../globalState";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { CommandButtonComponent } from "./commandButtonComponent";
import { CommandDropdownComponent } from "./commandDropdownComponent";
import { ColorLine } from "shared-ui-components/lines/colorLineComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

import hamburgerIcon from "../imgs/hamburgerIcon.svg";
import pointerIcon from "../imgs/pointerIcon.svg";
import handIcon from "../imgs/handIcon.svg";
import zoomIcon from "../imgs/zoomIcon.svg";
import guidesIcon from "../imgs/guidesIcon.svg";
import logoIcon from "../imgs/babylonLogo.svg";
import canvasFitIcon from "../imgs/canvasFitIcon.svg";
import copyIcon from "../imgs/buttonbar_copyIcon.svg";
import pasteIcon from "../imgs/buttonbar_pasteIcon.svg";
import deleteIcon from "../imgs/buttonBar_deleteIcon.svg";
import copyIconDisabled from "../imgs/buttonbar_copyIcon_disabled.svg";
import pasteIconDisabled from "../imgs/buttonbar_pasteIcon_disabled.svg";
import deleteIconDisabled from "../imgs/buttonBar_deleteIcon_disabled.svg";

import "../scss/commandBar.scss";

interface ICommandBarComponentProps {
    globalState: GlobalState;
}

const _sizeValues = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1280, height: 800 },
    { width: 3840, height: 2160 },
    { width: 750, height: 1334 },
    { width: 1125, height: 2436 },
    { width: 1170, height: 2532 },
    { width: 1284, height: 2778 },
    { width: 1080, height: 2220 },
    { width: 1080, height: 2340 },
    { width: 1024, height: 1024 },
    { width: 2048, height: 2048 },
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

// eslint-disable-next-line @typescript-eslint/naming-convention
const MAX_TEXTURE_SIZE = 16384; //2^14

export class CommandBarComponent extends React.Component<ICommandBarComponentProps> {
    private _sizeOption: number = 0;
    private _stopUpdating: boolean = false;
    private _lockObject: LockObject;

    public constructor(props: ICommandBarComponentProps) {
        super(props);

        this._lockObject = new LockObject();

        props.globalState.onToolChangeObservable.add(() => {
            this.forceUpdate();
        });

        props.globalState.onOutlineChangedObservable.add(() => {
            this.forceUpdate();
        });

        props.globalState.onResizeObservable.add(() => {
            this.forceUpdate();
        });
        props.globalState.onSelectionChangedObservable.add(() => {
            this.forceUpdate();
        });
        props.globalState.onWindowResizeObservable.add(() => {
            this.forceUpdate();
        });
    }

    public override render() {
        const isPasteDisabled = this.props.globalState.workbench ? this.props.globalState.workbench.pasteDisabled : true;
        const size = this.props.globalState.workbench ? { ...this.props.globalState.workbench.guiSize } : { width: 0, height: 0 };
        const copyyIcon = this.props.globalState.selectedControls.length === 0 ? copyIconDisabled : copyIcon;
        const deleteeIcon = this.props.globalState.selectedControls.length === 0 ? deleteIconDisabled : deleteIcon;
        const pasteeIcon = isPasteDisabled ? pasteIconDisabled : pasteIcon;

        const responsiveUI = this.props.globalState.fromPG ? DataStorage.ReadBoolean("responsiveUI", true) : DataStorage.ReadBoolean("Responsive", true);

        this._sizeOption = _sizeValues.findIndex((value) => value.width == size.width && value.height == size.height);
        if (this._sizeOption < 0) {
            this.props.globalState.onResponsiveChangeObservable.notifyObservers(false);
            DataStorage.WriteBoolean("Responsive", false);
        }

        return (
            <div className={"ge-commands"}>
                <div className="commands-left">
                    <div className="divider">
                        <img src={logoIcon} color="white" className={"active"} draggable={false} />
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
                                    label: "Save selected control",
                                    onClick: () => {
                                        this.props.globalState.onSaveSelectedControl.notifyObservers();
                                    },
                                },
                                {
                                    label: "Load control",
                                    fileButton: true,
                                    loadControlButton: true,
                                },
                                {
                                    label: "Help",
                                    onClick: () => {
                                        window.open("https://doc.babylonjs.com/toolsAndResources/guiEditor", "_blank");
                                    },
                                },
                                {
                                    label: "Give feedback",
                                    onClick: () => {
                                        window.open("https://forum.babylonjs.com/t/introducing-the-gui-editor-beta/28943", "_blank");
                                    },
                                },
                            ]}
                        />
                        <CommandButtonComponent
                            tooltip="Select"
                            icon={pointerIcon}
                            shortcut="S"
                            isActive={this.props.globalState.tool === GUIEditorTool.SELECT}
                            onClick={() => {
                                this.props.globalState.tool = GUIEditorTool.SELECT;
                            }}
                        />
                        <CommandButtonComponent
                            tooltip="Pan"
                            icon={handIcon}
                            shortcut="P"
                            isActive={this.props.globalState.tool === GUIEditorTool.PAN}
                            onClick={() => {
                                this.props.globalState.tool = GUIEditorTool.PAN;
                            }}
                        />
                        <CommandButtonComponent
                            tooltip="Zoom"
                            shortcut="Z"
                            icon={zoomIcon}
                            isActive={this.props.globalState.tool === GUIEditorTool.ZOOM}
                            onClick={() => {
                                this.props.globalState.tool = GUIEditorTool.ZOOM;
                            }}
                        />
                    </div>
                    <div className="divider">
                        <CommandButtonComponent
                            tooltip="Copy Selected"
                            shortcut="Ctrl + C"
                            icon={copyyIcon}
                            isActive={false}
                            copyDeleteDisabled={this.props.globalState.selectedControls.length === 0} //disabled when nothing is selected
                            onClick={() => {
                                this.props.globalState.onCopyObservable.notifyObservers((content) => this.props.globalState.hostWindow.navigator.clipboard.writeText(content));
                                this.forceUpdate();
                            }}
                        />
                        <CommandButtonComponent
                            tooltip="Paste"
                            shortcut="Ctrl + V"
                            icon={pasteeIcon}
                            isActive={false}
                            pasteDisabled={isPasteDisabled}
                            onClick={async () => {
                                this.props.globalState.onPasteObservable.notifyObservers(await this.props.globalState.hostWindow.navigator.clipboard.readText());
                            }}
                        />
                        <CommandButtonComponent
                            tooltip="Delete"
                            shortcut="Delete"
                            icon={deleteeIcon}
                            isActive={false}
                            copyDeleteDisabled={this.props.globalState.selectedControls.length === 0} //disabled when nothing is selected
                            onClick={() => {
                                for (const guiNode of this.props.globalState.selectedControls) {
                                    if (guiNode != this.props.globalState.guiTexture.getChildren()[0]) {
                                        this.props.globalState.guiTexture.removeControl(guiNode);
                                        this.props.globalState.liveGuiTexture?.removeControl(guiNode);
                                        guiNode.dispose();
                                    }
                                }
                                this.props.globalState.setSelection([]);
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
                                this.props.globalState.onFitControlsToWindowObservable.notifyObservers();
                            }}
                        />
                        <CommandButtonComponent
                            tooltip="Toggle Guides"
                            shortcut="G"
                            icon={guidesIcon}
                            isActive={this.props.globalState.outlines}
                            onClick={() => (this.props.globalState.outlines = !this.props.globalState.outlines)}
                        />
                    </div>
                    <div className="divider padded">
                        <ColorLine lockObject={this._lockObject} label={"Artboard:"} target={this.props.globalState} propertyName="backgroundColor" disableAlpha={true} />
                    </div>
                    <div className="divider padded">
                        <CheckBoxLineComponent
                            label="Responsive:"
                            iconLabel="Responsive GUIs will resize the UI layout and reflow controls to accommodate different device screen sizes"
                            isSelected={() => DataStorage.ReadBoolean("Responsive", true)}
                            onSelect={(value: boolean) => {
                                this.props.globalState.onResponsiveChangeObservable.notifyObservers(value);
                                DataStorage.WriteBoolean("Responsive", value);
                                DataStorage.WriteBoolean("responsiveUI", value);
                                this._sizeOption = _sizeOptions.length;
                                if (value) {
                                    this._sizeOption = 0;
                                    this.props.globalState.workbench.guiSize = _sizeValues[this._sizeOption];
                                    DataStorage.WriteNumber("width", this.props.globalState.workbench.guiSize.width);
                                    DataStorage.WriteNumber("height", this.props.globalState.workbench.guiSize.height);
                                }
                                this.forceUpdate();
                            }}
                            large
                        />
                        {responsiveUI && (
                            <OptionsLine
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
                                        DataStorage.WriteNumber("width", this.props.globalState.workbench.guiSize.width);
                                        DataStorage.WriteNumber("height", this.props.globalState.workbench.guiSize.height);
                                    }
                                    this.forceUpdate();
                                }}
                            />
                        )}
                        {!responsiveUI && (
                            <>
                                <FloatLineComponent
                                    lockObject={this._lockObject}
                                    label="W"
                                    target={size}
                                    propertyName="width"
                                    min={1}
                                    max={MAX_TEXTURE_SIZE}
                                    onChange={(newValue) => {
                                        if (!this._stopUpdating) {
                                            this.props.globalState.workbench.guiSize = { width: newValue, height: size.height };
                                            DataStorage.WriteNumber("width", this.props.globalState.workbench.guiSize.width);
                                        }
                                    }}
                                    onDragStart={() => {
                                        this._stopUpdating = true;
                                    }}
                                    onDragStop={(newValue) => {
                                        this._stopUpdating = false;
                                        this.props.globalState.workbench.guiSize = { width: newValue, height: size.height };
                                        DataStorage.WriteNumber("width", this.props.globalState.workbench.guiSize.width);
                                    }}
                                    arrows={true}
                                    isInteger={true}
                                />
                                <FloatLineComponent
                                    lockObject={this._lockObject}
                                    label="H"
                                    target={size}
                                    propertyName="height"
                                    min={1}
                                    max={MAX_TEXTURE_SIZE}
                                    onChange={(newValue) => {
                                        if (!this._stopUpdating) {
                                            this.props.globalState.workbench.guiSize = { width: size.width, height: newValue };
                                            DataStorage.WriteNumber("height", this.props.globalState.workbench.guiSize.width);
                                        }
                                    }}
                                    onDragStart={() => {
                                        this._stopUpdating = true;
                                    }}
                                    onDragStop={(newValue) => {
                                        this._stopUpdating = false;
                                        this.props.globalState.workbench.guiSize = { width: size.width, height: newValue };
                                        DataStorage.WriteNumber("height", this.props.globalState.workbench.guiSize.width);
                                    }}
                                    arrows={true}
                                    isInteger={true}
                                />
                            </>
                        )}
                    </div>
                </div>
                <div className="commands-right"></div>
            </div>
        );
    }
}
