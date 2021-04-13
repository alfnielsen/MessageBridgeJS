import { Message } from "./Message";
export declare enum MessageType {
    Command = "Command",
    CommandResponse = "CommandResponse",
    Query = "Query",
    QueryResponse = "QueryResponse",
    Event = "Event",
    Error = "Error"
}
export declare type SubscribeResponse<TMessageType> = (payload: TMessageType, bridgeMessage: Message<TMessageType>) => void;
export declare type SubscribeResponseWithCatch<TMessageType, TErrorMessageType = any> = {
    onSuccess?: SubscribeResponse<TMessageType>;
    onError?: SubscribeResponse<TErrorMessageType>;
};
export interface IMessageServiceQuerySubscription<TQuery, TResponse> {
    name: string;
    query: TQuery;
    triggers: string[];
    onUpdate: SubscribeResponse<TResponse>;
}
export declare enum MessageDirection {
    ToClient = "ToClient",
    ToServer = "ToServer"
}
//# sourceMappingURL=MessageBridgeInterfaces.d.ts.map