import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { LightInformationBlock } from "core/Materials/Node/Blocks/Vertex/lightInformationBlock";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { Light } from "core/Lights/light";
import type { GlobalState } from "../../globalState";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";

export class LightInformationPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    render() {
        const scene = (this.props.stateManager.data as GlobalState).nodeMaterial!.getScene();
        const lightOptions = scene.lights.map((l: Light) => {
            return { label: l.name, value: l.name };
        });

        const lightInformationBlock = this.props.nodeData.data as LightInformationBlock;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <OptionsLineComponent
                        label="Light"
                        noDirectUpdate={true}
                        valuesAreStrings={true}
                        options={lightOptions}
                        target={lightInformationBlock}
                        propertyName="name"
                        extractValue={(target: LightInformationBlock) => target.light!.name}
                        onSelect={(name: any) => {
                            lightInformationBlock.light = scene.getLightByName(name);
                            this.forceUpdate();
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers(true);
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
