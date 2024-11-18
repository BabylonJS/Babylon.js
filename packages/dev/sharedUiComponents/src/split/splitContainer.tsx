import * as React from "react";
import styles from "./splitContainer.module.scss";

export interface ISplitContainerProps {
    id: string;
}

export class SplitContainer extends React.Component<ISplitContainerProps> {
    constructor(props: ISplitContainerProps) {
        super(props);
    }

    public override render() {
        return (
            <div id={this.props.id} className={styles["split-container"]}>
                {this.props.children}
            </div>
        );
    }
}
