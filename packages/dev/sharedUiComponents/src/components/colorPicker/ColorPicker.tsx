import * as React from "react";
import { Color3, Color4 } from "core/Maths/math.color";
import { ColorComponentEntry } from "./ColorComponentEntry";
import { HexColor } from "./HexColor";
import type { LockObject } from "../../tabs/propertyGrids/lockObject";

import style from "./ColorPicker.modules.scss";
import { ClassNames } from "../classNames";

/**
 * Interface used to specify creation options for color picker
 */
export interface IColorPickerProps {
    color: Color3 | Color4;
    linearhint?: boolean;
    debugMode?: boolean;
    onColorChanged?: (color: Color3 | Color4) => void;
    lockObject: LockObject;
    backgroundColor?: string;
}

/**
 * Interface used to specify creation options for color picker
 */
export interface IColorPickerState {
    color: Color3;
    alpha: number;
}

/**
 * Class used to create a color picker
 */
export class ColorPicker extends React.Component<IColorPickerProps, IColorPickerState> {
    private _saturationRef: React.RefObject<HTMLDivElement>;
    private _hueRef: React.RefObject<HTMLDivElement>;
    private _isSaturationPointerDown: boolean;
    private _isHuePointerDown: boolean;

    constructor(props: IColorPickerProps) {
        super(props);
        if (this.props.color instanceof Color4) {
            this.state = { color: new Color3(this.props.color.r, this.props.color.g, this.props.color.b), alpha: this.props.color.a };
        } else {
            this.state = { color: this.props.color.clone(), alpha: 1 };
        }
        this._saturationRef = React.createRef();
        this._hueRef = React.createRef();
    }

    shouldComponentUpdate(nextProps: IColorPickerProps, nextState: IColorPickerState) {
        return nextProps.color.toHexString() !== this.props.color.toHexString() || nextState.color.toHexString() !== this.props.color.toHexString();
    }

    onSaturationPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        this._evaluateSaturation(evt);
        this._isSaturationPointerDown = true;

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    onSaturationPointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        this._isSaturationPointerDown = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }

    onSaturationPointerMove(evt: React.PointerEvent<HTMLDivElement>) {
        if (!this._isSaturationPointerDown) {
            return;
        }
        this._evaluateSaturation(evt);
    }

    onHuePointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        this._evaluateHue(evt);
        this._isHuePointerDown = true;

        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    onHuePointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        this._isHuePointerDown = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }

    onHuePointerMove(evt: React.PointerEvent<HTMLDivElement>) {
        if (!this._isHuePointerDown) {
            return;
        }
        this._evaluateHue(evt);
    }

    private _evaluateSaturation(evt: React.PointerEvent<HTMLDivElement>) {
        const left = evt.nativeEvent.offsetX;
        const top = evt.nativeEvent.offsetY;

        const saturation = Math.min(1, Math.max(0.0001, left / this._saturationRef.current!.clientWidth));
        const value = Math.min(1, Math.max(0.0001, 1 - top / this._saturationRef.current!.clientHeight));

        if (this.props.debugMode) {
            console.log("Saturation: " + saturation);
            console.log("Value: " + value);
        }

        const hsv = this.state.color.toHSV();
        Color3.HSVtoRGBToRef(hsv.r, saturation, value, this.state.color);
        if (this.state.alpha === 0) {
            this.setState({ alpha: 1 });
        }
        this.setState({ color: this.state.color });
    }

    private _evaluateHue(evt: React.PointerEvent<HTMLDivElement>) {
        const left = evt.nativeEvent.offsetX;

        const hue = 360 * Math.min(0.9999, Math.max(0.0001, left / this._hueRef.current!.clientWidth));

        if (this.props.debugMode) {
            console.log("Hue: " + hue);
        }

        const hsv = this.state.color.toHSV();
        Color3.HSVtoRGBToRef(hue, Math.max(hsv.g, 0.01), Math.max(hsv.b, 0.01), this.state.color);
        this.setState({ color: this.state.color });
    }

    componentDidUpdate() {
        this.raiseOnColorChanged();
    }

    raiseOnColorChanged() {
        if (!this.props.onColorChanged) {
            return;
        }

        if (this.props.color instanceof Color4) {
            const newColor4 = Color4.FromColor3(this.state.color, this.state.alpha);

            this.props.onColorChanged(newColor4);

            return;
        }

        this.props.onColorChanged(this.state.color.clone());
    }

    public render() {
        const color4 = Color4.FromColor3(this.state.color);
        color4.a = this.state.alpha;
        const colorHex = color4.toHexString();
        const hsv = this.state.color.toHSV();
        const colorRef = new Color3();
        Color3.HSVtoRGBToRef(hsv.r, 1, 1, colorRef);
        const colorHexRef = colorRef.toHexString();
        const hasAlpha = this.props.color instanceof Color4;

        return (
            <div
                className={ClassNames({ colorPickerContainer: true, withHints: this.props.linearhint }, style)}
                style={{ backgroundColor: this.props.backgroundColor || "inherit" }}
            >
                <div
                    className={style.colorPickerSaturation}
                    onPointerMove={(e) => this.onSaturationPointerMove(e)}
                    onPointerDown={(e) => this.onSaturationPointerDown(e)}
                    onPointerUp={(e) => this.onSaturationPointerUp(e)}
                    ref={this._saturationRef}
                    style={{
                        background: colorHexRef,
                    }}
                >
                    <div className={style.colorPickerSaturationWhite}></div>
                    <div className={style.colorPickerSaturationBlack}></div>
                    <div
                        className={style.colorPickerSaturationCursor}
                        style={{
                            top: `${-(hsv.b * 100) + 100}%`,
                            left: `${hsv.g * 100}%`,
                        }}
                    ></div>
                </div>
                <div className={style.colorPickerHue}>
                    <div
                        className={style.colorPickerHueColor}
                        style={{
                            background: colorHex,
                        }}
                    ></div>
                    <div
                        className={style.colorPickerHueSlider}
                        ref={this._hueRef}
                        onPointerMove={(e) => this.onHuePointerMove(e)}
                        onPointerDown={(e) => this.onHuePointerDown(e)}
                        onPointerUp={(e) => this.onHuePointerUp(e)}
                    >
                        <div
                            className={style.colorPickerHueCursor}
                            style={{
                                left: `${(hsv.r / 360.0) * 100}%`,
                                border: `1px solid ` + colorHexRef,
                            }}
                        ></div>
                    </div>
                </div>
                {/* <div className="color-picker-alpha"></div> */}
                <div className={style.colorPickerRgb}>
                    <div className={style.red}>
                        <ColorComponentEntry
                            lockObject={this.props.lockObject}
                            label="R"
                            min={0}
                            max={255}
                            value={Math.round(this.state.color.r * 255)}
                            onChange={(value) => {
                                this.state.color.r = value / 255.0;
                                this.forceUpdate();
                            }}
                        />
                    </div>
                    <div className={style.green}>
                        <ColorComponentEntry
                            lockObject={this.props.lockObject}
                            label="G"
                            min={0}
                            max={255}
                            value={Math.round(this.state.color.g * 255)}
                            onChange={(value) => {
                                this.state.color.g = value / 255.0;
                                this.forceUpdate();
                            }}
                        />
                    </div>
                    <div className={style.blue}>
                        <ColorComponentEntry
                            lockObject={this.props.lockObject}
                            label="B"
                            min={0}
                            max={255}
                            value={Math.round(this.state.color.b * 255)}
                            onChange={(value) => {
                                this.state.color.b = value / 255.0;
                                this.forceUpdate();
                            }}
                        />
                    </div>
                    <div className={ClassNames({ alpha: true, grayed: hasAlpha }, style)}>
                        <ColorComponentEntry
                            lockObject={this.props.lockObject}
                            label="A"
                            min={0}
                            max={255}
                            value={Math.round(this.state.alpha * 255)}
                            onChange={(value) => {
                                this.setState({ alpha: value / 255.0 });
                                this.forceUpdate();
                            }}
                        />
                    </div>
                </div>
                <HexColor
                    lockObject={this.props.lockObject}
                    expectedLength={hasAlpha ? 8 : 6}
                    value={colorHex}
                    onChange={(value) => {
                        if (hasAlpha) {
                            const color4 = Color4.FromHexString(value);
                            this.setState({ color: new Color3(color4.r, color4.g, color4.b), alpha: color4.a });
                        } else {
                            this.setState({ color: Color3.FromHexString(value) });
                        }
                    }}
                />
                {this.props.linearhint && (
                    <div className={style.colorPickerWarning}>
                        (Note: color is stored in linear mode and was converted to gamma to be displayed here (toGammaSpace() / toLinearSpace()))
                    </div>
                )}
            </div>
        );
    }
}
