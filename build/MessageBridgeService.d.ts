import * as signalR from "@microsoft/signalr";
import { Message } from "./Message";
import { IMessageServiceQuerySubscription, MessageDirection, SubscribeResponse, SubscribeResponseWithCatch } from "./MessageBridgeInterfaces";
import { IHttpConnectionOptions } from "@microsoft/signalr/src/IHttpConnectionOptions";
import { ConnectionService } from "./ConnectionService";
export declare class MessageBridgeService {
    wsUri: string;
    connectionService?: ConnectionService | undefined;
    connected: boolean;
    connection?: signalR.HubConnection;
    constructor(wsUri: string, connectionService?: ConnectionService | undefined);
    protected subscriptionTrackIdList: {
        [trackId: string]: SubscribeResponseWithCatch<any>;
    };
    protected subscriptionEventList: {
        [eventName: string]: SubscribeResponse<any>[];
    };
    protected subscriptionQuery: IMessageServiceQuerySubscription<any, any>[];
    history: Message[];
    bridgeErrors: (Error | string)[];
    sendMessage<TPayload = any, TResponse = any, TSchema = any>(msg: Message<TPayload, TResponse, TSchema>, onSuccess?: SubscribeResponse<TResponse>, onError?: SubscribeResponse<any>): void;
    subscribeEvent<TResponse = any>({ name, onEvent, }: {
        name: string;
        onEvent: SubscribeResponse<TResponse>;
    }): () => void;
    createCommandMessage<TPayload = any, TResponse = any, TSchema = any>(name: string, payload: TPayload, direction?: MessageDirection): Message<TPayload, TResponse, TSchema>;
    createQueryMessage<TPayload = any>(name: string, payload: TPayload, direction?: MessageDirection): Message<TPayload, any, any>;
    createEventMessage<TPayload = any>(name: string, payload: TPayload, direction?: MessageDirection): Message<TPayload, any, any>;
    sendCommand<TPayload = any, TResponse = any, TSchema = any>({ name, payload, onSuccess, onError, }: {
        name: string;
        payload: TPayload;
        onSuccess?: SubscribeResponse<TResponse>;
        onError?: SubscribeResponse<any>;
    }): Message<TPayload, any, any>;
    sendQuery<TPayload = any, TResponse = any, TSchema = any>({ name, payload, onSuccess, onError, }: {
        name: string;
        payload: TPayload;
        onSuccess?: SubscribeResponse<TResponse>;
        onError?: SubscribeResponse<any>;
    }): Message<TPayload, any, any>;
    sendEvent<TPayload = any, TResponse = any, TSchema = any>({ name, payload, }: {
        name: string;
        payload: TPayload;
    }): Message<TPayload, any, any>;
    subscribeQuery<TPayload = any, TResponse = any>(opt: IMessageServiceQuerySubscription<TPayload, TResponse>): () => void;
    onError(err: Error): void;
    connect(options?: IHttpConnectionOptions): Promise<void> | undefined;
    handleIncomingMessage(msg: Message): void;
    protected receiveEventMessage(eventMsg: Message): void;
    protected internalSendMessage(msg: Message): void;
}
//# sourceMappingURL=MessageBridgeService.d.ts.map