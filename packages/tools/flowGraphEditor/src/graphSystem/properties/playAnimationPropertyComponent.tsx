import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { GeneralPropertyTabComponent, DataConnectionsPropertyTabComponent, GenericPropertyTabComponent } from "./genericNodePropertyComponent";
import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { GlobalState } from "../../globalState";
import type { SceneContext } from "../../sceneContext";
import type { Observer } from "core/Misc/observable";

interface IPlayAnimationPropertyState {
    sceneContext: SceneContext | null;
}

/**
 * Property panel for FlowGraphPlayAnimationBlock.
 * Adds an AnimationGroup picker from the loaded scene context.
 */
export class PlayAnimationPropertyComponent extends React.Component<IPropertyComponentProps, IPlayAnimationPropertyState> {
    private _sceneContextObserver: Observer<SceneContext | null> | null = null;

    constructor(props: IPropertyComponentProps) {
        super(props);
        const globalState = props.stateManager.data as GlobalState;
        this.state = { sceneContext: globalState.sceneContext };
    }

    override componentDidMount() {
        const globalState = this.props.stateManager.data as GlobalState;
        this._sceneContextObserver = globalState.onSceneContextChanged.add((ctx) => {
            this.setState({ sceneContext: ctx });
        });
    }

    override componentWillUnmount() {
        const globalState = this.props.stateManager.data as GlobalState;
        if (this._sceneContextObserver) {
            globalState.onSceneContextChanged.remove(this._sceneContextObserver);
            this._sceneContextObserver = null;
        }
    }

    private _getBlock(): FlowGraphBlock {
        return this.props.nodeData.data as FlowGraphBlock;
    }

    private _onAnimationGroupChange(uniqueId: number) {
        const block = this._getBlock();
        const agInput = block.getDataInput("animationGroup");
        if (!agInput) return;

        const { sceneContext } = this.state;
        if (!sceneContext) return;

        const ag = uniqueId === -1 ? undefined : sceneContext.animationGroups.find((a) => a.uniqueId === uniqueId);

        if (!block.config) {
            (block as any).config = {};
        }
        (block.config as any).animationGroup = ag;
        (agInput as any)._defaultValue = ag;

        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    override render() {
        const { stateManager, nodeData } = this.props;
        const { sceneContext } = this.state;
        const block = this._getBlock();
        const agInput = block.getDataInput("animationGroup");
        const currentAg = agInput ? (agInput as any)._defaultValue : undefined;
        const currentUniqueId = currentAg?.uniqueId ?? -1;

        return (
            <>
                <GeneralPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />

                <LineContainerComponent title="ANIMATION GROUP">
                    {sceneContext ? (
                        <>
                            <OptionsLine
                                label="Animation Group"
                                options={[
                                    { label: "(none)", value: -1 },
                                    ...sceneContext.animationGroups.map((a) => ({
                                        label: a.name || `(id ${a.uniqueId})`,
                                        value: a.uniqueId,
                                    })),
                                ]}
                                target={{}}
                                propertyName="_unused"
                                noDirectUpdate={true}
                                extractValue={() => currentUniqueId}
                                onSelect={(value) => this._onAnimationGroupChange(value as number)}
                            />
                            {sceneContext.animationGroups.length === 0 && (
                                <div style={{ padding: "4px 8px", color: "#aaa", fontSize: "11px" }}>No animation groups found in the scene.</div>
                            )}
                        </>
                    ) : (
                        <div style={{ padding: "4px 8px", color: "#888", fontSize: "11px" }}>Load a scene snippet in the Preview panel to pick animation groups.</div>
                    )}
                </LineContainerComponent>

                <DataConnectionsPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
                <GenericPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
            </>
        );
    }
}
