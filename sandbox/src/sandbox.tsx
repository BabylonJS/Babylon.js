import * as React from "react";
import * as ReactDOM from "react-dom";
import { GlobalState } from './globalState';
import { RenderingZone } from './components/renderingZone';

require("./main.scss");
var fullScreenLogo = require("./img/logo-fullscreen.svg")

interface ISandboxProps {
}

export class Sandbox extends React.Component<ISandboxProps> {
    private _globalState: GlobalState;
    private _assetUrl?: string;
    private _logoRef: React.RefObject<HTMLImageElement>;    
    private _dropTextRef: React.RefObject<HTMLDivElement>;
    
    public constructor(props: ISandboxProps) {
        super(props);
        this._globalState = new GlobalState();
        this._logoRef = React.createRef();
        this._dropTextRef = React.createRef();

        this._globalState.onSceneLoaded.add(info => {
            document.title = "Babylon.js - " + info.filename;

            let currentScene = info.scene;
            if (currentScene.meshes.length === 0 && currentScene.clearColor.r === 1 && currentScene.clearColor.g === 0 && currentScene.clearColor.b === 0) {
                this._logoRef.current!.className = "";
            }
            else {
                this._logoRef.current!.className = "hidden";
                this._dropTextRef.current!.className = "hidden";
            }
        });

        this._globalState.onError.add(scene => {
            scene.debugLayer.show();
        });
    }

    checkUrl() {
        // Check URL
        var indexOf = location.href.indexOf("?");
        if (indexOf !== -1) {
            var params = location.href.substr(indexOf + 1).split("&");
            for (var index = 0; index < params.length; index++) {
                var param = params[index].split("=");
                var name = param[0];
                var value = param[1];
                switch (name) {
                    case "assetUrl": {
                        this._assetUrl = value;
                        break;
                    }
                    // case "cameraPosition": {
                    //     cameraPosition = BABYLON.Vector3.FromArray(value.split(",").map(function(component) { return +component; }));
                    //     break;
                    // }
                    // case "kiosk": {
                    //     kiosk = value === "true" ? true : false;
                    //     break;
                    // }
                }
            }
        }
    }

    public render() {
        this.checkUrl();

        return (
            <div id="root">
                <p id="droptext" ref={this._dropTextRef}>Drag and drop gltf, glb, obj or babylon files to view them</p>
                <RenderingZone globalState={this._globalState} assetUrl={this._assetUrl}/>
                <div id="logoContainer">
                    <img id="logo" src={fullScreenLogo} ref={this._logoRef}/>
                </div>                
            </div>   
        )
    }

    public static Show(hostElement: HTMLElement) {
        const sandBox = React.createElement(Sandbox, {
        });
        
        ReactDOM.render(sandBox, hostElement);
    }
}