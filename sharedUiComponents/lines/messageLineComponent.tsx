import * as React from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IMessageLineComponentProps {
    text: string;
    color?: string;
    icon?: IconProp;
}

export class MessageLineComponent extends React.Component<IMessageLineComponentProps> {
    constructor(props: IMessageLineComponentProps) {
        super(props);
    }

    render() {
        if (this.props.icon) {
            return (
                <div className="iconMessageLine">
                    <div className="icon" style={{ color: this.props.color ? this.props.color : "" }}>
                        <FontAwesomeIcon icon={this.props.icon}/>
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
}
