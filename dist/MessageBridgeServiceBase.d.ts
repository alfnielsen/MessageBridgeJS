import * as signalR from "@microsoft/signalr";
import { Message } from "./Message";
import { IMessageServiceQuerySubscription, MessageDirection, SubscribeResponse, SubscribeResponseWithCatch } from "./MessageBridgeInterfaces";
export declare abstract class MessageBridgeServiceBase {
    wsUri: string;
    connected: boolean;
    connection?: signalR.HubConnection;
    debugLogger: (...data: any[]) => void;
    debugLogging: {
        messageReceived: boolean;
        sendingMessage: boolean;
        messageReceivedFilter: string | RegExp | undefined;
        sendingMessageFilter: string | RegExp | undefined;
    };
    constructor(wsUri: string);
    abstract connect(options?: unknown): Promise<void>;
    abstract sendNetworkMessage(msg: Message): void;
    protected onMessage(messageString: string | Message): void;
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
    protected internalSendMessage(msg: Message): void;
    subscribeEvent<TResponse = any>({ name, onEvent, }: {
        name: string;
        onEvent: SubscribeResponse<TResponse>;
    }): () => void;
    createCommandMessage<TPayload = any, TResponse = any, TSchema = any>(name: string, payload: TPayload, direction?: MessageDirection, module?: string): Message<TPayload, TResponse, TSchema>;
    createQueryMessage<TPayload = any>(name: string, payload: TPayload, direction?: MessageDirection, module?: string): Message<TPayload, any, any>;
    createEventMessage<TPayload = any>(name: string, payload: TPayload, direction?: MessageDirection, module?: string): Message<TPayload, any, any>;
    sendCommand<TPayload = any, TResponse = any, TSchema = any>({ name, payload, onSuccess, onError, module, }: {
        name: string;
        payload: TPayload;
        onSuccess?: SubscribeResponse<TResponse>;
        onError?: SubscribeResponse<any>;
        module?: string;
    }): Message<TPayload, any, any>;
    sendQuery<TPayload = any, TResponse = any, TSchema = any>({ name, payload, onSuccess, onError, module, }: {
        name: string;
        payload: TPayload;
        onSuccess?: SubscribeResponse<TResponse>;
        onError?: SubscribeResponse<any>;
        module?: string;
    }): Message<TPayload, any, any>;
    sendEvent<TPayload = any, TResponse = any, TSchema = any>({ name, payload, module, }: {
        name: string;
        payload: TPayload;
        module?: string;
    }): Message<TPayload, any, any>;
    subscribeQuery<TPayload = any, TResponse = any>(opt: IMessageServiceQuerySubscription<TPayload, TResponse>): () => void;
    onError(err: Error): void;
    handleIncomingMessage(msg: Message): void;
    protected receiveEventMessage(eventMsg: Message): void;
}
//# sourceMappingURL=MessageBridgeServiceBase.d.ts.map