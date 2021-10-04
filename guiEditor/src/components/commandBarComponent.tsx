import { Container } from "babylonjs-gui/2D/controls/container";
import { Control } from "babylonjs-gui/2D/controls/control";
import * as React from "react";
import { GlobalState } from '../globalState';
import { CommandButtonComponent } from './commandButtonComponent';
import { CommandDropdownComponent } from './commandDropdownComponent';

const hamburgerIcon: string = require("../../public/imgs/hamburgerIcon.svg");
const pointerIcon: string = require("../../public/imgs/pointerIcon.svg");
const handIcon: string = require("../../public/imgs/handIcon.svg");
const zoomIcon: string = require("../../public/imgs/zoomIcon.svg");
const guidesIcon: string = require("../../public/imgs/guidesIcon.svg");
const logoIcon: string = require("../../public/imgs/babylonLogo.svg");
const canvasFitIcon: string = require("../../public/imgs/canvasFitIcon.svg");
const moveIcon: string = require("../../public/imgs/moveIcon.svg");

require("../scss/commandBar.scss");

declare var Versions: any;

interface ICommandBarComponentProps {
    globalState: GlobalState;
}

export class CommandBarComponent extends React.Component<ICommandBarComponentProps> {
    private _panning: boolean = false;
    private _zooming: boolean = false;
    private _selecting: boolean = true;
    private _moving: boolean = false;
    private _outlines: boolean;
    public constructor(props: ICommandBarComponentProps) {
        super(props);

        props.globalState.onPanObservable.add(() => {
            this._panning = !this._panning;
            this._zooming = false;
            this._selecting = false;
            this._moving = false;
            this.forceUpdate();
        });

        props.globalState.onSelectionButtonObservable.add(() => {
            this._selecting = !this._selecting;
            this._panning = false;
            this._zooming = false;
            this._moving = false;
            this.forceUpdate();
        });

        props.globalState.onZoomObservable.add(() => {
            this._zooming = !this._zooming;
            this._panning = false;
            this._selecting = false;
            this._moving = false;
            this.forceUpdate();
        });

        props.globalState.onMoveObservable.add(() => {
            this._zooming = false;
            this._panning = false;
            this._selecting = false;
            this._moving = !this._moving;
            this.forceUpdate();
        });

        props.globalState.onOutlinesObservable.add(() => {
            this._outlines = !this._outlines;
            const nodes = this.props.globalState.workbench.nodes;
            nodes.forEach(node => {
                this.updateNodeOutline(node);
            });
            this.forceUpdate();
        });
    }

    private updateNodeOutline(guiControl: Control) {
        guiControl.isHighlighted = this._outlines;
        guiControl.highlightLineWidth = 5;
        if (this.props.globalState.workbench.isContainer(guiControl)) {
            (guiControl as Container).children.forEach(child => {
                this.updateNodeOutline(child);
            });
        }
    }

    public render() {

        return (
            <div className={"ge-commands"}>
                <div className="commands-left">
                    <img src={logoIcon} color="white" className={"active"} />
                    <CommandDropdownComponent globalState={this.props.globalState} toRight={true} icon={hamburgerIcon} tooltip="Options" items={[
                        {
                            label: "Save",
                            onClick: () => { this.props.globalState.onSaveObservable.notifyObservers(); }
                        }, {
                            label: "Load",
                            fileButton: true
                        }, {
                            label: "Save to snippet",
                            onClick: () => { this.props.globalState.onSnippetSaveObservable.notifyObservers(); }
                        }, {
                            label: "Load from snippet",
                            onClick: () => { this.props.globalState.onSnippetLoadObservable.notifyObservers(); }
                        }, {
                            label: "Help",
                            onClick: () => { window.open('https://doc.babylonjs.com/divingDeeper/gui/gui', '_blank') }
                        },
                    ]} />
                    <CommandButtonComponent tooltip="Select" icon={pointerIcon} shortcut="Q" isActive={this._selecting}
                        onClick={() => { if (!this._selecting) this.props.globalState.onSelectionButtonObservable.notifyObservers(); }} />
                    <CommandButtonComponent tooltip="Move" icon={moveIcon} shortcut="M" isActive={this._moving}
                        onClick={() => { if (!this._moving) this.props.globalState.onMoveObservable.notifyObservers(); }} />
                    <CommandButtonComponent tooltip="Pan" icon={handIcon} shortcut="W" isActive={this._panning}
                        onClick={() => { if (!this._panning) this.props.globalState.onPanObservable.notifyObservers(); }} />
                    <CommandButtonComponent tooltip="Zoom" shortcut="E" icon={zoomIcon} isActive={this._zooming}
                        onClick={() => { if (!this._zooming) this.props.globalState.onZoomObservable.notifyObservers(); }} />
                    <CommandButtonComponent tooltip="Fit to Window" shortcut="Alt+F" icon={canvasFitIcon} isActive={false}
                        onClick={() => { this.props.globalState.onFitToWindowObservable.notifyObservers(); }} />
                    <CommandButtonComponent tooltip="Toggle Guides" shortcut="R" icon={guidesIcon} isActive={this._outlines}
                        onClick={() => { this.props.globalState.onOutlinesObservable.notifyObservers(); }} />
                </div>
                <div className="commands-right">

                </div>
            </div>
        );
    }
}