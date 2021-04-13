import * as signalR from "@microsoft/signalr";
import { Message } from "./Message";
import { IMessageServiceQuerySubscription, MessageDirection, SubscribeResponse, SubscribeResponseWithCatch } from "./MessageBridgeInterfaces";
export declare class MessageBridgeService {
    wsUri: string;
    connected: boolean;
    connection?: signalR.HubConnection;
    constructor(wsUri: string);
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
    sendEvent<TPayload = any, TResponse = any, TSchema = any>({ name, payload }: {
        name: string;
        payload: TPayload;
    }): Message<TPayload, any, any>;
    subscribeQuery<TPayload = any, TResponse = any>(opt: IMessageServiceQuerySubscription<TPayload, TResponse>): () => void;
    onError(err: string): void;
    connect(): Promise<void>;
    protected handleIncomingMessage(messageDto: Message): void;
    protected receiveEventMessage(eventMsg: Message): void;
    protected internalSendMessage(msg: Message): void;
}
//# sourceMappingURL=MessageBridgeService.d.ts.map