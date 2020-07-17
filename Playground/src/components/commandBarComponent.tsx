import * as React from "react";
import { GlobalState } from '../globalState';
import { CommandButtonComponent } from './commandButtonComponent';
import { CommandDropdownComponent } from './commandDropdownComponent';
import { Utilities } from '../tools/utilities';

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
        this.props.globalState.onRunRequiredObservable.notifyObservers();
    }

    onNew() {
        this.props.globalState.onNewRequiredObservable.notifyObservers();
    }

    onClear() {        
        this.props.globalState.onClearRequiredObservable.notifyObservers();
    }

    onSave() {
        this.props.globalState.onSaveRequiredObservable.notifyObservers();
    }

    onDownload() {
        this.props.globalState.onDownloadRequiredObservable.notifyObservers();
    }

    onInspector() {
        this.props.globalState.onInspectorRequiredObservable.notifyObservers();
    }

    onExamples() {
        this.props.globalState.onExamplesDisplayChangedObservable.notifyObservers();
    }

    public render() {
        let activeVersion = Utilities.ReadStringFromStore("version", "Latest");

        var versionOptions = Object.keys(Versions).map(key => {
            return {
                label: key,
                storeKey: "version",
                defaultValue: "Latest",
                isActive: activeVersion === key,
                onClick: () => {
                    Utilities.StoreStringToStore("version", key);
                    window.location.reload();
                }
            }
        });

        return (
            <div className={"commands " + (this.props.globalState.language === "JS" ? "background-js" : "background-ts")}>
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
                            this.props.globalState.onThemeChangedObservable.notifyObservers();
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
                            this.props.globalState.onFontSizeChangedObservable.notifyObservers();
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
                        onCheck: (value) => {this.props.globalState.onEditorDisplayChangedObservable.notifyObservers(value)}
                    }, {
                        label: "minimap",
                        storeKey: "minimap",
                        defaultValue: true,
                        onCheck: (value) => {this.props.globalState.onMinimapChangedObservable.notifyObservers(value)}
                    }, {
                        label: "fullscreen",
                        onClick: () => {this.props.globalState.onFullcreenRequiredObservable.notifyObservers()}
                    },                     {
                        label: "fullscreen editor",
                        onClick: () => {this.props.globalState.onEditorFullcreenRequiredObservable.notifyObservers()}
                    },                   {
                        label: "format code",
                        onClick: () => {this.props.globalState.onFormatCodeRequiredObservable.notifyObservers()}
                    },
                    {
                        label: "metadata",
                        onClick: () => {this.props.globalState.onDisplayMetadataObservable.notifyObservers(true)}
                    }
                ]}/>
                </div>
                <div className="commands-right">
                    <CommandDropdownComponent globalState={this.props.globalState} icon="version" tooltip="Versions" toRight={true} items={versionOptions} />                    
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Examples" icon="examples" onClick={()=> this.onExamples()} isActive={false}/>
                </div>
            </div>
        );
    }
}