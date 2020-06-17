import * as React from "react";
import { GlobalState } from '../globalState';

interface IFooterButtonProps {
    globalState: GlobalState;
    enabled: boolean;
    onClick: () => void;
    icon: any;
    label: string;
}

export class FooterButton extends React.Component<IFooterButtonProps> {

    public render() {
        if (!this.props.enabled) {
            return null;
        }

        return (
            <div className="button" onClick={() => this.props.onClick()}>
                <img src={this.props.icon} alt={this.props.label} title={this.props.label} />
            </div>
        )
    }
}