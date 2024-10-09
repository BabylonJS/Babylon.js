import * as React from "react";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import type { DebugBlock } from "core/Meshes/Node/Blocks/debugBlock";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";

export class DebugPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onUpdateRequiredObserver: Nullable<Observer<any>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override componentDidMount() {
        this._onUpdateRequiredObserver = this.props.stateManager.onUpdateRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        this.props.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
    }

    override render() {
        const debugBlock = this.props.nodeData.data as DebugBlock;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="DEBUG INFOS">
                    {debugBlock.log.map((str, i) => {
                        return <TextLineComponent key={i} label={i + " >"} value={str[0]} tooltip={str[1]} />;
                    })}
                </LineContainerComponent>
            </div>
        );
    }
}
