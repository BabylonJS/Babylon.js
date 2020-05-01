
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { LightInformationBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/lightInformationBlock';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';

export class LightInformationPropertyTabComponent extends React.Component<IPropertyComponentProps> {

    render() {
        let scene = this.props.globalState.nodeMaterial!.getScene();
        var lightOptions = scene.lights.map(l => {
            return { label: l.name, value: l.name }
        });
        
        let lightInformationBlock = this.props.block as LightInformationBlock;

        return (
            <div>               
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
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