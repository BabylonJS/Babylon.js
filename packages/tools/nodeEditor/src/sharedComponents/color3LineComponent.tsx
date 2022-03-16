import * as React from "react";
import { Observable } from "core/Misc/observable";
import { Color3, Color4 } from "core/Maths/math.color";
import { PropertyChangedEvent } from "./propertyChangedEvent";
import { NumericInputComponent } from "./numericInputComponent";
import { GlobalState } from "../globalState";
import { ColorPickerLineComponent } from "./colorPickerComponent";

import copyIcon from "./copy.svg";
import plusIcon from "./plus.svg";
import minusIcon from "./minus.svg";

export interface IColor3LineComponentProps {
    label: string;
    target: any;
    propertyName: string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onChange?: () => void;
    globalState: GlobalState;
}

interface IColor3LineComponentState {
    isExpanded: boolean;
}

export class Color3LineComponent extends React.Component<IColor3LineComponentProps, IColor3LineComponentState> {
    constructor(props: IColor3LineComponentProps) {
        super(props);

        this.state = { isExpanded: false };
    }

    onChange(newValue: string) {
        const isColor4 = this.getCurrentColor().getClassName() === "Color4";
        const newColor = isColor4 ? Color4.FromHexString(newValue) : Color3.FromHexString(newValue);

        this.updateColor(newColor);
    }

    switchExpandState() {
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    updateColor(newValue: Color3 | Color4) {
        const previousValue = this.getCurrentColor();
        if (newValue.equals(previousValue as any)) {
            return;
        }
        this.props.target[this.props.propertyName] = newValue;
        this.forceUpdate();
        if (this.props.onChange) {
            this.props.onChange();
        }

        if (!this.props.onPropertyChangedObservable) {
            return;
        }
        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName,
            value: newValue,
            initialValue: previousValue,
        });
    }

    modifyColor(modifier: (previous: Color3 | Color4) => void) {
        const color = this.getCurrentColor();
        modifier(color);

        this.updateColor(color);
    }

    getCurrentColor(): Color3 | Color4 {
        return this.props.target[this.props.propertyName].clone();
    }

    copyToClipboard() {
        const element = document.createElement("div");
        element.textContent = this.getCurrentColor().toHexString();
        document.body.appendChild(element);

        if (window.getSelection) {
            const range = document.createRange();
            range.selectNode(element);
            window.getSelection()!.removeAllRanges();
            window.getSelection()!.addRange(range);
        }

        document.execCommand("copy");
        element.remove();
    }

    render() {
        const expandedIcon = this.state.isExpanded ? minusIcon : plusIcon;
        const color = this.getCurrentColor();

        return (
            <div className="color3Line">
                <div className="firstLine">
                    <div className="label" title={this.props.label}>
                        {this.props.label}
                    </div>
                    <div className="color3">
                        <ColorPickerLineComponent
                            value={color}
                            globalState={this.props.globalState}
                            onColorChanged={(color) => {
                                this.onChange(color);
                            }}
                        />
                    </div>
                    <div className="copy hoverIcon" onClick={() => this.copyToClipboard()} title="Copy to clipboard">
                        <img src={copyIcon} alt="" />
                    </div>
                    <div className="expand hoverIcon" onClick={() => this.switchExpandState()} title="Expand">
                        <img src={expandedIcon} alt="" />
                    </div>
                </div>
                {this.state.isExpanded && (
                    <div className="secondLine">
                        <NumericInputComponent globalState={this.props.globalState} label="r" value={color.r} onChange={(value) => this.modifyColor((col) => (col.r = value))} />
                        <NumericInputComponent globalState={this.props.globalState} label="g" value={color.g} onChange={(value) => this.modifyColor((col) => (col.g = value))} />
                        <NumericInputComponent globalState={this.props.globalState} label="b" value={color.b} onChange={(value) => this.modifyColor((col) => (col.b = value))} />
                    </div>
                )}
            </div>
        );
    }
}
