import * as React from "react";
import { GlobalState } from '../globalState';

interface IFooterFileButtonProps {
    globalState: GlobalState;
    enabled: boolean;
    icon: any;
    label: string;
    onFilesPicked: (files: FileList | null) => void;
}

export class FooterFileButton extends React.Component<IFooterFileButtonProps> {

    onFilePicked(evt: React.ChangeEvent<HTMLInputElement>) {
        this.props.onFilesPicked(evt.target.files);
    }

    public render() {
        if (!this.props.enabled) {
            return null;
        }

        return (
            <div className="custom-upload" title={this.props.label}>
                <img src={this.props.icon}/>
                <input type="file" id="files" multiple onChange={evt => this.onFilePicked(evt)}/>
            </div>
        )
    }
}