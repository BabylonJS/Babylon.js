import * as React from "react";

interface IMessageLineComponentProps {
    text: string,
    color?: string,
}

export class MessageLineComponent extends React.Component<IMessageLineComponentProps> {
    constructor(props: IMessageLineComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="messageLine">
                <div className="value" title={this.props.text} style={{ color: this.props.color ? this.props.color : "" }}>
                    {this.props.text}
                </div>
            </div>
        );
    }
}
