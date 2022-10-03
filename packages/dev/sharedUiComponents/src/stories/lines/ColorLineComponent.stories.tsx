import { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../../propertyChangedEvent";
import type { IColorLineComponentProps } from "../../components/lines/ColorLineComponent";
import { ColorLineComponent } from "../../components/lines/ColorLineComponent";

export default { component: ColorLineComponent };

const propertyChangedObservable = new Observable<PropertyChangedEvent>();

export const Default = {
    render: (args: IColorLineComponentProps) => (
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <ColorLineComponent {...args} />
        </div>
    ),
    args: { target: {}, label: "test", propertyName: "test", lockObject: { lock: false }, onPropertyChangedObservable: propertyChangedObservable },
};
