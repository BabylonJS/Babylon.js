import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface IAnimationCurveEditorComponentProps {
    close: (event: any) => void;
    title: string;
}

export class AnimationCurveEditorComponent extends React.Component<IAnimationCurveEditorComponentProps, { isOpen: boolean }> {

    constructor(props: IAnimationCurveEditorComponentProps) {
        super(props);
    }

    render() {
        return (
            <div>
                <div className="header">
                    <div>{this.props.title}</div>
                    <div style={{width:48, height:48}} className="close" onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => this.props.close(event)}>
                        <FontAwesomeIcon icon={faTimes} />
                    </div>
                </div>
            </div>
        );
    }
}