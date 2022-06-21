import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { IPropertyComponentProps } from "../../sharedComponents/nodeGraphSystem/interfaces/propertyComponentProps";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { TransformBlock } from "core/Materials/Node/Blocks/transformBlock";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";

export class TransformPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    render() {
        return (
            <>
                <GeneralPropertyTabComponent globalState={this.props.globalState} data={this.props.data} />
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent
                        label="Transform as direction"
                        onSelect={(value) => {
                            const transformBlock = this.props.data as TransformBlock;
                            if (value) {
                                transformBlock.complementW = 0;
                            } else {
                                transformBlock.complementW = 1;
                            }
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                        }}
                        isSelected={() => (this.props.data as TransformBlock).complementW === 0}
                    />
                </LineContainerComponent>
            </>
        );
    }
}
