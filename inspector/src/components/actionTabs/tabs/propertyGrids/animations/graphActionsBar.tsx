import * as React from "react";
import { IconButtonLineComponent } from "../../../lines/iconButtonLineComponent";
import { IActionableKeyFrame } from "./animationCurveEditorComponent";

interface IGraphActionsBarProps {
    addKeyframe: () => void;
    removeKeyframe: () => void;
    handleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFrameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    flatTangent: () => void;
    brokeTangents: () => void;
    setLerpMode: () => void;
    brokenMode: boolean;
    lerpMode: boolean;
    actionableKeyframe: IActionableKeyFrame;
    title: string;
    close: (event: any) => void;
    enabled: boolean;
    setKeyframeValue: (actionableKeyframe: IActionableKeyFrame) => void;
}

export class GraphActionsBar extends React.Component<IGraphActionsBarProps, { frame: string; value: string }> {
    private _frameInput: React.RefObject<HTMLInputElement>;
    private _valueInput: React.RefObject<HTMLInputElement>;
    constructor(props: IGraphActionsBarProps) {
        super(props);
        this._frameInput = React.createRef();
        this._valueInput = React.createRef();
        const { frame, value } = this.selectedKeyframeChanged(this.props.actionableKeyframe);
        this.state = { frame, value };
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

    onBlur(event: React.FocusEvent<HTMLInputElement>) {
        event.preventDefault();
        if (event.target.value !== "") {
            const actionableKeyframe: IActionableKeyFrame = { frame: this.getFrame(), value: this.getValue() };
            this.props.setKeyframeValue(actionableKeyframe);
        }
    }

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
                <div className="buttons-container" style={{ pointerEvents: this.props.enabled ? "all" : "none" }}>
                    <div className="action-input frame-input">
                        <input ref={this._frameInput} type="number" onChange={this.handleFrameChange} value={this.state.frame} step="1" disabled={this.props.actionableKeyframe.frame === undefined} onBlur={(e) => this.onBlur(e)} />
                    </div>
                    <div className="action-input">
                        <input ref={this._valueInput} type="number" value={this.state.value} onChange={this.handleValueChange} step="0.01" disabled={this.props.actionableKeyframe.value === undefined} onBlur={(e) => this.onBlur(e)} />
                    </div>
                    <IconButtonLineComponent tooltip={"Add Keyframe"} icon="new-key" onClick={this.props.addKeyframe} />
                    <IconButtonLineComponent tooltip={"Frame selected keyframes"} icon="frame" onClick={this.props.removeKeyframe} />
                    <IconButtonLineComponent tooltip={"Flat Tangents"} icon="flat-tangent" onClick={this.props.flatTangent} />
                    <IconButtonLineComponent tooltip={this.props.brokenMode ? "Broken Mode On" : "Broken Mode Off"} icon={this.props.brokenMode ? "break-tangent" : "unify-tangent"} onClick={this.props.brokeTangents} />
                    <IconButtonLineComponent tooltip={this.props.lerpMode ? "Lerp On" : "lerp Off"} icon="linear-tangent" onClick={this.props.setLerpMode} />
                </div>
            </div>
        );
    }
}
