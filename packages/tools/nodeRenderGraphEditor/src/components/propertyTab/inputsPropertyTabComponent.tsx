import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";

import "./propertyTab.scss";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { NodeRenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";

interface IInputsPropertyTabComponentProps {
    globalState: GlobalState;
    inputs: NodeRenderGraphInputBlock[];
    lockObject: LockObject;
}

export class InputsPropertyTabComponent extends React.Component<IInputsPropertyTabComponentProps> {
    constructor(props: IInputsPropertyTabComponentProps) {
        super(props);
    }

    processInputBlockUpdate() {
        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    renderInputBlock(block: NodeRenderGraphInputBlock) {
        switch (block.type) {
            case NodeRenderGraphBlockConnectionPointTypes.Texture: {
                return <div key={block.uniqueId}></div>;
            }
        }
        return null;
    }

    override render() {
        return (
            <LineContainerComponent title="INPUTS">
                {this.props.inputs.map((ib) => {
                    if (!ib.name) {
                        return null;
                    }
                    return this.renderInputBlock(ib);
                })}
            </LineContainerComponent>
        );
    }
}
