import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { LightBlock } from "core/Materials/Node/Blocks/Dual/lightBlock";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { Light } from "core/Lights/light";
import type { GlobalState } from "../../globalState";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";

export class LightPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    override render() {
        const scene = (this.props.stateManager.data as GlobalState).nodeMaterial!.getScene();
        const lightOptions = scene.lights.map((l: Light) => {
            return { label: l.name, value: l.name };
        });

        lightOptions.splice(0, 0, { label: "All", value: "" });

        const lightBlock = this.props.nodeData.data as LightBlock;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <OptionsLine
                        label="Light"
                        defaultIfNull={0}
                        noDirectUpdate={true}
                        valuesAreStrings={true}
                        options={lightOptions}
                        target={lightBlock}
                        propertyName="name"
                        onSelect={(name: any) => {
                            if (name === "") {
                                lightBlock.light = null;
                            } else {
                                lightBlock.light = scene.getLightByName(name);
                            }
                            this.forceUpdate();
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
