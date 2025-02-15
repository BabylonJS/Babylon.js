import { Logger } from "core/Misc/logger";

export const enum FlowGraphAction {
    ExecuteBlock = "ExecuteBlock",
    ExecuteEvent = "ExecuteEvent",
    TriggerConnection = "TriggerConnection",
    ContextVariableSet = "ContextVariableSet",
    GlobalVariableSet = "GlobalVariableSet",
    GlobalVariableDelete = "GlobalVariableDelete",
    GlobalVariableGet = "GlobalVariableGet",
    AddConnection = "AddConnection",
    GetConnectionValue = "GetConnectionValue",
    SetConnectionValue = "SetConnectionValue",
    ActivateSignal = "ActivateSignal",
    ContextVariableGet = "ContextVariableGet",
}
export interface IFlowGraphLogItem {
    time?: number;
    className: string;
    uniqueId: string;
    action: FlowGraphAction;
    payload?: any;
}

/**
 * This class will be responsible of logging the flow graph activity.
 * Note that using this class might reduce performance, as it will log every action, according to the configuration.
 * It attaches to a flow graph and uses meta-programming to replace the methods of the flow graph to add logging abilities.
 */
export class FlowGraphLogger {
    public logToConsole: boolean = false;

    public log: IFlowGraphLogItem[] = [];

    public addLogItem(item: IFlowGraphLogItem) {
        if (!item.time) {
            item.time = Date.now();
        }
        this.log.push(item);
        if (this.logToConsole) {
            const value = item.payload?.value;
            if (typeof value === "object" && value.getClassName) {
                Logger.Log(`[FGLog] ${item.className}:${item.uniqueId.split("-")[0]} ${item.action} - ${JSON.stringify(value.getClassName())}: ${value.toString()}`);
            } else {
                Logger.Log(`[FGLog] ${item.className}:${item.uniqueId.split("-")[0]} ${item.action} - ${JSON.stringify(item.payload)}`);
            }
        }
    }

    public getItemsOfType(action: FlowGraphAction): IFlowGraphLogItem[] {
        return this.log.filter((i) => i.action === action);
    }
}
