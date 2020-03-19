import * as React from "react";

interface ILinkButtonComponentProps {
    label: string;
    buttonLabel: string;
    url?: string;
    onClick: () => void;
}

export class LinkButtonComponent extends React.Component<ILinkButtonComponentProps> {
    constructor(props: ILinkButtonComponentProps) {
        super(props);
    }

    onLink() {
        if (this.props.url) {
            window.open(this.props.url, '_blank');
        }
    }

    render() {
        return (
            <div className={"linkButtonLine"}>
                <div className="link" title={this.props.label} onClick={() => this.onLink()}>
                    {this.props.label}
                </div>
                <div className="link-button">
                    <button onClick={() => this.props.onClick()}>{this.props.buttonLabel}</button>
                </div> 
            </div>
        );
    }
}
