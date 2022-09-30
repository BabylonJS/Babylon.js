import * as React from "react";
import type { LockObject } from "../../tabs/propertyGrids/lockObject";
import style from "./HexColor.modules.scss";

export interface IHexColorProps {
    value: string;
    expectedLength: number;
    onChange: (value: string) => void;
    lockObject: LockObject;
}

export class HexColor extends React.Component<IHexColorProps, { hex: string }> {
    constructor(props: IHexColorProps) {
        super(props);

        this.state = { hex: this.props.value.replace("#", "") };
    }

    shouldComponentUpdate(nextProps: IHexColorProps, nextState: { hex: string }) {
        if (nextProps.value !== this.props.value) {
            nextState.hex = nextProps.value.replace("#", "");
        }

        return true;
    }

    lock() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = true;
        }
    }

    unlock() {
        if (this.props.lockObject) {
            this.props.lockObject.lock = false;
        }
    }

    updateHexValue(valueString: string) {
        if (valueString != "" && /^[0-9A-Fa-f]+$/g.test(valueString) == false) {
            return;
        }

        this.setState({ hex: valueString });

        if (valueString.length !== this.props.expectedLength) {
            if (this.props.expectedLength === 8 && valueString.length === 6) {
                valueString = valueString + "FF";
            } else {
                return;
            }
        }

        this.props.onChange("#" + valueString);
    }

    public render() {
        return (
            <div className={style.colorPickerHex}>
                <div className={style.colorPickerHexLabel}>Hex</div>
                <div className={style.colorPickerHexValue}>
                    <input
                        type="string"
                        // className="hex-input"
                        className={style.colorPickerHex}
                        value={this.state.hex}
                        onBlur={() => this.unlock()}
                        onFocus={() => this.lock()}
                        onChange={(evt) => this.updateHexValue(evt.target.value)}
                    />
                </div>
            </div>
        );
    }
}
