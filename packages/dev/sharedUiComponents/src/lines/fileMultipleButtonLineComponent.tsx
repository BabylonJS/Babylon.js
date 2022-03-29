import * as React from "react";

interface IFileMultipleButtonLineComponentProps {
    label: string;
    onClick: (event: any) => void;
    accept: string;
    icon?: string;
    iconLabel?: string;
}

export class FileMultipleButtonLineComponent extends React.Component<IFileMultipleButtonLineComponentProps> {
    private static _IDGenerator = 0;
    private _id = FileMultipleButtonLineComponent._IDGenerator++;
    private _uploadInputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IFileMultipleButtonLineComponentProps) {
        super(props);
        this._uploadInputRef = React.createRef();
    }

    onChange(evt: any) {
        const files: File[] = evt.target.files;
        if (files && files.length) {
            this.props.onClick(evt);
        }

        evt.target.value = "";
    }

    render() {
        return (
            <div className="buttonLine">
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                <label htmlFor={"file-upload" + this._id} className="file-upload">
                    {this.props.label}
                </label>
                <input ref={this._uploadInputRef} id={"file-upload" + this._id} type="file" accept={this.props.accept} onChange={(evt) => this.onChange(evt)} multiple />
            </div>
        );
    }
}
