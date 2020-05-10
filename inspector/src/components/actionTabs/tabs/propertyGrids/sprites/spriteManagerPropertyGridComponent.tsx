import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LockObject } from "../lockObject";
import { LineContainerComponent } from '../../../lineContainerComponent';
import { GlobalState } from '../../../../globalState';
import { SpriteManager } from 'babylonjs/Sprites/spriteManager';
import { TextInputLineComponent } from '../../../lines/textInputLineComponent';
import { TextLineComponent } from '../../../lines/textLineComponent';
import { CheckBoxLineComponent } from '../../../lines/checkBoxLineComponent';
import { FloatLineComponent } from '../../../lines/floatLineComponent';
import { SliderLineComponent } from '../../../lines/sliderLineComponent';
import { RenderingManager } from 'babylonjs/Rendering/renderingManager';
import { TextureLinkLineComponent } from '../../../lines/textureLinkLineComponent';

interface ISpriteManagerPropertyGridComponentProps {
    globalState: GlobalState;
    spriteManager: SpriteManager;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class SpriteManagerPropertyGridComponent extends React.Component<ISpriteManagerPropertyGridComponentProps> {
    constructor(props: ISpriteManagerPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const spriteManager = this.props.spriteManager;

        return (
            <div className="pane">
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={spriteManager} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <TextLineComponent label="Unique ID" value={spriteManager.uniqueId.toString()} />
                    <FloatLineComponent label="Capacity" isInteger={true} target={spriteManager} propertyName="capacity" />
                    <TextureLinkLineComponent label="Texture" texture={spriteManager.texture} onSelectionChangedObservable={this.props.onSelectionChangedObservable}/>
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="PROPERTIES">
                    <CheckBoxLineComponent label="Pickable" target={spriteManager} propertyName="isPickable" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Fog enabled" target={spriteManager} propertyName="fogEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="No depth write" target={spriteManager} propertyName="disableDepthWrite" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Rendering group ID" decimalCount={0} target={spriteManager} propertyName="renderingGroupId" minimum={RenderingManager.MIN_RENDERINGGROUPS} maximum={RenderingManager.MAX_RENDERINGGROUPS - 1} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="DEFAULT SIZE">
                    <FloatLineComponent label="Cell width" isInteger={true} target={spriteManager} propertyName="cellWidth" min={0} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <FloatLineComponent label="Cell height" isInteger={true} target={spriteManager} propertyName="cellHeight" min={0} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                </LineContainerComponent>
            </div>
        );
    }
}