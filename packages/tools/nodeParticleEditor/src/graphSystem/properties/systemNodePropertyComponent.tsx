import * as React from "react";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { SystemBlock } from "core/Particles/Node/Blocks/systemBlock";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";

export class SystemPropertyTabComponent extends React.Component<IPropertyComponentProps> {
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
        const systemBlock = this.props.nodeData.data as SystemBlock;
        const particleSystem = systemBlock._particleSystem;
        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                {particleSystem && (
                    <>
                        <LineContainerComponent title="CONTROLS">
                            {particleSystem.isStarted() && !particleSystem.isStopping() && (
                                <ButtonLineComponent
                                    label={!particleSystem.paused ? "Pause" : "Resume"}
                                    onClick={() => {
                                        particleSystem.paused = !particleSystem.paused;
                                        this.forceUpdate();
                                    }}
                                />
                            )}
                            {particleSystem.isStarted() && !particleSystem.isStopping() && (
                                <ButtonLineComponent
                                    label="Stop"
                                    onClick={() => {
                                        particleSystem.stop();
                                        this.forceUpdate();
                                    }}
                                />
                            )}
                            {!particleSystem.isStarted() ||
                                (particleSystem.isStopping() && (
                                    <ButtonLineComponent
                                        label="Start"
                                        onClick={() => {
                                            particleSystem.start();
                                            this.forceUpdate();
                                        }}
                                    />
                                ))}
                        </LineContainerComponent>
                        <LineContainerComponent title="STATISTICS">
                            <TextLineComponent label="Particle count" value={particleSystem.particles.length.toString()} />
                            <TextLineComponent label="Is started" value={particleSystem.isStarted() ? "Yes" : "No"} />
                            <TextLineComponent label="Is alive" value={particleSystem.isAlive() ? "Yes" : "No"} />
                            <ButtonLineComponent
                                label="Refreh"
                                onClick={() => {
                                    this.forceUpdate();
                                }}
                            />
                        </LineContainerComponent>
                    </>
                )}
            </div>
        );
    }
}
