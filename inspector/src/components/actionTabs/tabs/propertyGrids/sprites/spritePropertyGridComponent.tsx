import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LockObject } from "../lockObject";
import { LineContainerComponent } from '../../../lineContainerComponent';
import { GlobalState } from '../../../../globalState';
import { TextInputLineComponent } from '../../../lines/textInputLineComponent';
import { TextLineComponent } from '../../../lines/textLineComponent';
import { Sprite } from 'babylonjs/Sprites/sprite';

interface ISpritePropertyGridComponentProps {
    globalState: GlobalState;
    sprite: Sprite,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class SpritePropertyGridComponent extends React.Component<ISpritePropertyGridComponentProps> {
    constructor(props: ISpritePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const sprite = this.props.sprite;

        return (
            <div className="pane">
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={sprite} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <TextLineComponent label="Unique ID" value={sprite.uniqueId.toString()} />
                </LineContainerComponent>
            </div>
        );
    }
}