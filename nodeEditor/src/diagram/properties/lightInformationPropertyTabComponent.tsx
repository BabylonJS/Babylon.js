
import * as React from "react";
import { TextLineComponent } from '../../sharedComponents/textLineComponent';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { LightInformationBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/lightInformationBlock';

export class LightInformationPropertyTabComponent extends React.Component<IPropertyComponentProps> {

    render() {
        let scene = this.props.globalState.nodeMaterial!.getScene();
        var lightOptions = scene.lights.map(l => {
            return { label: l.name, value: l.name }
        });
        
        let lightInformationBlock = this.props.block as LightInformationBlock;

        return (
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextLineComponent label="Type" value="LightInformationBlock" />
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={lightInformationBlock} onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                </LineContainerComponent>

                <LineContainerComponent title="PROPERTIES">
                    <OptionsLineComponent label="Light" noDirectUpdate={true} valuesAreStrings={true} options={lightOptions} target={lightInformationBlock} propertyName="name" onSelect={(name: any) => {
                        lightInformationBlock.light = scene.getLightByName(name);
                        this.forceUpdate();
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                    }} />
                </LineContainerComponent>
            </div>
        );
    }
}