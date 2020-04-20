
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { TransformBlock } from 'babylonjs/Materials/Node/Blocks/transformBlock';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';

export class TransformPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    render() {
        return (
            <>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent label="Transform as direction" onSelect={value => {
                        let transformBlock = this.props.block as TransformBlock;
                        if (value) {
                            transformBlock.complementW = 0;
                        } else {
                            transformBlock.complementW = 1;
                        }
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                    }} isSelected={() => (this.props.block as TransformBlock).complementW === 0} />
                </LineContainerComponent>            
            </>
        );
    }
}