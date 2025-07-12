import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";

export interface IBooleanLineComponentProps {
    label: string;
    value: boolean;
    icon?: string;
    iconLabel?: string;
}

export class BooleanLineComponent extends React.Component<IBooleanLineComponentProps> {
    constructor(props: IBooleanLineComponentProps) {
        super(props);
    }
    renderFluent() {
        return <BooleanBadgePropertyLine label={this.props.label} value={this.props.value} />;
    }

    renderOriginal() {
        const check = this.props.value ? <FontAwesomeIcon icon={faCheck} /> : <FontAwesomeIcon icon={faTimesCircle} />;
        const className = this.props.value ? "value check" : "value uncheck";

        return (
            <div className="textLine">
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                <div className="label" title={this.props.label}>
                    {this.props.label}
                </div>
                <div className={className}>{check}</div>
            </div>
        );
    }
    override render() {
        return <ToolContext.Consumer>{({ useFluent }) => (useFluent ? this.renderFluent() : this.renderOriginal())}</ToolContext.Consumer>;
    }
}
