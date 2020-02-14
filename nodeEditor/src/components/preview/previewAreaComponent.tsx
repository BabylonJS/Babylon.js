
import * as React from "react";
import { GlobalState } from '../../globalState';
import { DataStorage } from '../../dataStorage';

const doubleSided: string = require("./svgs/doubleSided.svg");
const depthPass: string = require("./svgs/depthPass.svg");
const omni: string = require("./svgs/omni.svg");
const directionalRight: string = require("./svgs/directionalRight.svg");
const directionalLeft: string = require("./svgs/directionalLeft.svg");

interface IPreviewAreaComponentProps {
    globalState: GlobalState;
    width: number;
}

export class PreviewAreaComponent extends React.Component<IPreviewAreaComponentProps, {isLoading: boolean}> {

    constructor(props: IPreviewAreaComponentProps) {
        super(props);

        this.state = {isLoading: true};

        this.props.globalState.onIsLoadingChanged.add(state => this.setState({isLoading: state}));
    }

    changeBackFaceCulling(value: boolean) {        
        this.props.globalState.backFaceCulling = value;
        DataStorage.StoreBoolean("BackFaceCulling", value);
        this.props.globalState.onBackFaceCullingChanged.notifyObservers();
        this.forceUpdate();
    }

    changeDepthPrePass(value: boolean) {        
        this.props.globalState.depthPrePass = value;
        DataStorage.StoreBoolean("DepthPrePass", value);
        this.props.globalState.onDepthPrePassChanged.notifyObservers();
        this.forceUpdate();
    }    

    render() {
        return (
            <>
                <div id="preview" style={{height: this.props.width + "px"}}>
                    <canvas id="preview-canvas"/>
                    {                        
                        <div className={"waitPanel" + (this.state.isLoading ? "" : " hidden")}>
                            Please wait, loading...
                        </div>
                    }
                </div>                
                <div id="preview-config-bar">              
                    <div
                        title="Render without back face culling"
                        onClick={() => this.changeBackFaceCulling(!this.props.globalState.backFaceCulling)} className={"button back-face" + (!this.props.globalState.backFaceCulling ? " selected" : "")}>
                        <img src={doubleSided} alt=""/>
                    </div>
                    <div
                        title="Render with depth pre-pass"
                        onClick={() => this.changeDepthPrePass(!this.props.globalState.depthPrePass)} className={"button depth-pass" + (this.props.globalState.depthPrePass ? " selected" : "")}>
                            <img src={depthPass} alt=""/>
                    </div>
                    <div
                        title="Turn on/off hemispheric light"  
                        onClick={() => {
                            this.props.globalState.hemisphericLight = !this.props.globalState.hemisphericLight;                            
                            DataStorage.StoreBoolean("HemisphericLight", this.props.globalState.hemisphericLight);
                            this.props.globalState.onLightUpdated.notifyObservers();
                            this.forceUpdate();
                        }} className={"button hemispheric-light" + (this.props.globalState.hemisphericLight ? " selected" : "")}>
                        <img src={omni} alt=""/>
                    </div>
                    <div
                        title="Turn on/off direction light #1"  
                        onClick={() => {
                            this.props.globalState.directionalLight1 = !this.props.globalState.directionalLight1;                       
                            DataStorage.StoreBoolean("DirectionalLight1", this.props.globalState.directionalLight1);
                            this.props.globalState.onLightUpdated.notifyObservers();
                            this.forceUpdate();
                        }} className={"button direction-light-1" + (this.props.globalState.directionalLight1 ? " selected" : "")}>
                        <img src={directionalRight} alt=""/>

                    </div>
                    <div
                        title="Turn on/off direction light #0"  
                        onClick={() => {
                            this.props.globalState.directionalLight0 = !this.props.globalState.directionalLight0;                       
                            DataStorage.StoreBoolean("DirectionalLight0", this.props.globalState.directionalLight0);
                            this.props.globalState.onLightUpdated.notifyObservers();
                            this.forceUpdate();
                        }} className={"button direction-light-0" + (this.props.globalState.directionalLight0 ? " selected" : "")}>
                        <img src={directionalLeft} alt=""/>
                    </div>
                </div>
            </>
        );

    }
}