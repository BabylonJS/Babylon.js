import * as React from "react";
import { GlobalState } from '../globalState';
import { FooterButton } from './footerButton';
import { DropUpButton } from './dropUpButton';
import { EnvironmentTools } from '../tools/environmentTools';
import { FooterFileButton } from './footerFileButton';

require("../scss/footer.scss");
var babylonIdentity = require("../img/babylon-identity.svg");
var iconEdit = require("../img/icon-edit.svg");
var iconOpen = require("../img/icon-open.svg");
var iconIBL = require("../img/icon-ibl.svg");

interface IFooterProps {
    globalState: GlobalState;
}

export class Footer extends React.Component<IFooterProps> {
    
        
    public constructor(props: IFooterProps) {    
        super(props);
        props.globalState.onSceneLoaded.add(info => {
            this.forceUpdate();
        });
    }

    showInspector() {
        if (this.props.globalState.currentScene) {
            if (this.props.globalState.currentScene.debugLayer.isVisible()) {
                this.props.globalState.hideDebugLayer();
            }
            else {
                this.props.globalState.showDebugLayer();
            }
        }
    }

    render() {
        return (            
            <div id="footer" className="footer">
                <div className="footerLeft">
                    <img id="logoImg" src={babylonIdentity}/>
                </div>
                <div className="footerRight">
                    <FooterFileButton globalState={this.props.globalState} 
                                enabled={true}
                                icon={iconOpen}
                                onFilesPicked={(evt, files) => {
                                    this.props.globalState.filesInput.loadFiles(evt);
                                }}
                                label="Open your scene from your hard drive (.babylon, .gltf, .glb, .obj)"/>
                    <DropUpButton globalState={this.props.globalState} 
                                    icon={iconIBL}
                                    label="Select environment"
                                    options={EnvironmentTools.SkyboxesNames}
                                    onOptionPicked={option => this.props.globalState.onEnvironmentChanged.notifyObservers(option)}
                                    enabled={!!this.props.globalState.currentScene}/>
                    <FooterButton globalState={this.props.globalState} 
                                    icon={iconEdit}
                                    label="Display inspector"
                                    onClick={() => this.showInspector()}
                                    enabled={!!this.props.globalState.currentScene}/>
                </div>
            </div>
        )
    }
}