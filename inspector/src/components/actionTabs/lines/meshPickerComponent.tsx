import * as React from "react";
import { GlobalState } from '../../globalState';
import { Observable } from 'babylonjs/Misc/observable';
import { PropertyChangedEvent } from '../../propertyChangedEvent';
import { Scene } from 'babylonjs/scene';
import { OptionsLineComponent } from './optionsLineComponent';
import { AbstractMesh } from 'babylonjs/Meshes/abstractMesh';


interface IMeshPickerComponentProps {
    globalState: GlobalState;
    target: any,
    property: string,
    scene: Scene,
    label: string,
    replaySourceReplacement?: string,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class MeshPickerComponent extends React.Component<IMeshPickerComponentProps> {
    constructor(props: IMeshPickerComponentProps) {
        super(props);

    }

    render() {
        var meshEmitters = this.props.scene.meshes.filter(m => !!m.name);
        meshEmitters.sort((a, b) => a.name.localeCompare(b.name));

        var emitterOptions = [
            { label: "None", value: -1 },
        ];

        meshEmitters.sort((a, b) => a.name.localeCompare(b.name));

        emitterOptions.push(...meshEmitters.map((v, i) => {
            return {label: v.name, value: i}
        }));           
        return (
            <>       
              <OptionsLineComponent 
                        label={this.props.label}
                        options={emitterOptions} 
                        target={this.props.target}
                        propertyName={this.props.property}
                        noDirectUpdate={true}
                        onSelect={(value: number) => {
                            const currentState = this.props.target[this.props.property];
                            switch(value) {
                                case -1:
                                    this.props.target[this.props.property] = null;
                                    break;
                                default:
                                    this.props.target[this.props.property] = meshEmitters[value];
                            }

                            if (this.props.onPropertyChangedObservable) {                   
                                this.props.onPropertyChangedObservable.notifyObservers({
                                    object: this.props.replaySourceReplacement ?? this.props.target,
                                    property: this.props.property,
                                    value: this.props.target[this.props.property],
                                    initialValue: currentState
                                });
                            }

                            this.forceUpdate();
                        }}
                        extractValue={() => {
                            if (!this.props.target[this.props.property]) {
                                return -1;
                            }

                            let meshIndex = meshEmitters.indexOf(this.props.target[this.props.property] as AbstractMesh)

                            if (meshIndex > -1) {
                                return meshIndex;
                            }

                            return -1;
                        }}
                />               
            </>
        );
    }
}