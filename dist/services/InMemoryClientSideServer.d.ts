import { Message, MessageType } from "../MessageBridgeTypes";
import { MessageBridgeClientServer } from "./ClientSideMessageBridgeService";
export type RequestErrorResponse = {
    message: string;
    request?: Message | string;
    stack?: string;
    error?: unknown;
};
export type RequestHandler<TRequest = any, TResponse = any, TStore = any> = (opt: {
    requestMessage: Message<TRequest, TResponse>;
    request: TRequest;
    store: TStore;
    event: (name: string, payload: any) => void;
    error: (reason: any) => void;
    response: (response: TResponse) => void;
}) => void;
export type RequestEventHandler<TRequest = any, TResponse = any, TStore = any> = (opt: {
    requestMessage: Message<TRequest, TResponse>;
    request: TRequest;
    store: TStore;
    event: (name: string, payload: any) => void;
    error: (reason: any) => void;
}) => void;
export declare class InMemoryClientSideServer<TStore> implements MessageBridgeClientServer {
    store: TStore;
    commands: {
        [name: string]: RequestHandler<any, any, any>;
    };
    queries: {
        [name: string]: RequestHandler<any, any, any>;
    };
    eventListeners: {
        [name: string]: RequestEventHandler<any, any, any>;
    };
    saveToLocalStorage(key: string): void;
    loadFromLocalStorage(key: string): void;
    sendMessage?: (msg: Message<RequestErrorResponse>) => void;
    connect(sendMessage: (msg: Message) => void): void;
    sendError(payload: RequestErrorResponse, trackId?: string): void;
    sendResponse(type: MessageType, name: string, payload: any, trackId: string): void;
    sendEvent(name: string, payload: any): void;
    onMessage(requestMessage: Message | string): void;
    serverHandleCommand(requestMessage: Message): void;
    serverHandleQuery(requestMessage: Message): void;
    serverHandleEvent(requestMessage: Message): void;
    addCommand<TCommand = any, TResponse = any>(name: string, handler: RequestHandler<TCommand, TResponse, TStore>): void;
    addQuery<TQuery = any, TResponse = any>(name: string, handler: RequestHandler<TQuery, TResponse, TStore>): void;
    addEventListener<TEvent = any>(name: string, handler: RequestEventHandler<TEvent, void, TStore>): void;
}
//# sourceMappingURL=InMemoryClientSideServer.d.ts.map