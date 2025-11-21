import * as React from "react";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ToolContext } from "../fluent/hoc/fluentToolWrapper";
import { MessageBar } from "../fluent/primitives/messageBar";

interface IMessageLineComponentProps {
    text: string;
    color?: string;
    icon?: IconProp;
}

export class MessageLineComponent extends React.Component<IMessageLineComponentProps> {
    constructor(props: IMessageLineComponentProps) {
        super(props);
    }

    renderFluent() {
        return (
            <MessageBar
                title=""
                message={this.props.text}
                intent={this.props.color === "Red" ? "error" : this.props.color === "Green" ? "success" : this.props.color === "Yellow" ? "warning" : "info"}
            />
        );
    }
    renderOriginal() {
        if (this.props.icon) {
            return (
                <div className="iconMessageLine">
                    <div className="icon" style={{ color: this.props.color ? this.props.color : "" }}>
                        <FontAwesomeIcon icon={this.props.icon} />
                    </div>
                    <div className="value" title={this.props.text}>
                        {this.props.text}
                    </div>
                </div>
            );
        }

        return (
            <div className="messageLine">
                <div className="value" title={this.props.text} style={{ color: this.props.color ? this.props.color : "" }}>
                    {this.props.text}
                </div>
            </div>
        );
    }
    override render() {
        return <ToolContext.Consumer>{({ useFluent }) => (useFluent ? this.renderFluent() : this.renderOriginal())}</ToolContext.Consumer>;
    }
}
