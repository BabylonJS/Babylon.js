import * as React from "react";

interface ITreeItemLabelComponentProps {
    label?: string;
    onClick?: () => void;
    onChange: (newValue: string) => void;
    bracket: string;
    renaming: boolean;
    setRenaming: (renaming: boolean) => void;
}

interface ITreeItemLabelState {
    value: string;
}

export class TreeItemLabelComponent extends React.Component<ITreeItemLabelComponentProps, ITreeItemLabelState> {
    constructor(props: ITreeItemLabelComponentProps) {
        super(props);
        this.state = {
            value: "",
        };
    }

    onClick() {
        if (!this.props.onClick || this.props.renaming) {
            return;
        }

        this.props.onClick();
    }

    onBlur() {
        this.props.setRenaming(false);
    }

    render() {
        // if editing, overwrite string with local value
        const label = this.props.renaming ? this.state.value : this.props.label || "No Name";
        return (
            <div className="title" onClick={() => this.onClick()}>
                {this.props.renaming ? (
                    <input
                        type="text"
                        onBlur={() => this.onBlur()}
                        autoFocus={true}
                        value={label}
                        onChange={(ev) => {
                            this.props.onChange(ev.target.value);
                            this.setState({ value: ev.target.value });
                        }}
                        onKeyDown={(ev) => {
                            if (ev.key === "Enter") this.onBlur();
                        }}
                        className="titleText"
                    />
                ) : (
                    <div
                        className="titleText"
                        onDoubleClick={() => {
                            this.props.setRenaming(true);
                            this.setState({ value: label });
                        }}
                    >
                        {label}
                    </div>
                )}
            </div>
        );
    }
}
