import * as React from "react";
import { GlobalState } from '../globalState';
import { CommandButtonComponent } from './commandButtonComponent';

require("../scss/hamburgerMenu.scss");

interface IHamburgerMenuComponentProps {
    globalState: GlobalState;
}

export class HamburgerMenuComponent extends React.Component<IHamburgerMenuComponentProps> {    
  
    public constructor(props: IHamburgerMenuComponentProps) {
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

    public render() {
        return (
            <div className={"hambuger-menu " + (this.props.globalState.language === "JS" ? "background-js" : "background-ts")}>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Run" icon="play" isActive={true} onClick={()=> this.onPlay()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Save" icon="save" isActive={false} onClick={()=> this.onSave()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Download" icon="download" isActive={false} onClick={()=> this.onDownload()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Create new" icon="new" isActive={false} onClick={()=> this.onNew()}/>
                <CommandButtonComponent globalState={this.props.globalState} tooltip="Clear code" icon="clear" isActive={false} onClick={()=> this.onClear()}/>
            </div>
        );
    }
}