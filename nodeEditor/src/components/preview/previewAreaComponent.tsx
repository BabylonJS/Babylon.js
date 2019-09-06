
import * as React from "react";
import { GlobalState } from '../../globalState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStop, faPalette } from '@fortawesome/free-solid-svg-icons';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { DataStorage } from '../../dataStorage';

interface IPreviewAreaComponent {
    globalState: GlobalState;
    width: number;
}

export class PreviewAreaComponent extends React.Component<IPreviewAreaComponent> {

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

    render() {
        return (
            <>
                <div id="preview" style={{height: this.props.width + "px"}}>
                    <canvas id="preview-canvas"/>
                </div>                
                <div id="preview-config-bar">
                    <div onClick={() => this.changeAnimation()} className={"button"}>
                        <FontAwesomeIcon icon={this.props.globalState.rotatePreview ? faStop : faPlay} />
                    </div>
                    <div className={"button align"}>
                        <label htmlFor="color-picker" id="color-picker-label">
                            <FontAwesomeIcon icon={faPalette} />
                        </label>
                        <input ref="color-picker" id="color-picker" type="color" onChange={evt => this.changeBackground(evt.target.value)} />
                    </div>
                </div>
            </>
        );

    }
}