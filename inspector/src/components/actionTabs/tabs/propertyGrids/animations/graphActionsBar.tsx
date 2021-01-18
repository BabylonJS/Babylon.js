import * as React from "react";
import { IconButtonLineComponent } from "../../../../../sharedUiComponents/lines/iconButtonLineComponent";
import { IActionableKeyFrame } from "./animationCurveEditorComponent";

interface IGraphActionsBarProps {
    // Add a keyframe to animation
    addKeyframe: () => void;
    // Remove keyframe to animation
    removeKeyframe: () => void;
    // Shows the selected keyframes in the current visible canvas changing scale
    frameSelectedKeyframes: () => void;
    // Handles the value change of the keyframe
    handleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    // Handles the frame change of the keyframe
    handleFrameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    // Flats the selected control point relative to its keyframe
    flatTangent: () => void;
    // Allows the user to change the tangent values of control points independently
    brokeTangents: () => void;
    // Set a linear interpolation to the next keyframe on the selected control point
    setLerpToActiveControlPoint: () => void;
    // If broken mode is active or not
    brokenMode: boolean;
    // If the linear interpolation botton is active
    lerpMode: boolean;
    // The currently selected keyframe to perform value or frame updates
    actionableKeyframe: IActionableKeyFrame;
    // Name of the selected entity and animation
    title: string;
    // If the graph controls are enabled or not
    enabled: boolean;
    // Sets the keyframe value on the actionableKeyFrame
    setKeyframeValue: (actionableKeyframe: IActionableKeyFrame) => void;
    // How many frames are between selected keyframes
    frameRange: { min: number | undefined; max: number | undefined };
}

/**
 * Has the buttons and actions for the Canvas Graph.
 * Handles input change and actions (flat, broken mode, set linear control points)
 */
export class GraphActionsBar extends React.Component<
    IGraphActionsBarProps,
    { frame: string; value: string; min: number | undefined; max: number | undefined }
> {
    private _frameInput: React.RefObject<HTMLInputElement>;
    private _valueInput: React.RefObject<HTMLInputElement>;
    constructor(props: IGraphActionsBarProps) {
        super(props);
        this._frameInput = React.createRef();
        this._valueInput = React.createRef();
        const { frame, value } = this.selectedKeyframeChanged(this.props.actionableKeyframe);
        this.state = { frame, value, min: this.props.frameRange.min, max: this.props.frameRange.max };
    }

    /**
     * Listen to keyup changes to handle if the input event has ended or change
     */
    componentDidMount() {
        this._frameInput.current?.addEventListener("keyup", this.isEnterKeyUp.bind(this));
        this._valueInput.current?.addEventListener("keyup", this.isEnterKeyUp.bind(this));
    }

    /**
     * Set the changing state of frame, value and range of the actionablekeyframe
     * @param prevProps previous props
     * @param prevState previous state
     */
    componentDidUpdate(prevProps: IGraphActionsBarProps, prevState: any) {
        if (prevProps.actionableKeyframe !== this.props.actionableKeyframe) {
            const { frame, value } = this.selectedKeyframeChanged(this.props.actionableKeyframe);
            this.setState({ frame, value });
        }

        if (
            prevProps.frameRange.min !== this.props.frameRange.min ||
            prevProps.frameRange.max !== this.props.frameRange.max
        ) {
            this.setState({ min: this.props.frameRange.min, max: this.props.frameRange.max });
        }
    }

    /**
     * Returns the frame and value for the keyframe
     * @param keyframe The keyframe to update
     */
    selectedKeyframeChanged(keyframe: IActionableKeyFrame) {
        let frame = "";
        if (typeof keyframe.frame === "number") {
            frame = keyframe.frame.toString();
        }
        let value = "";
        if (typeof keyframe.value === "number") {
            value = keyframe.value.toFixed(3);
        }
        return { frame, value };
    }

    /**
     * Remove listeners
     */
    componentWillUnmount() {
        this._frameInput.current?.removeEventListener("keyup", this.isEnterKeyUp.bind(this));
        this._valueInput.current?.removeEventListener("keyup", this.isEnterKeyUp.bind(this));
    }

    /**
     * Trigger the change on the keyframe
     * @param event Enter keyevent
     */
    isEnterKeyUp(event: KeyboardEvent) {
        event.preventDefault();

        if (event.key === "Enter") {
            const actionableKeyframe: IActionableKeyFrame = { frame: this.getFrame(), value: this.getValue() };
            this.props.setKeyframeValue(actionableKeyframe);
        }
    }

    /**
     * Trigger the chnage on the keyframe on blur
     * @param event Focus event
     */
    onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        event.preventDefault();
        if (event.target.value !== "") {
            const actionableKeyframe: IActionableKeyFrame = { frame: this.getFrame(), value: this.getValue() };
            this.props.setKeyframeValue(actionableKeyframe);
        }
    };

    /**
     * Gets the keyframe frame
     */
    getFrame() {
        let frame;
        if (this.state.frame === "") {
            frame = "";
        } else {
            frame = parseInt(this.state.frame);
        }

        return frame;
    }

    /**
     * Gets the keyframe value
     */
    getValue() {
        let value;
        if (this.state.value !== "") {
            value = parseFloat(this.state.value);
        } else {
            value = "";
        }
        return value;
    }

    /**
     * Set keyframe value state
     * @param e Input event
     */
    handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        this.setState({ value: e.target.value });
    };

    /**
     * Set the keyframe frame state
     * @param e Input event
     */
    handleFrameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        this.setState({ frame: e.target.value });
    };

    render() {
        return (
            <div className="actions-wrapper">
                <div className="title-container">
                    <div className="icon babylon-logo"></div>
                    <div className="title">{this.props.title}</div>
                </div>
                <div
                    className={`buttons-container ${
                        this.props.enabled ? "pointer-events-enabled" : "pointer-events-disabled"
                    }`}
                >
                    <div className="action-input frame-input">
                        <input
                            ref={this._frameInput}
                            type="number"
                            onChange={this.handleFrameChange}
                            value={this.state.frame}
                            max={this.state.max}
                            min={this.state.min}
                            step="1"
                            disabled={this.props.actionableKeyframe.frame === undefined}
                            onBlur={this.onBlur}
                        />
                    </div>
                    <div className="action-input">
                        <input
                            ref={this._valueInput}
                            type="number"
                            value={this.state.value}
                            onChange={this.handleValueChange}
                            step="0.01"
                            disabled={this.props.actionableKeyframe.value === undefined}
                            onBlur={this.onBlur}
                        />
                    </div>
                    <IconButtonLineComponent tooltip={"Add Keyframe"} icon="new-key" onClick={this.props.addKeyframe} />
                    <IconButtonLineComponent
                        tooltip={"Frame selected keyframes"}
                        icon="frame"
                        onClick={this.props.frameSelectedKeyframes}
                    />
                    <IconButtonLineComponent
                        tooltip={this.props.brokenMode ? "Flat selected control point" : "Flat control points"}
                        icon="flat-tangent"
                        onClick={this.props.flatTangent}
                    />
                    <IconButtonLineComponent
                        tooltip={this.props.brokenMode ? "Broken Mode On" : "Broken Mode Off"}
                        icon={this.props.brokenMode ? "break-tangent" : "unify-tangent"}
                        onClick={this.props.brokeTangents}
                    />
                    <IconButtonLineComponent
                        tooltip={"Linear"}
                        icon="linear-tangent"
                        onClick={this.props.setLerpToActiveControlPoint}
                    />
                </div>
            </div>
        );
    }
}
