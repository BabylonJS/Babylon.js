import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { CustomPropertyGridComponent } from '../customPropertyGridComponent';
import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';

interface IParticleSystemPropertyGridComponentProps {
    globalState: GlobalState;
    system: IParticleSystem,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class ParticleSystemPropertyGridComponent extends React.Component<IParticleSystemPropertyGridComponentProps> {
    constructor(props: IParticleSystemPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const system = this.props.system;

        return (
            <div className="pane">
                <CustomPropertyGridComponent globalState={this.props.globalState} target={system}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="ID" value={system.id} />
                    <TextLineComponent label="Class" value={system.getClassName()} />                    
                  
                </LineContainerComponent>                
            </div>
        );
    }
}