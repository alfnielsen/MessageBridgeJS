/// <reference types="node" />
import { Message, RequestResponse, SubscribeEvent, InternalTrackedSubscribeResponseWithCatch, OmitAndOptional, SubscribeError, RequestOptionsTracked, BridgeOptions, RequestMaybeNoError, SendMessageOptions } from "./MessageBridgeTypes";
export declare abstract class MessageBridgeServiceBase {
    wsUri: string;
    connected: boolean;
    subscribedTrackIdMap: {
        [trackId: string]: InternalTrackedSubscribeResponseWithCatch<any, any>;
    };
    subscribedEventListMap: {
        [eventName: string]: SubscribeEvent<any>[];
    };
    history: Message[];
    bridgeErrors: unknown[];
    options: BridgeOptions;
    constructor(wsUri: string);
    abstract connect(options?: unknown): Promise<void>;
    abstract close(): void;
    abstract sendNetworkMessage(msg: Message): void;
    setOptions(opt: BridgeOptions): void;
    getTrackedRequestMessage(trackId: string): Message | undefined;
    protected onConnect(): void;
    protected onError(err?: unknown, eventOrData?: unknown): void;
    protected onClose(err?: unknown, eventOrData?: unknown): void;
    protected setOptionalRequestTimeout<TRequest = any, TSchema = any>({ requestMessage, timeout, onTimeout, }: {
        requestMessage: Message<TRequest, TSchema>;
        timeout: number | undefined;
        onTimeout: SubscribeError<string, TRequest>;
    }): NodeJS.Timeout | undefined;
    sendMessageTracked<TRequest = any, TResponse = any, TError = any, TSchema = any>(opt: SendMessageOptions<TRequest, TResponse, TError, TSchema>): Promise<RequestResponse<TRequest, TResponse, TError>>;
    /**
     * Only resolve the promise with the TResponse (not the tracked/full response)
     * onSuccess contains the response in the first argument (and the the tracked/full response in the second argument)
     */
    sendMessage<TRequest = any, TResponse = any, TError = any, TSchema = any>(opt: SendMessageOptions<TRequest, TResponse, TError, TSchema>): Promise<TResponse>;
    protected sendMessagePromiseHandler<TRequest = any, TResponse = any, TError = any, TSchema = any>({ handleResponseReject, requestMessage, onSuccess, onError, timeout, }: SendMessageOptions<TRequest, TResponse, TError, TSchema> & {
        handleResponseReject: (isError: boolean, response: RequestResponse<TRequest, TResponse, TError>, error?: RequestMaybeNoError<any, TRequest>) => void;
    }): void;
    subscribeEvent<TResponse = any>({ name, onEvent, }: {
        name: string | string[];
        onEvent: SubscribeEvent<TResponse>;
    }): () => void;
    sendCommand<TRequest = any, TResponse = any, TSchema = any>(opt: RequestOptionsTracked<TRequest, TResponse>): Promise<TResponse>;
    sendCommandTracked<TRequest = any, TResponse = any, TSchema = any>(opt: RequestOptionsTracked<TRequest, TResponse>): Promise<RequestResponse<TRequest, TResponse, TSchema>>;
    sendQuery<TRequest = any, TResponse = any, TError = any, TSchema = any>(opt: RequestOptionsTracked<TRequest, TResponse>): Promise<TResponse>;
    sendQueryTracked<TRequest = any, TResponse = any, TError = any, TSchema = any>(opt: RequestOptionsTracked<TRequest, TResponse, TError>): Promise<RequestResponse<TRequest, TResponse, TError>>;
    sendEvent<TPayload = any>(top: OmitAndOptional<Message<TPayload>, "trackId" | "created" | "isError" | "type", "direction">): Message<undefined, any>;
    protected onMessage(messageString: string | Message): void;
    protected internalSendMessage(msg: Message): void;
    protected handleIncomingMessage(msg: Message): void;
    protected receiveEventMessage(eventMsg: Message): void;
}
//# sourceMappingURL=MessageBridgeServiceBase.d.ts.map