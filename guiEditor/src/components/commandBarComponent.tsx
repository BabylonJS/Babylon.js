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

    onPlay() {

    }

    onNew() {

    }

    onClear() {        

    }

    onSave() {

    }

    onDownload() {

    }

    onInspector() {

    }

    onExamples() {

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
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Run" icon="play" shortcut="Alt+Enter" isActive={true} onClick={()=> this.onPlay()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Save" icon="save" shortcut="Ctrl+S" isActive={false} onClick={()=> this.onSave()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Inspector" icon="inspector" isActive={false} onClick={()=> this.onInspector()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Download" icon="download" shortcut="Shift+Ctrl+S"isActive={false} onClick={()=> this.onDownload()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Create new" icon="new" isActive={false} onClick={()=> this.onNew()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Clear code" icon="clear" isActive={false} onClick={()=> this.onClear()}/>
                <CommandDropdownComponent globalState={this.props.globalState} icon="options" tooltip="Options" items={[
                    {
                        label: "Theme",
                        storeKey: "theme",
                        defaultValue: "Light",
                        subItems: [
                            "Light",
                            "Dark"
                        ],
                        onClick: () => {

                        }
                    },  
                    {
                        label: "Font size",
                        storeKey: "font-size",
                        defaultValue: "14",
                        subItems: [
                            "12",
                            "14",
                            "16",
                            "18",
                            "20",
                            "22",
                            "24",
                            "26",
                            "28",
                            "30",
                        ],
                        onClick: () => {

                        }
                    },
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
                </div>
                <div className="commands-right">
                    
                </div>
            </div>
        );
    }
}