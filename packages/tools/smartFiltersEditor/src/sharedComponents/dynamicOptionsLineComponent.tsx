import { Component, createRef } from "react";
import type { Observable, Observer } from "@babylonjs/core/Misc/observable";
import type { IInspectableOptions } from "@babylonjs/core/Misc/iInspectable";
import type { Nullable } from "@babylonjs/core/types";
import { type IOptionsLineProps, OptionsLine } from "@babylonjs/shared-ui-components/lines/optionsLineComponent.js";

/**
 * Props for normal OptionsLine, with options replaced by optionsObservable
 */
interface IDynamicOptionsLineProps extends Omit<IOptionsLineProps, "options"> {
    optionsObservable: Observable<IInspectableOptions[]>;
}

/**
 * State that tracks the final, rendered option list
 */
interface IDynamicOptionsLineState {
    options: IInspectableOptions[];
}

/**
 * A wrapper of OptionsLineComponent that supports options obtained via Observable.
 * Using an Observable allows for dynamic updates to the options list.
 */
export class DynamicOptionsLine extends Component<IDynamicOptionsLineProps, IDynamicOptionsLineState> {
    private _observer: Nullable<Observer<IInspectableOptions[]>>;
    private _optionsLineRef: React.RefObject<OptionsLine>;

    constructor(props: IDynamicOptionsLineProps) {
        super(props);
        this.state = {
            options: [],
        };
        this._observer = null;
        this._optionsLineRef = createRef();
    }

    onOptionsChanged(value: IInspectableOptions[]) {
        this.setState({ options: value });
    }

    override componentDidUpdate() {
        // OptionsLine component does not update on prop changes, since it uses its
        // own shouldUpdateMethod. Hopefully we can change this later.
        if (this._optionsLineRef.current) {
            this._optionsLineRef.current.forceUpdate();
        }
    }

    override componentDidMount(): void {
        this._observer = this.props.optionsObservable.add(this.onOptionsChanged.bind(this));
    }

    override componentWillUnmount(): void {
        if (this._observer) {
            this.props.optionsObservable.remove(this._observer);
            this._observer = null;
        }
    }

    override render() {
        // Exclude optionsObservable from the props passed to OptionsLine
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { optionsObservable, ...rest } = this.props;
        return <OptionsLine {...rest} options={this.state.options} ref={this._optionsLineRef} />;
    }
}
