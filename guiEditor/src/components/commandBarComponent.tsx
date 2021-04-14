import * as React from "react";
import { GlobalState } from '../globalState';
import { CommandButtonComponent } from './commandButtonComponent';
import { CommandDropdownComponent } from './commandDropdownComponent';
//import { Utilities } from '../tools/utilities';

require("../scss/commandBar.scss");

declare var Versions: any;

interface ICommandBarComponentProps {
    globalState: GlobalState;
}

export class CommandBarComponent extends React.Component<ICommandBarComponentProps> {    
  
    public constructor(props: ICommandBarComponentProps) {
        super(props);

    }    

    public render() {
        //let activeVersion = Utilities.ReadStringFromStore("version", "Latest");
        //let activeEngineVersion = Utilities.ReadStringFromStore("engineVersion", "WebGL2");

        /*if (location.href.indexOf("webgpu") !== -1 && !!navigator.gpu) {
;
        }

        var versionOptions = Object.keys(Versions).map(key => {
            return {
                label: key,
                storeKey: "version",
                isActive: true,
                onClick: () => {
                    window.location.reload();
                }
            }
        });

        var engineOptions = [
            {
                label: "WebGL2",
                storeKey: "engineVersion",
                isActive: true,
                onClick: () => {
                    window.location.reload();
                }
            },
            {
                label: "WebGL",
                storeKey: "engineVersion",
                isActive: true,
                onClick: () => {
                    window.location.reload();
                }
            }
        ];

        if (!!navigator.gpu) {
            engineOptions.splice(0,0, {
                label: "WebGPU",
                storeKey: "engineVersion",
                isActive: true,
                onClick: () => {
                    window.location.reload();
                }
            });
        }*/

        return (
            <div className={"commands "}>
                <div className="commands-left">
                <CommandDropdownComponent globalState={this.props.globalState} icon="Options" tooltip="Options" items={[
                    {
                        label: "Safe mode",
                        storeKey: "safe-mode",
                        defaultValue: false,
                        onCheck: () => {}
                    },                     
                    {
                        label: "CTRL+S to save",
                        storeKey: "ctrl-s-to-save",
                        defaultValue: true,
                        onCheck: () => {}
                    }, 
                    {
                        label: "editor",
                        storeKey: "editor",
                        defaultValue: true,
                        onCheck: (value) => {}
                    }, {
                        label: "minimap",
                        storeKey: "minimap",
                        defaultValue: true,
                        onCheck: (value) => {}
                    }, {
                        label: "fullscreen",
                        onClick: () => {}
                    },                     {
                        label: "fullscreen editor",
                        onClick: () => {}
                    },                   {
                        label: "format code",
                        onClick: () => {}
                    },
                    {
                        label: "metadata",
                        onClick: () => {}
                    },
                    {
                        label: "QR code",
                        onClick: () => {}
                    },                 
                    {
                        label: "Load Unity Toolkit",
                        storeKey: "unity-toolkit",
                        defaultValue: false,
                        onCheck: () => {}
                    }, 
                ]}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Select" icon="play" shortcut="Alt+Enter" isActive={true} onClick={()=> this.onSelect()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Pan" icon="save" shortcut="Ctrl+S" isActive={false} onClick={()=> this.onPan()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Zoom" icon="inspector" isActive={false} onClick={()=> this.onZoom()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Create" icon="download" shortcut="Shift+Ctrl+S"isActive={false} onClick={()=> this.onCreate()}/>
                </div>
                <div className="commands-right">
                    
                </div>
            </div>
        );
    }
    onCreate(): void {
        throw new Error("Method not implemented.");
    }
    onZoom(): void {
        throw new Error("Method not implemented.");
    }
    onPan(): void {
        throw new Error("Method not implemented.");
    }
    onSelect(): void {
        throw new Error("Method not implemented.");
    }
}