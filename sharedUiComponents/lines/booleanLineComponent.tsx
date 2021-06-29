import * as React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export interface IBooleanLineComponentProps {
    label: string;
    value: boolean;
    icon? : string;
}

export class BooleanLineComponent extends React.Component<IBooleanLineComponentProps> {
    constructor(props: IBooleanLineComponentProps) {
        super(props);
    }

    render() {

        const check = this.props.value ? <FontAwesomeIcon icon={faCheck} /> : <FontAwesomeIcon icon={faTimesCircle} />
        const className = this.props.value ? "value check" : "value uncheck";

        return (
            <div className="textLine">
                {this.props.icon && <img src={this.props.icon} className="icon"/>}
                <div className="label" title={this.props.label}>
                    {this.props.label}
                </div>
                <div className={className}>
                    {check}
                </div>
            </div>
        );
    }
}
