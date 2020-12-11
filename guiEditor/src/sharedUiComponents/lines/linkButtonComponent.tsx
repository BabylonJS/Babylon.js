import * as React from "react";
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface ILinkButtonComponentProps {
    label: string;
    buttonLabel: string;
    url?: string;
    onClick: () => void;
    icon?: IconProp;
    onIconClick?: () => void;
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
                {
                    this.props.icon &&
                    <div className="link-icon hoverIcon" onClick={() => {
                        if (this.props.onIconClick) {
                            this.props.onIconClick();
                        }
                    }}>
                        <FontAwesomeIcon icon={this.props.icon} />
                    </div> 
                }
            </div>
        );
    }
}
