
import * as React from "react";
import { TextLineComponent } from '../../sharedComponents/textLineComponent';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { LightBlock } from 'babylonjs';

export class LightPropertyTabComponent extends React.Component<IPropertyComponentProps> {

    render() {
        let scene = this.props.globalState.nodeMaterial!.getScene();
        var lightOptions = scene.lights.map(l => {
            return { label: l.name, value: l.name }
        });

        lightOptions.splice(0, 0, { label: "All", value: "" })

        let lightBlock = this.props.block as LightBlock;

        return (
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextLineComponent label="Type" value="LightBlock" />
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={lightBlock} onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                </LineContainerComponent>

                <LineContainerComponent title="PROPERTIES">
                    <OptionsLineComponent label="Light" defaultIfNull={0} noDirectUpdate={true} valuesAreStrings={true} options={lightOptions} target={lightBlock} propertyName="name" onSelect={(name: any) => {
                        if (name === "") {
                            lightBlock.light = null;
                        } else {
                            lightBlock.light = scene.getLightByName(name);
                        }
                        this.forceUpdate();
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                    }} />
                </LineContainerComponent>
            </div>
        );
    }
}