import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import type { RenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphBlockConnectionPointTypes";

export class InputPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onValueChangedObserver: Nullable<Observer<RenderGraphInputBlock>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override componentDidMount() {
        const inputBlock = this.props.nodeData.data as RenderGraphInputBlock;
        this._onValueChangedObserver = inputBlock.onValueChangedObservable.add(() => {
            this.forceUpdate();
            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
        });
    }

    override componentWillUnmount() {
        const inputBlock = this.props.nodeData.data as RenderGraphInputBlock;
        if (this._onValueChangedObserver) {
            inputBlock.onValueChangedObservable.remove(this._onValueChangedObserver);
            this._onValueChangedObserver = null;
        }
    }

    renderValue(_globalState: GlobalState) {
        const inputBlock = this.props.nodeData.data as RenderGraphInputBlock;
        switch (inputBlock.type) {
            case NodeRenderGraphBlockConnectionPointTypes.Texture: {
                return (
                    <>
                        <CheckBoxLineComponent label="Is external" target={inputBlock} propertyName={"isExternal"}></CheckBoxLineComponent>
                    </>
                );
            }
        }

        return null;
    }

    setDefaultValue() {
        const inputBlock = this.props.nodeData.data as RenderGraphInputBlock;
        inputBlock.setDefaultValue();
    }

    override render() {
        const inputBlock = this.props.nodeData.data as RenderGraphInputBlock;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    {this.renderValue(this.props.stateManager.data as GlobalState)}
                    <CheckBoxLineComponent label="Visible on frame" target={inputBlock} propertyName={"visibleOnFrame"}></CheckBoxLineComponent>
                </LineContainerComponent>
            </div>
        );
    }
}
