import * as React from "react";
import { Vector3 } from "core/Maths/math.vector";
import type { Observable } from "core/Misc/observable";
import { NumericInput } from "../lines/numericInputComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { PropertyChangedEvent } from "../propertyChangedEvent";
import { copyCommandToClipboard, getClassNameWithNamespace } from "../copyCommandToClipboard";
import { SliderLineComponent } from "../lines/sliderLineComponent";
import { Tools } from "core/Misc/tools";
import type { LockObject } from "../tabs/propertyGrids/lockObject";
import copyIcon from "../imgs/copy.svg";
import { Vector3PropertyLine } from "../fluent/hoc/propertyLines/vectorPropertyLine";
import { ToolContext } from "../fluent/hoc/fluentToolWrapper";

interface IVector3LineComponentProps {
    label: string;
    target?: any;
    propertyName?: string;
    step?: number;
    onChange?: (newvalue: Vector3) => void;
    useEuler?: boolean;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    noSlider?: boolean;
    icon?: string;
    iconLabel?: string;
    lockObject: LockObject;
    directValue?: Vector3;
    additionalCommands?: JSX.Element[];
}

export class Vector3LineComponent extends React.Component<IVector3LineComponentProps, { isExpanded: boolean; value: Vector3 }> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    static defaultProps = {
        step: 0.001, // cm
    };

    private _localChange = false;

    constructor(props: IVector3LineComponentProps) {
        super(props);

        const value = this.getCurrentValue();
        this.state = { isExpanded: false, value: value && value.clone ? value.clone() : Vector3.Zero() };
    }

    getCurrentValue() {
        if (this.props.directValue) {
            return this.props.directValue;
        }
        return this.props.target[this.props.propertyName!];
    }

    override shouldComponentUpdate(nextProps: IVector3LineComponentProps, nextState: { isExpanded: boolean; value: Vector3 }) {
        if (nextProps.directValue) {
            if (!nextProps.directValue.equals(nextState.value) || this._localChange) {
                nextState.value = nextProps.directValue.clone();
                this._localChange = false;
                return true;
            }
            return false;
        }

        const nextPropsValue = nextProps.target[nextProps.propertyName!];

        if (!nextPropsValue.equals(nextState.value) || this._localChange) {
            nextState.value = nextPropsValue.clone();
            this._localChange = false;
            return true;
        }
        return false;
    }

    switchExpandState() {
        this._localChange = true;
        this.setState({ isExpanded: !this.state.isExpanded });
    }

    raiseOnPropertyChanged(previousValue: Vector3) {
        if (this.props.onChange) {
            this.props.onChange(this.state.value);
        }

        if (!this.props.onPropertyChangedObservable) {
            return;
        }
        this.props.onPropertyChangedObservable.notifyObservers({
            object: this.props.target,
            property: this.props.propertyName!,
            value: this.state.value,
            initialValue: previousValue,
        });
    }

    updateVector3() {
        if (this.props.directValue) {
            this.props.directValue.set(this.state.value.x, this.state.value.y, this.state.value.z);
            this.forceUpdate();
            this.raiseOnPropertyChanged(this.state.value);
            return;
        }

        const store = this.props.target[this.props.propertyName!].clone();
        this.props.target[this.props.propertyName!] = this.state.value;

        this.setState({ value: store });

        this.raiseOnPropertyChanged(store);
    }

    updateStateX(value: number) {
        this._localChange = true;

        this.state.value.x = value;
        this.updateVector3();
    }

    updateStateY(value: number) {
        this._localChange = true;

        this.state.value.y = value;
        this.updateVector3();
    }

    updateStateZ(value: number) {
        this._localChange = true;

        this.state.value.z = value;
        this.updateVector3();
    }

    // Copy to clipboard the code this Vector3 actually does
    // Example : Mesh.position = new BABYLON.Vector3(0, 1, 0);
    onCopyClick() {
        if (this.props && this.props.target) {
            const { className, babylonNamespace } = getClassNameWithNamespace(this.props.target);
            const targetName = "globalThis.debugNode";
            const targetProperty = this.props.propertyName;
            const value = this.props.target[this.props.propertyName!];
            const strVector = "new " + babylonNamespace + "Vector3(" + value.x + ", " + value.y + ", " + value.z + ")";
            const strCommand = targetName + "." + targetProperty + " = " + strVector + ";// (debugNode as " + babylonNamespace + className + ")";
            return strCommand;
        }
        return "";
    }

    renderFluent() {
        return (
            <Vector3PropertyLine
                label={this.props.label}
                onChange={(val: Vector3) => this.setState({ value: val })}
                value={this.props.target[this.props.propertyName!]}
                onCopy={() => this.onCopyClick()}
            />
        );
    }

    renderOriginal() {
        const chevron = this.state.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />;

        return (
            <div className="vector3Line">
                <div className="firstLine">
                    {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                    <div className="label" title={this.props.label}>
                        {this.props.label}
                    </div>
                    <div className="vector">
                        {!this.props.useEuler && `X: ${this.state.value.x.toFixed(2)}, Y: ${this.state.value.y.toFixed(2)}, Z: ${this.state.value.z.toFixed(2)}`}
                        {this.props.useEuler &&
                            `X: ${Tools.ToDegrees(this.state.value.x).toFixed(2)}, Y: ${Tools.ToDegrees(this.state.value.y).toFixed(2)}, Z: ${Tools.ToDegrees(
                                this.state.value.z
                            ).toFixed(2)}`}
                    </div>
                    <div className="expand hoverIcon" onClick={() => this.switchExpandState()} title="Expand">
                        {chevron}
                    </div>
                    <div className="copy hoverIcon" onClick={() => copyCommandToClipboard(this.onCopyClick())} title="Copy to clipboard">
                        <img src={copyIcon} alt="Copy" />
                    </div>
                    {this.props.additionalCommands && this.props.additionalCommands.map((c) => c)}
                </div>
                {this.state.isExpanded && !this.props.useEuler && (
                    <div className="secondLine">
                        <NumericInput
                            label="x"
                            lockObject={this.props.lockObject}
                            step={this.props.step}
                            value={this.state.value.x}
                            onChange={(value) => this.updateStateX(value)}
                        />
                        <NumericInput
                            label="y"
                            lockObject={this.props.lockObject}
                            step={this.props.step}
                            value={this.state.value.y}
                            onChange={(value) => this.updateStateY(value)}
                        />
                        <NumericInput
                            label="z"
                            lockObject={this.props.lockObject}
                            step={this.props.step}
                            value={this.state.value.z}
                            onChange={(value) => this.updateStateZ(value)}
                        />
                    </div>
                )}
                {this.state.isExpanded && this.props.useEuler && !this.props.noSlider && (
                    <div className="secondLine">
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            margin={true}
                            label="x"
                            minimum={0}
                            maximum={360}
                            step={0.1}
                            directValue={Tools.ToDegrees(this.state.value.x)}
                            onChange={(value) => this.updateStateX(Tools.ToRadians(value))}
                        />
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            margin={true}
                            label="y"
                            minimum={0}
                            maximum={360}
                            step={0.1}
                            directValue={Tools.ToDegrees(this.state.value.y)}
                            onChange={(value) => this.updateStateY(Tools.ToRadians(value))}
                        />
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            margin={true}
                            label="z"
                            minimum={0}
                            maximum={360}
                            step={0.1}
                            directValue={Tools.ToDegrees(this.state.value.z)}
                            onChange={(value) => this.updateStateZ(Tools.ToRadians(value))}
                        />
                    </div>
                )}
                {this.state.isExpanded && this.props.useEuler && this.props.noSlider && (
                    <div className="secondLine">
                        <NumericInput
                            lockObject={this.props.lockObject}
                            label="x"
                            step={this.props.step}
                            value={Tools.ToDegrees(this.state.value.x)}
                            onChange={(value) => this.updateStateX(Tools.ToRadians(value))}
                        />
                        <NumericInput
                            lockObject={this.props.lockObject}
                            label="y"
                            step={this.props.step}
                            value={Tools.ToDegrees(this.state.value.y)}
                            onChange={(value) => this.updateStateY(Tools.ToRadians(value))}
                        />
                        <NumericInput
                            lockObject={this.props.lockObject}
                            label="z"
                            step={this.props.step}
                            value={Tools.ToDegrees(this.state.value.z)}
                            onChange={(value) => this.updateStateZ(Tools.ToRadians(value))}
                        />
                    </div>
                )}
            </div>
        );
    }
    override render() {
        return <ToolContext.Consumer>{({ useFluent }) => (useFluent ? this.renderFluent() : this.renderOriginal())}</ToolContext.Consumer>;
    }
}
