import * as React from "react";
import { IconButtonLineComponent } from "../../../lines/iconButtonLineComponent";
import { IActionableKeyFrame } from "./animationCurveEditorComponent";

interface IGraphActionsBarProps {
    addKeyframe: () => void;
    removeKeyframe: () => void;
    frameSelectedKeyframes: () => void;
    handleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFrameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    flatTangent: () => void;
    brokeTangents: () => void;
    setLerpToActiveControlPoint: () => void;
    brokenMode: boolean;
    lerpMode: boolean;
    actionableKeyframe: IActionableKeyFrame;
    title: string;
    enabled: boolean;
    setKeyframeValue: (actionableKeyframe: IActionableKeyFrame) => void;
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

    componentDidMount() {
        this._frameInput.current?.addEventListener("keyup", this.isEnterKeyUp.bind(this));
        this._valueInput.current?.addEventListener("keyup", this.isEnterKeyUp.bind(this));
    }

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

    componentWillUnmount() {
        this._frameInput.current?.removeEventListener("keyup", this.isEnterKeyUp.bind(this));
        this._valueInput.current?.removeEventListener("keyup", this.isEnterKeyUp.bind(this));
    }

    isEnterKeyUp(event: KeyboardEvent) {
        event.preventDefault();

        if (event.key === "Enter") {
            const actionableKeyframe: IActionableKeyFrame = { frame: this.getFrame(), value: this.getValue() };
            this.props.setKeyframeValue(actionableKeyframe);
        }
    }

    onBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        event.preventDefault();
        if (event.target.value !== "") {
            const actionableKeyframe: IActionableKeyFrame = { frame: this.getFrame(), value: this.getValue() };
            this.props.setKeyframeValue(actionableKeyframe);
        }
    };

    getFrame() {
        let frame;
        if (this.state.frame === "") {
            frame = "";
        } else {
            frame = parseInt(this.state.frame);
        }

        return frame;
    }

    getValue() {
        let value;
        if (this.state.value !== "") {
            value = parseFloat(this.state.value);
        } else {
            value = "";
        }
        return value;
    }

    handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        this.setState({ value: e.target.value });
    };

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
                <div className={`buttons-container ${this.props.enabled ? "pointer-events-enabled" : "pointer-events-disabled"}`}>
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
