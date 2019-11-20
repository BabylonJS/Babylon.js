
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { TransformBlock } from 'babylonjs/Materials/Node/Blocks/transformBlock';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';

export class TransformPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    render() {
        return (
            <>
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={this.props.block} onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                    <TextLineComponent label="Type" value={this.props.block.getClassName()} />
                </LineContainerComponent>
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