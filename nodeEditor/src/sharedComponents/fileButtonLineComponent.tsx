import * as React from "react";

interface IFileButtonLineComponentProps {
    label: string;
    onClick: (file: File) => void;
    accept: string;
}

export class FileButtonLineComponent extends React.Component<IFileButtonLineComponentProps> {
    private uploadRef: React.RefObject<HTMLInputElement>;

    constructor(props: IFileButtonLineComponentProps) {
        super(props);

        this.uploadRef = React.createRef();
    }

    onChange(evt: any) {
        var files: File[] = evt.target.files;
        if (files && files.length) {
            this.props.onClick(files[0]);
        }

        evt.target.value = "";
    }

    render() {
        return (
            <div className="buttonLine">
                <label htmlFor="file-upload" className="file-upload">
                    {this.props.label}
                </label>
                <input ref={this.uploadRef} id="file-upload" type="file" accept={this.props.accept} onChange={evt => this.onChange(evt)} />
            </div>
        );
    }
}
