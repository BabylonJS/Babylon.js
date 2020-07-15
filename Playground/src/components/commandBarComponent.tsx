import * as React from "react";
import { GlobalState } from '../globalState';
import { CommandButtonComponent } from './commandButtonComponent';
import { CommandDropdownComponent } from './commandDropdownComponent';

require("../scss/commandBar.scss");

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

    public render() {
        return (
            <div className={"commands " + (this.props.globalState.language === "JS" ? "background-js" : "background-ts")}>
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
                        onClick: () => {}
                    },  {
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
        );
    }
}