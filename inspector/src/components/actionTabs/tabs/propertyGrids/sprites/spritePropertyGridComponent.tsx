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

interface ISpritePropertyGridComponentProps {
    globalState: GlobalState;
    sprite: Sprite;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;    
    onSelectionChangedObservable?: Observable<any>;
}

export class SpritePropertyGridComponent extends React.Component<ISpritePropertyGridComponentProps> {
    constructor(props: ISpritePropertyGridComponentProps) {
        super(props);
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