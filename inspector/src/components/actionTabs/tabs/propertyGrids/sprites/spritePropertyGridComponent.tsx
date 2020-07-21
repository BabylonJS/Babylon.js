import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LockObject } from "../lockObject";
import { LineContainerComponent } from '../../../lineContainerComponent';
import { GlobalState } from '../../../../globalState';
import { TextInputLineComponent } from '../../../lines/textInputLineComponent';
import { TextLineComponent } from '../../../lines/textLineComponent';
import { Sprite } from 'babylonjs/Sprites/sprite';
import { CheckBoxLineComponent } from '../../../lines/checkBoxLineComponent';
import { Vector3LineComponent } from '../../../lines/vector3LineComponent';
import { Color4LineComponent } from '../../../lines/color4LineComponent';
import { FloatLineComponent } from '../../../lines/floatLineComponent';
import { SliderLineComponent } from '../../../lines/sliderLineComponent';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { TextureHelper } from '../../../../../textureHelper';
import { Nullable } from 'babylonjs/types';

interface ISpritePropertyGridComponentProps {
    globalState: GlobalState;
    sprite: Sprite;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;    
    onSelectionChangedObservable?: Observable<any>;
}

export class SpritePropertyGridComponent extends React.Component<ISpritePropertyGridComponentProps> {
    private canvasRef: React.RefObject<HTMLCanvasElement>;
    private imageData: Nullable<Uint8Array> = null;
    private cachedCellIndex = -1;

    constructor(props: ISpritePropertyGridComponentProps) {
        super(props);
        
        this.canvasRef = React.createRef();
    }

    onManagerLink() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        
        const sprite = this.props.sprite;
        this.props.onSelectionChangedObservable.notifyObservers(sprite.manager);
    }

    switchPlayStopState() {        
        const sprite = this.props.sprite;

        if (sprite.animationStarted) {
            sprite.stopAnimation();
        } else {
            sprite.playAnimation(sprite.fromIndex, sprite.toIndex, sprite.loopAnimation, sprite.delay, () => {});
        }

        this.forceUpdate();
    }

    disposeSprite() {
        const sprite = this.props.sprite;
        sprite.dispose();

        this.props.globalState.onCodeChangedObservable.notifyObservers({
            object: sprite,
            code: `TARGET.dispose();`
        });

        this.props.onSelectionChangedObservable?.notifyObservers(null);
    }

    componentDidMount() {
        this.updatePreview();
    }

    componentDidUpdate() {
        this.updatePreview();
    }

    shouldComponentUpdate(nextProps: ISpritePropertyGridComponentProps) {
        if (nextProps.sprite !== this.props.sprite) {
            this.imageData = null;
        }

        return true;
    }

    updatePreview() {        
        const sprite = this.props.sprite;        
        const manager = sprite.manager;
        var texture = manager.texture;
        var size = texture.getSize();

        if (!this.imageData) {
            TextureHelper.GetTextureDataAsync(texture, size.width, size.height, 0, {R: true, G:true, B:true, A:true}, this.props.globalState).then(data => {
                this.imageData = data;
                this.forceUpdate();
            });

            return;
        }

        if (this.cachedCellIndex === sprite.cellIndex) {
            return;
        }

        this.cachedCellIndex = sprite.cellIndex;

        const previewCanvas = this.canvasRef.current as HTMLCanvasElement;
        previewCanvas.width = manager.cellWidth;
        previewCanvas.height = manager.cellHeight;
        var context = previewCanvas.getContext('2d');

        if (context) {
            // Copy the pixels to the preview canvas
            var imageData = context.createImageData(manager.cellWidth, manager.cellHeight);
            var castData = imageData.data;

            let rowLength = size.width / manager.cellWidth | 0;
            let offsetY = sprite.cellIndex / rowLength | 0;
            let offsetX = sprite.cellIndex - offsetY * rowLength;
            let offset = (offsetX + offsetY * size.width) * 4 * manager.cellWidth ;

            for (var x = 0; x < manager.cellWidth; x++) {
                for (var y = 0; y < manager.cellHeight; y++) {
                    let targetCoord = (x + y * manager.cellWidth) * 4;
                    let sourceCoord = (x + y * size.width) * 4
                    castData[targetCoord] = this.imageData[offset + sourceCoord];
                    castData[targetCoord + 1] = this.imageData[offset + sourceCoord + 1];
                    castData[targetCoord + 2] = this.imageData[offset + sourceCoord + 2];
                    castData[targetCoord + 3] = this.imageData[offset + sourceCoord + 3];
                }
            }

            context.putImageData(imageData, 0, 0);
        }
    }

    render() {
        const sprite = this.props.sprite;
        const manager = sprite.manager;
        const textureSize = manager.texture.getSize();
        let maxCellCount = 0;
        
        if (!textureSize.width || !textureSize.height) {
            maxCellCount = Math.max(sprite.fromIndex, sprite.toIndex);
        } else {
            maxCellCount = (textureSize.width / manager.cellWidth) * (textureSize.height / manager.cellHeight);
        }

        return (
            <div className="pane">
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={sprite} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <TextLineComponent label="Unique ID" value={sprite.uniqueId.toString()} />
                    <TextLineComponent label="Link to manager" value={manager.name} onLink={() => this.onManagerLink()} />
                    <CheckBoxLineComponent label="Visible" target={sprite} propertyName="isVisible" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <ButtonLineComponent label="Dispose" onClick={() => this.disposeSprite()} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="PROPERTIES">
                    <Vector3LineComponent label="Position" target={sprite} propertyName="position" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Pickable" target={sprite} propertyName="isPickable" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Use alpha for picking" target={sprite} propertyName="useAlphaForPicking" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <Color4LineComponent label="Color" target={sprite} propertyName="color" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent useEuler={this.props.globalState.onlyUseEulers} label="Angle" target={sprite} propertyName="angle" minimum={0} maximum={2 * Math.PI} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="CELL">
                    <canvas ref={this.canvasRef} className="preview" style={{
                        margin: "auto",
                        marginTop: "4px",
                        marginBottom: "4px",
                        display: "grid",
                        height: "108px"
                    }}/>
                    <SliderLineComponent label="Cell index" decimalCount={0} target={sprite} propertyName="cellIndex" minimum={0} maximum={maxCellCount} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} 
                        onChange={() => this.forceUpdate()}
                        />
                    <CheckBoxLineComponent label="Invert U axis" target={sprite} propertyName="invertU" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Invert V axis" target={sprite} propertyName="invertV" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="SCALE">
                    <FloatLineComponent label="Width" target={sprite} propertyName="width" min={0} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <FloatLineComponent label="Height" target={sprite} propertyName="height" min={0} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="ANIMATION">
                    <SliderLineComponent label="Start cell" decimalCount={0} target={sprite} propertyName="fromIndex" minimum={0} maximum={maxCellCount} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="End cell" decimalCount={0} target={sprite} propertyName="toIndex" minimum={0} maximum={maxCellCount} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Loop" target={sprite} propertyName="loopAnimation" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent label="Delay" target={sprite} propertyName="delay" digits={0} min={0} isInteger={true} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <ButtonLineComponent label={sprite.animationStarted ? "Stop" : "Start"} onClick={() => this.switchPlayStopState()} />
                </LineContainerComponent>
            </div>
        );
    }
}