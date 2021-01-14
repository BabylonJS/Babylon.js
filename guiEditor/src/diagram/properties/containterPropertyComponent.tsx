
import { Container } from "babylonjs-gui";
import * as React from "react";
import { ButtonLineComponent } from "../../sharedUiComponents/lines/buttonLineComponent";
import { LineContainerComponent } from "../../sharedUiComponents/lines/lineContainerComponent";
import { TextLineComponent } from "../../sharedUiComponents/lines/textLineComponent";
import { IContainerComponentProps} from './propertyComponentProps';

export class ContainerPropertyTabComponent extends React.Component<IContainerComponentProps> {
    constructor(props: IContainerComponentProps) {
        super(props);
    }

    AddElement()
    {
        let newElementName = window.prompt("Please enter name of the element");

        if (!newElementName) {
            return;
        }

        //var childGuiNode = this.props.globalState.workbench.findNodeFromGuiElement(newElementName);
        //this.props.guiNode.addGui(childGuiNode);
    }

    
    render() {

        var guiElementMenu: JSX.Element[] = [];
        var guiNode = this.props.guiNode.guiControl as Container;
        guiNode.children.forEach(child => {
            guiElementMenu.push(<TextLineComponent label={child.name}></TextLineComponent>);           
        });

        

        return (
            <>                
                <LineContainerComponent title="CONTAINER PROPERTIES"> 
                {guiElementMenu}               
                <ButtonLineComponent label="Add element" onClick={() => {
                    this.AddElement();
                }} />
                </LineContainerComponent>            
            </>
        );
    }
}