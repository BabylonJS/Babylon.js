import * as React from "react";
import { GlobalState } from '../globalState';
import { CommandButtonComponent } from './commandButtonComponent';

import HambugerButton from "../imgs/hamburger.svg";

require("../scss/hamburgerMenu.scss");

interface IHamburgerMenuComponentProps {
    globalState: GlobalState;
}

export class HamburgerMenuComponent extends React.Component<IHamburgerMenuComponentProps, {isExpanded: boolean}> {    
  
    public constructor(props: IHamburgerMenuComponentProps) {
        super(props);
        this.state = {isExpanded: false};
    }    

    onPlay() {
        this.props.globalState.onRunRequiredObservable.notifyObservers();
        this.setState({isExpanded: false});
    }

    onNew() {
        this.props.globalState.onNewRequiredObservable.notifyObservers();
        this.setState({isExpanded: false});
    }

    onClear() {        
        this.props.globalState.onClearRequiredObservable.notifyObservers();
        this.setState({isExpanded: false});
    }

    onSave() {
        this.props.globalState.onSaveRequiredObservable.notifyObservers();
        this.setState({isExpanded: false});
    }

    onDownload() {
        this.props.globalState.onDownloadRequiredObservable.notifyObservers();
        this.setState({isExpanded: false});
    }

    onInspector() {
        this.props.globalState.onInspectorRequiredObservable.notifyObservers(!this.props.globalState.inspectorIsOpened);
        this.setState({isExpanded: false});
    }

    onFormatCode() {
        this.props.globalState.onFormatCodeRequiredObservable.notifyObservers();
        this.setState({isExpanded: false});
    }

    onMetadata() {
        this.props.globalState.onDisplayMetadataObservable.notifyObservers(true);
        this.setState({isExpanded: false});
    }

    onExamples() {
        this.props.globalState.onExamplesDisplayChangedObservable.notifyObservers();
        this.setState({isExpanded: false});
    }

    switch() {
        this.setState({isExpanded: !this.state.isExpanded});
    }

    public render() {
        return (
            <>
                {
                    this.state.isExpanded && 
                    <div className="click-blocker" onClick={() => this.setState({isExpanded: false})}>                        
                    </div>
                }
                <div className={"hamburger-button " + (this.props.globalState.language === "JS" ? "background-js" : "background-ts")} onClick={() => this.switch()}>
                    <HambugerButton />
                </div>
                <div className={"hambuger-menu " + (this.props.globalState.language === "JS" ? "background-js" : "background-ts") + (this.state.isExpanded ? " expanded" : "")}>
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Run" icon="play" isActive={true} onClick={()=> this.onPlay()}/>
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Save" icon="save" isActive={false} onClick={()=> this.onSave()}/>
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Inspector" icon="inspector" isActive={false} onClick={()=> this.onInspector()}/>
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Download" icon="download" isActive={false} onClick={()=> this.onDownload()}/>
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Create new" icon="new" isActive={false} onClick={()=> this.onNew()}/>
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Clear code" icon="clear" isActive={false} onClick={()=> this.onClear()}/>
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Format code" icon="options" isActive={false} onClick={()=> this.onFormatCode()}/>
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Metadata" icon="options" isActive={false} onClick={()=> this.onMetadata()}/>
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Examples" icon="examples" onClick={()=> this.onExamples()} isActive={false}/>
                </div>
            </>
        );
    }
}