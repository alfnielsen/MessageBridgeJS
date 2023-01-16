/// <reference types="node" />
import { Message, RequestResponse, SubscribeEvent, InternalTrackedRequest, OmitAndOptional, OnTimeoutHandler, RequestOptions, BridgeOptions, RequestMaybeNoError, SendMessageOptions, CreatedMessage, CreatedEvent, EventOptions } from "./MessageBridgeTypes";
export declare abstract class MessageBridgeServiceBase {
    wsUri: string;
    connected: boolean;
    trackedRequestMap: {
        [trackId: string]: InternalTrackedRequest<any, any>;
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
    cancelRequest(trackId: string): void;
    protected onConnect(): void;
    protected onError(err?: unknown, eventOrData?: unknown): void;
    protected onClose(err?: unknown, eventOrData?: unknown): void;
    protected setOptionalRequestTimeout<TRequest = any, TSchema = any>({ requestMessage, timeout, onTimeout, }: {
        requestMessage: Message<TRequest, TSchema>;
        timeout: number | undefined;
        onTimeout: OnTimeoutHandler<string, TRequest>;
    }): NodeJS.Timeout | undefined;
    sendMessageTracked<TRequest = any, TResponse = any, TError = any, TSchema = any>(opt: SendMessageOptions<TRequest, TResponse, TError, TSchema>): Promise<RequestResponse<TRequest, TResponse, TError>>;
    /**
     * Only resolve the promise with the TResponse (not the tracked/full response)
     * onSuccess contains the response in the first argument (and the the tracked/full response in the second argument)
     */
    sendMessage<TRequest = any, TResponse = any, TError = any, TSchema = any>(opt: SendMessageOptions<TRequest, TResponse, TError, TSchema>): Promise<TResponse>;
    protected sendMessagePromiseHandler<TRequest = any, TResponse = any, TError = any, TSchema = any>({ handleError, handleSuccess, requestMessage, requestOptions, }: SendMessageOptions<TRequest, TResponse, TError, TSchema> & {
        handleError: (cancelled: boolean, response: RequestResponse<TRequest, TResponse, TError>, error?: RequestMaybeNoError<any, TRequest>) => void;
        handleSuccess: (cancelled: boolean, response: RequestResponse<TRequest, TResponse, TError>) => void;
    }): void;
    private handleCancelOptions;
    private handleCancelResponse;
    subscribeEvent<TResponse = any>({ name, onEvent, }: {
        name: string | string[];
        onEvent: SubscribeEvent<TResponse>;
    }): () => void;
    private createTrackedMessage;
    createCommand<TRequest = any, TResponse = any, TError = any, TSchema = any>(requestOptions: RequestOptions<TRequest, TResponse>): CreatedMessage<TRequest, TResponse, TError, TSchema>;
    createQuery<TRequest = any, TResponse = any, TError = any, TSchema = any>(requestOptions: RequestOptions<TRequest, TResponse>): CreatedMessage<TRequest, TResponse, TError, TSchema>;
    sendCommand<TRequest = any, TResponse = any, TError = any, TSchema = any>(requestOptions: RequestOptions<TRequest, TResponse>): Promise<TResponse>;
    sendCommandTracked<TRequest = any, TResponse = any, TError = any, TSchema = any>(requestOptions: RequestOptions<TRequest, TResponse>): Promise<RequestResponse<TRequest, TResponse, TError>>;
    sendQuery<TRequest = any, TResponse = any, TError = any, TSchema = any>(requestOptions: RequestOptions<TRequest, TResponse>): Promise<TResponse>;
    sendQueryTracked<TRequest = any, TResponse = any, TError = any, TSchema = any>(requestOptions: RequestOptions<TRequest, TResponse, TError>): Promise<RequestResponse<TRequest, TResponse, TError>>;
    createEvent<TPayload = any>(eventOptions: EventOptions<TPayload>): CreatedEvent<TPayload>;
    sendEvent<TPayload = any>(eventOptions: OmitAndOptional<Message<TPayload>, "trackId" | "created" | "isError" | "type", "direction">): void;
    protected onMessage(messageString: string | Message): void;
    protected internalSendMessage(msg: Message): void;
    protected handleIncomingMessage(msg: Message): void;
    protected receiveEventMessage(eventMsg: Message): void;
}
//# sourceMappingURL=MessageBridgeServiceBase.d.ts.map