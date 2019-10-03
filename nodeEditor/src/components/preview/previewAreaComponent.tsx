
import * as React from "react";
import { GlobalState } from '../../globalState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStop, faPalette, faCheckDouble, faSun, faLocationArrow, faClone } from '@fortawesome/free-solid-svg-icons';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { DataStorage } from '../../dataStorage';

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

    changeAnimation() {
        this.props.globalState.rotatePreview = !this.props.globalState.rotatePreview;
        this.props.globalState.onAnimationCommandActivated.notifyObservers();
        this.forceUpdate();
    }

    changeBackground(value: string) {
        const newColor = Color3.FromHexString(value);

        DataStorage.StoreNumber("BackgroundColorR", newColor.r);
        DataStorage.StoreNumber("BackgroundColorG", newColor.g);
        DataStorage.StoreNumber("BackgroundColorB", newColor.b);

        this.props.globalState.backgroundColor = Color4.FromColor3(newColor, 1.0);
        this.props.globalState.onPreviewBackgroundChanged.notifyObservers();
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
                        title="Turn-table animation"
                        onClick={() => this.changeAnimation()} className={"button"}>
                        <FontAwesomeIcon icon={this.props.globalState.rotatePreview ? faStop : faPlay} />
                    </div>
                    <div 
                        title="Background color"
                        className={"button align"}>
                        <label htmlFor="color-picker" id="color-picker-label">
                            <FontAwesomeIcon icon={faPalette} />
                        </label>
                        <input ref="color-picker" id="color-picker" type="color" onChange={evt => this.changeBackground(evt.target.value)} />
                    </div>                        
                    <div
                        title="Render without back face culling"
                        onClick={() => this.changeBackFaceCulling(!this.props.globalState.backFaceCulling)} className={"button" + (!this.props.globalState.backFaceCulling ? " selected" : "")}>
                        <FontAwesomeIcon icon={faCheckDouble} />
                    </div>  
                    <div
                        title="Render with depth pre-pass"
                        onClick={() => this.changeDepthPrePass(!this.props.globalState.depthPrePass)} className={"button" + (this.props.globalState.depthPrePass ? " selected" : "")}>
                        <FontAwesomeIcon icon={faClone} />
                    </div>                     
                    <div
                        title="Turn on/off hemispheric light"  
                        onClick={() => {
                            this.props.globalState.hemisphericLight = !this.props.globalState.hemisphericLight;                            
                            DataStorage.StoreBoolean("HemisphericLight", this.props.globalState.hemisphericLight);
                            this.props.globalState.onLightUpdated.notifyObservers();
                            this.forceUpdate();
                        }} className={"button" + (this.props.globalState.hemisphericLight ? " selected" : "")}>
                        <FontAwesomeIcon icon={faSun} />
                    </div>    
                    <div
                        title="Turn on/off direction light #0"  
                        onClick={() => {
                            this.props.globalState.directionalLight0 = !this.props.globalState.directionalLight0;                       
                            DataStorage.StoreBoolean("DirectionalLight0", this.props.globalState.directionalLight0);
                            this.props.globalState.onLightUpdated.notifyObservers();
                            this.forceUpdate();
                        }} className={"button" + (this.props.globalState.directionalLight0 ? " selected" : "")}>
                        <FontAwesomeIcon icon={faLocationArrow} />
                    </div>      
                    <div
                        title="Turn on/off direction light #1"  
                        onClick={() => {
                            this.props.globalState.directionalLight1 = !this.props.globalState.directionalLight1;                       
                            DataStorage.StoreBoolean("DirectionalLight1", this.props.globalState.directionalLight1);
                            this.props.globalState.onLightUpdated.notifyObservers();
                            this.forceUpdate();
                        }} className={"button" + (this.props.globalState.directionalLight1 ? " selected" : "")}>
                        <FontAwesomeIcon icon={faLocationArrow} />
                    </div>               
                </div>
            </>
        );

    }
}