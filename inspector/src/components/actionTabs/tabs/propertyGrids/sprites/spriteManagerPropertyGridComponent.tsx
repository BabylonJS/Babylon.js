import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LockObject } from "../lockObject";
import { LineContainerComponent } from '../../../lineContainerComponent';
import { GlobalState } from '../../../../globalState';
import { SpriteManager } from 'babylonjs/Sprites/spriteManager';
import { TextInputLineComponent } from '../../../lines/textInputLineComponent';
import { TextLineComponent } from '../../../lines/textLineComponent';

interface ISpriteManagerPropertyGridComponentProps {
    globalState: GlobalState;
    spriteManager: SpriteManager,
    lockObject: LockObject,
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
                </LineContainerComponent>
            </div>
        );
    }
}