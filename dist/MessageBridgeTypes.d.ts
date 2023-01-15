export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type OmitAndOptional<T, TOmit extends keyof T, TOpt extends keyof Omit<T, TOmit>> = Pick<Partial<Omit<T, TOmit>>, TOpt> & Omit<Omit<T, TOmit>, TOpt>;
export type BridgeOptions = {
    onMessage?: (msg: Message) => void;
    onSend?: (msg: Message) => void;
    onError?: (err?: unknown, eventOrData?: unknown) => void;
    onClose?: (err?: unknown, eventOrData?: unknown) => void;
    onConnect?: () => void;
    interceptSendMessage?: (msg: Message) => Message;
    interceptReceivedMessage?: (msg: Message) => Message;
    avoidThrowOnNonTrackedError?: boolean;
    throwOnTrackedError?: boolean;
    timeout?: number;
    timeoutFromBridgeOptionsMessage?: (ms: number) => string;
    timeoutFromRequestOptionsMessage?: (ms: number) => string;
    keepHistoryForReceivedMessages?: boolean;
    keepHistoryForSendingMessages?: boolean;
    logger?: (...data: any[]) => void;
    logParseIncomingMessageError?: boolean;
    logParseIncomingMessageErrorFormat?: (err: unknown) => any[];
    logMessageReceived?: boolean;
    logMessageReceivedFormat?: (msg: Message) => any[];
    logSendingMessage?: boolean;
    logSendingMessageFormat?: (msg: Message) => any[];
    logMessageReceivedFilter?: undefined | string | RegExp;
    logSendingMessageFilter?: undefined | string | RegExp;
};
export declare enum MessageType {
    Command = "Command",
    CommandResponse = "CommandResponse",
    Query = "Query",
    QueryResponse = "QueryResponse",
    Event = "Event",
    Error = "Error"
}
export declare enum MessageDirection {
    ToClient = "ToClient",
    ToServer = "ToServer"
}
export type Message<TPayload = any, TSchema = any> = {
    module?: string;
    name: string;
    type: MessageType;
    isError: boolean;
    trackId: string;
    created: string;
    payload: TPayload;
    schema?: TSchema;
    direction: MessageDirection;
};
export type RequestResponse<TRequest, TResponse, TError = any> = {
    response: TResponse;
    request: TRequest;
    responseMessage: Message<TResponse>;
    requestMessage: Message<TRequest>;
    isError?: boolean;
    error?: TError;
    errorMessage?: Message<TError>;
};
export type RequestOptionsTracked<TRequest, TResponse, TError = any> = {
    name: string;
    payload: TRequest;
    onSuccess?: SubscribeResponseTracked<TRequest, TResponse>;
    onError?: SubscribeErrorResponseTracked<TRequest, TResponse, TError>;
    module?: string;
    timeout?: number;
};
export type SendMessageOptions<TRequest = any, TResponse = any, TError = any, TSchema = any> = {
    requestMessage: Message<TRequest, TSchema>;
    onSuccess?: SubscribeResponseTracked<TRequest, TResponse>;
    onError?: SubscribeErrorResponseTracked<TRequest, TResponse, TError>;
    timeout?: number;
};
export type SubscribeResponseAsync<TRequest, TResponse> = (opt: RequestResponse<TRequest, TResponse>) => Promise<RequestResponse<TRequest, TResponse>>;
export type SubscribeResponseTracked<TRequest, TResponse> = (opt: RequestResponse<TRequest, TResponse>) => void;
export type SubscribeResponseWithCallbacks<TRequest, TResponse, TError = any> = {
    onSuccess?: SubscribeResponseAsync<TRequest, TResponse>;
    onError?: SubscribeErrorAsync<TError, TRequest>;
    requestMessage: Message<TRequest>;
};
export type SubscribeEvent<TResponse> = (payload: TResponse, eventMessage: Message<TResponse>) => void;
export type RequestError<TError = any, TRequest = any> = {
    reason?: TError;
    request: TRequest;
    responseMessage?: Message<TError>;
    requestMessage: Message<TRequest>;
};
export type RequestMaybeNoError<TError = any, TRequest = any> = {
    reason?: TError;
    request: TRequest;
    responseMessage?: Message<TError>;
    requestMessage: Message<TRequest>;
};
export type SubscribeErrorAsync<TError = any, TRequest = any> = (opt: RequestMaybeNoError<TError, TRequest>) => Promise<RequestResponse<TError, TRequest>>;
export type SubscribeError<TError = any, TRequest = any> = (opt: RequestMaybeNoError<TError, TRequest>) => void;
export type SubscribeErrorResponseTracked<TRequest = any, TResponse = any, TError = any> = (opt: RequestResponse<TRequest, TResponse, TError>) => void;
export type InternalTrackedSubscribeResponse<TResponse> = (responseMessage: Message<TResponse>) => void;
export type InternalTrackedSubscribeError<TError> = (responseMessage: Message<TError> | undefined) => void;
export type InternalTrackedSubscribeResponseWithCatch<TRequest, TResponse, TError = any> = {
    successTrack?: InternalTrackedSubscribeResponse<TResponse>;
    errorTrack?: InternalTrackedSubscribeError<TError>;
    requestMessage: Message<TRequest>;
};
//# sourceMappingURL=MessageBridgeTypes.d.ts.map