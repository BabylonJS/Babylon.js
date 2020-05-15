
import * as React from "react";

interface IPlayheadProps {
    message: string;
    open: boolean;
    close: () => void
}

export class Notification extends React.Component<IPlayheadProps>{
    constructor(props: IPlayheadProps) {
        super(props);
    }

    render() {
        return (
            <div className="notification-area" style={{ display: this.props.open ? 'block' : 'none' }}>
                <div className="alert alert-error" >
                    <button type="button" className="close" data-dismiss="alert" onClick={this.props.close}>&times;</button>
                    {this.props.message}
                </div>
            </div>
        )
    }
} 