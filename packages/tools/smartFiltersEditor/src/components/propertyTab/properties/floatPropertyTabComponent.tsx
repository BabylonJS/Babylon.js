import { Component } from "react";
import type { ConnectionPointType, InputBlock } from "@babylonjs/smart-filters";
import { FloatLineComponent } from "@babylonjs/shared-ui-components/lines/floatLineComponent.js";
import { getFloatInputBlockEditorData } from "../../../graphSystem/getEditorData.js";
import { FloatSliderComponent } from "../../../sharedComponents/floatSliderComponent.js";
import type { StateManager } from "@babylonjs/shared-ui-components/nodeGraphSystem/stateManager.js";

export interface FloatPropertyTabComponentProps {
    stateManager: StateManager;
    inputBlock: InputBlock<ConnectionPointType.Float>;
}

type FloatPropertyTabComponentState = {
    useTime: boolean;
};

/**
 * The property tab component for InputBlock of type ConnectionPointType.Float.
 * If the animation type is time, display the value and valueDeltaPerMs properties
 * plainly-- no slider capability. Otherwise, display the value alongside
 * optional min and max properties that, when set, toggle a slider for the value.
 */
export class FloatPropertyTabComponent extends Component<
    FloatPropertyTabComponentProps,
    FloatPropertyTabComponentState
> {
    constructor(props: FloatPropertyTabComponentProps) {
        super(props);
        this.processEditorData(true);
    }

    processEditorData(initializeState: boolean = false) {
        // Initialize state data
        const editorData = getFloatInputBlockEditorData(this.props.inputBlock);
        const state = {
            useTime: editorData.animationType === "time",
        };

        if (initializeState) {
            this.state = state;
            return;
        }

        this.setState(state);
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
    }

    override componentDidUpdate(prevProps: FloatPropertyTabComponentProps) {
        if (prevProps.inputBlock !== this.props.inputBlock) {
            this.processEditorData();
        }
    }

    override render() {
        const editorData = getFloatInputBlockEditorData(this.props.inputBlock);
        return (
            <>
                {/* Min and max values */}
                {!this.state.useTime && (
                    <FloatLineComponent
                        lockObject={this.props.stateManager.lockObject}
                        label="Min"
                        target={editorData}
                        propertyName="min"
                        onChange={() => {
                            // Ensure other value gets set
                            editorData.max = editorData.max ?? 0;
                            this.processEditorData();
                        }}
                    ></FloatLineComponent>
                )}
                {!this.state.useTime && (
                    <FloatLineComponent
                        lockObject={this.props.stateManager.lockObject}
                        label="Max"
                        target={editorData}
                        propertyName="max"
                        onChange={() => {
                            // Ensure other value gets set
                            editorData.min = editorData.min ?? 0;
                            this.processEditorData();
                        }}
                    ></FloatLineComponent>
                )}
                {/* Value */}
                <FloatSliderComponent
                    lockObject={this.props.stateManager.lockObject}
                    label={this.props.inputBlock.name}
                    target={this.props.inputBlock.runtimeValue}
                    propertyName="value"
                    min={editorData.min}
                    max={editorData.max}
                    onChange={() => {
                        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                    }}
                    forceSliderOff={this.state.useTime}
                ></FloatSliderComponent>
                {/* Time values */}
                {this.state.useTime && (
                    <FloatLineComponent
                        lockObject={this.props.stateManager.lockObject}
                        key={this.props.inputBlock.uniqueId}
                        label="valueDeltaPerMs"
                        target={editorData}
                        propertyName="valueDeltaPerMs"
                        onChange={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
                        }}
                    ></FloatLineComponent>
                )}
            </>
        );
    }
}
