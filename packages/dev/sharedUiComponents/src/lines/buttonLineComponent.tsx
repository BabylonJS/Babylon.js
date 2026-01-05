import * as React from "react";
import { ButtonLine } from "../fluent/hoc/buttonLine";
import { ToolContext } from "../fluent/hoc/fluentToolWrapper";

export interface IButtonLineComponentProps {
    label: string;
    onClick: () => void;
    icon?: string;
    iconLabel?: string;
    isDisabled?: boolean;
}

export class ButtonLineComponent extends React.Component<IButtonLineComponentProps> {
    constructor(props: IButtonLineComponentProps) {
        super(props);
    }

    renderFluent() {
        // NOTE when callsit replaces usage of this with the ButtonLine, can pass in a true fluent icon
        const fluentIcon = this.props.icon ? () => <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" /> : undefined;
        return <ButtonLine label={this.props.label} icon={fluentIcon} onClick={this.props.onClick} disabled={this.props.isDisabled} />;
    }
    renderOriginal() {
        return (
            <div className={"buttonLine" + (this.props.isDisabled ? " disabled" : "")}>
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                <button onClick={() => this.props.onClick()}>{this.props.label}</button>
            </div>
        );
    }

    override render() {
        return <ToolContext.Consumer>{({ useFluent }) => (useFluent ? this.renderFluent() : this.renderOriginal())}</ToolContext.Consumer>;
    }
}
