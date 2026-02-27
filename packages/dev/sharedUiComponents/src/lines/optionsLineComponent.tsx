import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../propertyChangedEvent";
import { copyCommandToClipboard, getClassNameWithNamespace } from "../copyCommandToClipboard";
import type { IInspectableOptions } from "core/Misc/iInspectable";
import copyIcon from "../imgs/copy.svg";
import { PropertyLine } from "../fluent/hoc/propertyLines/propertyLine";
import { Dropdown } from "../fluent/primitives/dropdown";
import type { AcceptedDropdownValue } from "../fluent/primitives/dropdown";
import { ToolContext } from "../fluent/hoc/fluentToolWrapper";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Null_Value = Number.MAX_SAFE_INTEGER;

export interface IOptionsLineProps {
    label: string;
    target: any;
    propertyName: string;
    options: readonly IInspectableOptions[];
    noDirectUpdate?: boolean;
    onSelect?: (value: number | string) => void;
    extractValue?: (target: any) => number | string;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    allowNullValue?: boolean;
    icon?: string;
    iconLabel?: string;
    className?: string;
    valuesAreStrings?: boolean;
    defaultIfNull?: number;
}

export class OptionsLine extends React.Component<IOptionsLineProps, { value: number | string }> {
    private _localChange = false;

    private _remapValueIn(value: number | null): number {
        return this.props.allowNullValue && value === null ? Null_Value : value!;
    }

    private _remapValueOut(value: number): number | null {
        return this.props.allowNullValue && value === Null_Value ? null : value;
    }

    private _getValue(props: IOptionsLineProps) {
        if (props.extractValue) {
            return props.extractValue(props.target);
        }
        return props.target && props.propertyName ? props.target[props.propertyName] : props.options[props.defaultIfNull || 0];
    }

    constructor(props: IOptionsLineProps) {
        super(props);

        this.state = { value: this._remapValueIn(this._getValue(props)) };
    }

    override shouldComponentUpdate(nextProps: IOptionsLineProps, nextState: { value: number }) {
        if (this._localChange) {
            this._localChange = false;
            return true;
        }

        if (nextProps.options !== this.props.options) {
            return true;
        }

        const newValue = this._remapValueIn(nextProps.extractValue ? nextProps.extractValue(this.props.target) : nextProps.target[nextProps.propertyName]);
        if (newValue != null && newValue !== nextState.value) {
            nextState.value = newValue;
            return true;
        }
        return false;
    }

    raiseOnPropertyChanged(newValue: number, previousValue: number) {
        if (!this.props.onPropertyChangedObservable) {
            return;
        }

        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName,
            value: newValue,
            initialValue: previousValue,
            allowNullValue: this.props.allowNullValue,
        });
    }

    setValue(value: string | number) {
        this.setState({ value: value });
    }

    updateValue(valueString: string) {
        const value = this.props.valuesAreStrings ? valueString : parseInt(valueString);
        this._localChange = true;

        const store = this.props.extractValue ? this.props.extractValue(this.props.target) : this.props.target[this.props.propertyName];

        if (!this.props.noDirectUpdate) {
            this.props.target[this.props.propertyName] = this._remapValueOut(value as number);
        }
        this.setState({ value: value });

        if (this.props.onSelect) {
            this.props.onSelect(value);
        }

        const newValue = this.props.extractValue ? this.props.extractValue(this.props.target) : this.props.target[this.props.propertyName];

        this.raiseOnPropertyChanged(newValue, store);
    }

    // Copy to clipboard the code this option actually does
    // Example : material.sideOrientation = 1;
    onCopyClickStr() {
        if (this.props && this.props.target) {
            const { className, babylonNamespace } = getClassNameWithNamespace(this.props.target);
            const targetName = "globalThis.debugNode";
            const targetProperty = this.props.propertyName;
            const value = this.props.extractValue ? this.props.extractValue(this.props.target) : this.props.target[this.props.propertyName];
            const strCommand = targetName + "." + targetProperty + " = " + value + ";// (debugNode as " + babylonNamespace + className + ")";
            return strCommand;
        } else {
            return "undefined";
        }
    }

    private _renderFluent() {
        return (
            <PropertyLine label={this.props.label} onCopy={() => this.onCopyClickStr()}>
                <Dropdown
                    options={this.props.options}
                    onChange={(val: AcceptedDropdownValue) => {
                        // val != null captures both null and undefined cases
                        val != null && this.updateValue(val.toString());
                    }}
                    value={this.state.value}
                />
            </PropertyLine>
        );
    }

    private _renderOriginal() {
        return (
            <div className={"listLine" + (this.props.className ? " " + this.props.className : "")}>
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} color="black" className="icon" />}
                <div className="label" title={this.props.label}>
                    {this.props.label}
                </div>
                <div className="options">
                    <select onChange={(evt) => this.updateValue(evt.target.value)} value={this.state.value ?? ""}>
                        {this.props.options.map((option, i) => {
                            return (
                                <option selected={option.selected} key={option.label + i} value={option.value} title={option.label}>
                                    {option.label}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="copy hoverIcon" onClick={() => copyCommandToClipboard(this.onCopyClickStr())} title="Copy to clipboard">
                    <img src={copyIcon} alt="Copy" />
                </div>
            </div>
        );
    }
    override render() {
        return <ToolContext.Consumer>{({ useFluent }) => (useFluent ? this._renderFluent() : this._renderOriginal())}</ToolContext.Consumer>;
    }
}
