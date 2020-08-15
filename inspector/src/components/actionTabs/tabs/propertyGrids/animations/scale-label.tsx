import * as React from "react";
import { CurveScale } from "./animationCurveEditorComponent";

interface ISwitchButtonProps {
    current: CurveScale;
    action?: (event: CurveScale) => void;
}

export class ScaleLabel extends React.Component<ISwitchButtonProps, { current: CurveScale }> {
    constructor(props: ISwitchButtonProps) {
        super(props);
        this.state = { current: this.props.current };
    }

    renderLabel(scale: CurveScale) {
        switch (scale) {
            case CurveScale.default:
                return "";
            case CurveScale.degrees:
                return "DEG";
            case CurveScale.float:
                return "FLT";
            case CurveScale.integers:
                return "INT";
            case CurveScale.radians:
                return "RAD";
        }
    }

    onClickHandle = () => {
        this.props.action && this.props.action(this.state.current);
    };

    render() {
        const label = this.renderLabel(this.state.current);
        return (
            <div className="switch-button" onClick={this.onClickHandle}>
                <p>{label}</p>
            </div>
        );
    }
}
