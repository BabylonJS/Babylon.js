import { Component } from "react";
import type { ConnectionPointType, InputBlock } from "smart-filters";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent.js";
import { GetFloatInputBlockEditorData } from "../../../graphSystem/getEditorData.js";
import { FloatSliderComponent } from "../../../sharedComponents/floatSliderComponent.js";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager.js";

/**
 * Props for the FloatPropertyTabComponent
 */
export interface IFloatPropertyTabComponentProps {
    /**
     * The state manager of the graph
     */
    stateManager: StateManager;

    /**
     * The input block to edit (must be of type ConnectionPointType.Float)
     */
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
export class FloatPropertyTabComponent extends Component<IFloatPropertyTabComponentProps, FloatPropertyTabComponentState> {
    // eslint-disable-next-line babylonjs/available
    constructor(props: IFloatPropertyTabComponentProps) {
        super(props);
        this._processEditorData(true);
    }

    private _processEditorData(initializeState: boolean = false) {
        // Initialize state data
        const editorData = GetFloatInputBlockEditorData(this.props.inputBlock);
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

    // eslint-disable-next-line babylonjs/available
    override componentDidUpdate(prevProps: IFloatPropertyTabComponentProps) {
        if (prevProps.inputBlock !== this.props.inputBlock) {
            this._processEditorData();
        }
    }

    // eslint-disable-next-line babylonjs/available
    override render() {
        const editorData = GetFloatInputBlockEditorData(this.props.inputBlock);
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
                            this._processEditorData();
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
                            this._processEditorData();
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
