import * as React from "react"; 
import { GlobalState } from './globalState';

import { Portal } from './portal';
import { Nullable } from 'babylonjs/types';

import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { Toolbar } from './components/toolbar';
import { TextureCanvasComponent } from './components/textureCanvas/textureCanvasComponent';
import { TextureCanvasManager } from './components/textureCanvas/textureCanvasManager';

require("./main.scss");


interface IImageEditorProps {
    globalState: GlobalState;
}



export class ImageEditor extends React.Component<IImageEditorProps> {
    // private _mouseLocationX = 0;
    // private _mouseLocationY = 0;
    private _onWidgetKeyUpPointer: any;


    // private _previewHost: Nullable<HTMLElement>;
    // private _popUpWindow: Window;
    
    private _startX: number;
    private _moveInProgress: boolean;

    private _leftWidth = DataStorage.ReadNumber("LeftWidth", 200);
    private _rightWidth = DataStorage.ReadNumber("RightWidth", 300);

    private _textureCanvasManager: TextureCanvasManager;


    onPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        this._startX = evt.clientX;
        this._moveInProgress = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    onPointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        this._moveInProgress = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }

    resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft = true) {
        if (!this._moveInProgress) {
            return;
        }

        const deltaX = evt.clientX - this._startX;
        const rootElement = evt.currentTarget.ownerDocument!.getElementById("node-editor-graph-root") as HTMLDivElement;

        if (forLeft) {
            this._leftWidth += deltaX;
            this._leftWidth = Math.max(150, Math.min(400, this._leftWidth));
            DataStorage.WriteNumber("LeftWidth", this._leftWidth);
        } else {
            this._rightWidth -= deltaX;
            this._rightWidth = Math.max(250, Math.min(500, this._rightWidth));
            DataStorage.WriteNumber("RightWidth", this._rightWidth);
            rootElement.ownerDocument!.getElementById("preview")!.style.height = this._rightWidth + "px";
        }

        rootElement.style.gridTemplateColumns = this.buildColumnLayout();

        this._startX = evt.clientX;
    }

    buildColumnLayout() {
        return `${this._leftWidth}px 4px calc(100% - ${this._leftWidth + 8 + this._rightWidth}px) 4px ${this._rightWidth}px`;
    }

    componentDidMount() {
        if (this.props.globalState.hostDocument) {
            this._textureCanvasManager = new TextureCanvasManager(this.props.globalState.hostDocument.getElementById("texture-canvas") as HTMLCanvasElement, this.props.globalState);
        }

        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            ((this.props.globalState.hostDocument || document).querySelector(".blocker") as HTMLElement).style.visibility = "visible";
        }

        this.build();
    }

    componentWillUnmount() {
        if (this.props.globalState.hostDocument) {
            this.props.globalState.hostDocument!.removeEventListener("keyup", this._onWidgetKeyUpPointer, false);
        }
        if (this._textureCanvasManager) {
            this._textureCanvasManager.dispose();
        }
    }

    build() {
        
    }

    render() {
        return <Portal globalState={this.props.globalState}>
             <div id="texture-editor-image-root"
                    onMouseMove={evt => {                
                        // this._mouseLocationX = evt.pageX;
                        // this._mouseLocationY = evt.pageY;
                    }}
                    onMouseDown={(evt) => {
                        if ((evt.target as HTMLElement).nodeName === "INPUT") {
                            return;
                        }
                        this.props.globalState.blockKeyboardEvents = false;
                    }}
            >
                <Toolbar/>
                <div className="image-container"
                    onDragOver={event => {
                        event.preventDefault();
                }}>
                    <TextureCanvasComponent/>
                </div>
            </div>
            <div className="blocker">
                    Texture Editor runs only on desktop
            </div>
            <div className="wait-screen hidden">
                Processing...please wait
            </div>
        </Portal>;
    }
}