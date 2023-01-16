export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type OmitAndOptional<T, TOmit extends keyof T, TOpt extends keyof Omit<T, TOmit>> = Pick<Partial<Omit<T, TOmit>>, TOpt> & Omit<Omit<T, TOmit>, TOpt>;
export type BridgeOptions = {
    onMessage?: (msg: Message) => void;
    onSend?: (msg: Message) => void;
    onError?: (err?: unknown, eventOrData?: unknown) => void;
    onSuccess?: (msg: RequestResponse) => void;
    onClose?: (err?: unknown, eventOrData?: unknown) => void;
    onConnect?: () => void;
    onCancel?: (msg: Message) => void;
    interceptSendMessage?: (msg: Message) => Message;
    interceptReceivedMessage?: (msg: Message) => Message;
    interceptCreatedMessageOptions?: (msg: CreatedMessage) => CreatedMessage;
    interceptCreatedEventMessageOptions?: (msg: CreatedEvent) => CreatedEvent;
    avoidThrowOnNonTrackedError?: boolean;
    throwOnTrackedError?: boolean;
    timeout?: number;
    resolveCancelledNonTrackedRequest?: boolean;
    sendCancelledRequest?: boolean;
    callOnErrorWhenRequestIsCancelled?: boolean;
    callOnSuccessWhenRequestIsCancelled?: boolean;
    allowResponseValueWhenCancelled?: boolean;
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
    cancelled?: boolean;
    timedOut?: boolean;
    trackId: string;
    created: string;
    payload: TPayload;
    schema?: TSchema;
    direction: MessageDirection;
};
export type RequestResponse<TRequest = any, TResponse = any, TError = any> = {
    response: TResponse;
    request: TRequest;
    responseMessage: Message<TResponse>;
    requestMessage: Message<TRequest>;
    requestOptions: RequestOptions<TRequest, TResponse, TError>;
    isError?: boolean;
    error?: TError;
    errorMessage?: Message<TError>;
    cancelled?: boolean;
    timedOut?: boolean;
};
export type RequestOptions<TRequest, TResponse, TError = any> = {
    name: string;
    payload: TRequest;
    onSuccess?: TrackedOnSuccess<TRequest, TResponse>;
    onError?: TrackedOnError<TRequest, TResponse, TError>;
    module?: string;
    timeout?: number;
    resolveCancelledForNonTracked?: boolean;
    sendCancelled?: boolean;
    callOnErrorWhenRequestIsCancelled?: boolean;
    callOnSuccessWhenRequestIsCancelled?: boolean;
    allowResponseValueWhenCancelled?: boolean;
};
export type SendMessageOptions<TRequest = any, TResponse = any, TError = any, TSchema = any> = {
    requestMessage: Message<TRequest, TSchema>;
    requestOptions: RequestOptions<TRequest, TResponse, TError>;
};
export type CreatedMessage<TRequest = any, TResponse = any, TError = any, TSchema = any> = {
    trackId: string;
    requestMessage: Message<TRequest, TSchema>;
    requestOptions: RequestOptions<TRequest, TResponse, TError>;
    send: () => Promise<TResponse>;
    sendTracked: () => Promise<RequestResponse<TRequest, TResponse, TError>>;
    cancel: () => void;
};
export type CreatedEvent<TPayload = any> = {
    trackId: string;
    requestMessage: Message<TPayload>;
    requestOptions: EventOptions<TPayload>;
    send: () => void;
    cancel: () => void;
};
export type EventOptions<TPayload = any> = {
    name: string;
    payload: TPayload;
    module?: string;
    sendCancelled?: boolean;
};
export type TrackedOnSuccess<TRequest, TResponse> = (opt: RequestResponse<TRequest, TResponse>) => void;
export type TrackedOnError<TRequest = any, TResponse = any, TError = any> = (opt: RequestResponse<TRequest, TResponse, TError>) => void;
export type SubscribeEvent<TResponse> = (payload: TResponse, eventMessage: Message<TResponse>) => void;
export type RequestMaybeNoError<TError = any, TRequest = any> = {
    reason?: TError;
    request: TRequest;
    responseMessage?: Message<TError>;
    requestMessage: Message<TRequest>;
};
export type OnTimeoutHandler<TError = any, TRequest = any> = (opt: RequestMaybeNoError<TError, TRequest>) => void;
export type InternalTrackedOnSuccess<TResponse> = (responseMessage: Message<TResponse>) => void;
export type InternalTrackedOnError<TError> = (responseMessage: Message<TError> | undefined) => void;
export type InternalTrackedRequest<TRequest, TResponse, TError = any> = {
    successTrack: InternalTrackedOnSuccess<TResponse>;
    errorTrack: InternalTrackedOnError<TError>;
    requestMessage: Message<TRequest>;
    requestOptions: RequestOptions<TRequest, TResponse, TError>;
};
//# sourceMappingURL=MessageBridgeTypes.d.ts.map