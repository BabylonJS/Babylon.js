
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { LightNodeModel } from './lightNodeModel';
import { TextLineComponent } from '../../../sharedComponents/textLineComponent';
import { LineContainerComponent } from '../../../sharedComponents/lineContainerComponent';
import { TextInputLineComponent } from '../../../sharedComponents/textInputLineComponent';
import { OptionsLineComponent } from '../../../sharedComponents/optionsLineComponent';

interface ILightPropertyTabComponentProps {
    globalState: GlobalState;
    node: LightNodeModel;
}

export class LightPropertyTabComponent extends React.Component<ILightPropertyTabComponentProps> {

    render() {
        let scene = this.props.globalState.nodeMaterial!.getScene();
        var lightOptions = scene.lights.map(l => {
            return { label: l.name, value: l.name }
        });

        lightOptions.splice(0, 0, { label: "All", value: "" })

        return (
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextLineComponent label="Type" value="Light" />
                    <TextInputLineComponent label="Name" propertyName="name" target={this.props.node.block!} onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                </LineContainerComponent>

                <LineContainerComponent title="PROPERTIES">
                    <OptionsLineComponent label="Light" defaultIfNull={0} noDirectUpdate={true} valuesAreStrings={true} options={lightOptions} target={this.props.node.light} propertyName="name" onSelect={(name: any) => {
                        if (name === "") {
                            this.props.node.light = null;
                        } else {
                            this.props.node.light = scene.getLightByName(name);
                        }
                        this.forceUpdate();
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                    }} />
                </LineContainerComponent>
            </div>
        );
    }
}