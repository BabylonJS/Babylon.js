import * as React from "react";
import styles from "./FileButtonLineComponent.modules.scss";

export interface IFileButtonLineComponentProps {
    label: string;
    onClick: (file: File) => void;
    accept: string;
    icon?: string;
    iconLabel?: string;
}

export class FileButtonLineComponent extends React.Component<IFileButtonLineComponentProps> {
    private static _IDGenerator = 0;
    private _id = FileButtonLineComponent._IDGenerator++;
    private _uploadInputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IFileButtonLineComponentProps) {
        super(props);
        this._uploadInputRef = React.createRef();
    }

    onChange(evt: any) {
        const files: File[] = evt.target.files;
        if (files && files.length) {
            this.props.onClick(files[0]);
        }

        evt.target.value = "";
    }

    render() {
        return (
            <div className={styles.buttonLine}>
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} />}
                <label htmlFor={"file-upload" + this._id} className={styles.fileUpload}>
                    {this.props.label}
                </label>
                <input ref={this._uploadInputRef} id={"file-upload" + this._id} type="file" accept={this.props.accept} onChange={(evt) => this.onChange(evt)} />
            </div>
        );
    }
}
