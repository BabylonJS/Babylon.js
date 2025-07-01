import * as React from "react";
import { GeneralPropertyTabComponent, GenericPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { ParticleDebugBlock } from "core/Particles/Node/Blocks/particleDebugBlock";

export class DebugPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onUpdateRequiredObserver: Nullable<Observer<any>>;
    private _dataCollectedObserver: Nullable<Observer<ParticleDebugBlock>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override componentDidMount() {
        this._onUpdateRequiredObserver = this.props.stateManager.onUpdateRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        this._onUpdateRequiredObserver?.remove();
        this._onUpdateRequiredObserver = null;
        this._dataCollectedObserver?.remove();
        this._dataCollectedObserver = null;
    }

    override render() {
        const debugBlock = this.props.nodeData.data as ParticleDebugBlock;

        if (this._dataCollectedObserver) {
            this._dataCollectedObserver.remove();
        }

        this._dataCollectedObserver = debugBlock.onDataCollectedObservable.add((data) => {
            this.forceUpdate();
        });

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <GenericPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="DEBUG INFOS">
                    {debugBlock.log.map((str, i) => {
                        return <TextLineComponent key={i} label={i + " >"} value={str[0]} tooltip={str[1]} />;
                    })}
                </LineContainerComponent>
            </div>
        );
    }
}
