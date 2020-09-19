export class PropertyChangedEvent {
    public object: any;
    public property: string;
    public value: any;
    public initialValue: any;
    public allowNullValue?: boolean;
}