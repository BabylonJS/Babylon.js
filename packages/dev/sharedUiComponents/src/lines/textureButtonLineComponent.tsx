import { faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Scene } from "core/scene";
import * as React from "react";

interface ITextureButtonLineProps {
    label: string;
    scene: Scene;
    onClick: (file: File) => void;
    onLink: (texture: BaseTexture) => void;
    accept: string;
}

interface ITextureButtonLineState {
    isOpen: boolean;
}

export class TextureButtonLine extends React.Component<ITextureButtonLineProps, ITextureButtonLineState> {
    private static _IdGenerator = 0;
    private _id = TextureButtonLine._IdGenerator++;
    private _uploadInputRef: React.RefObject<HTMLInputElement>;

    constructor(props: ITextureButtonLineProps) {
        super(props);
        this._uploadInputRef = React.createRef();

        this.state = {
            isOpen: false,
        };
    }

    onChange(evt: any) {
        const files: File[] = evt.target.files;
        if (files && files.length) {
            this.props.onClick(files[0]);
        }

        evt.target.value = "";
    }

    override render() {
        return (
            <div className="textureButtonLine" onPointerLeave={() => this.setState({ isOpen: false })}>
                <label htmlFor={"file-upload" + this._id} className="file-upload">
                    {this.props.label}
                </label>
                <input ref={this._uploadInputRef} id={"file-upload" + this._id} type="file" accept={this.props.accept} onChange={(evt) => this.onChange(evt)} />
                <div className="dropdownButton" onClick={() => this.setState({ isOpen: !this.state.isOpen })} title="Link to a texture">
                    <FontAwesomeIcon icon={faLink} />
                </div>
                <div className={"dropdown" + (this.state.isOpen ? "" : " hidden")}>
                    {this.props.scene.textures
                        .filter((t) => t.name)
                        .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
                        .map((texture, index) => {
                            return (
                                <div key={index} className="dropdownItem" onClick={() => this.props.onLink(texture)} title={texture.name}>
                                    {texture.displayName || texture.name}
                                </div>
                            );
                        })}
                </div>
            </div>
        );
    }
}
