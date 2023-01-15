// Typescript util
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

export type OmitAndOptional<
  T,
  TOmit extends keyof T,
  TOpt extends keyof Omit<T, TOmit>,
> = Pick<Partial<Omit<T, TOmit>>, TOpt> & Omit<Omit<T, TOmit>, TOpt>

// bridge
export type BridgeOptions = {
  // Add listeners:
  onMessage?: (msg: Message) => void
  onSend?: (msg: Message) => void
  onError?: (err?: unknown /*Error*/, eventOrData?: unknown) => void
  onClose?: (err?: unknown /*Error*/, eventOrData?: unknown) => void
  onConnect?: () => void
  // Interception:
  // - can be used to generalize behavior (Happens as early as possible in the process)
  // Happens just after user options is applied. Before stored in track map and before any other actions.
  interceptSendMessage?: (msg: Message) => Message // (default: undefined)
  // Happens after message-string parsing, but before stored in history, onMessage and all other actions
  // To get request for the message use: getTrackedRequestMessage(trackId: string): Message | undefined
  interceptReceivedMessage?: (msg: Message) => Message // (default: undefined)
  // Handle errors and timeouts:
  avoidThrowOnNonTrackedError?: boolean // (default: undefined)
  throwOnTrackedError?: boolean // (default: undefined)
  timeout?: number // (default: undefined)
  // Debugging options:
  timeoutFromBridgeOptionsMessage?: (ms: number) => string // (has default implementation)
  timeoutFromRequestOptionsMessage?: (ms: number) => string // (has default implementation)
  keepHistoryForReceivedMessages?: boolean // (default: false)
  keepHistoryForSendingMessages?: boolean // (default: false)
  logger?: (...data: any[]) => void // set custom logger (default: console?.log)
  logParseIncomingMessageError?: boolean // (default: true)
  logParseIncomingMessageErrorFormat?: (err: unknown) => any[] // (has default implementation)
  logMessageReceived?: boolean // log all messages received
  logMessageReceivedFormat?: (msg: Message) => any[] // (has default implementation)
  logSendingMessage?: boolean // log all messages sent
  logSendingMessageFormat?: (msg: Message) => any[] // (has default implementation)
  logMessageReceivedFilter?: undefined | string | RegExp // restrict logging to messages matching this filter
  logSendingMessageFilter?: undefined | string | RegExp // restrict logging to messages matching this filter
}
// enums (These are runtime enums)
export enum MessageType {
  Command = "Command",
  CommandResponse = "CommandResponse",
  Query = "Query",
  QueryResponse = "QueryResponse",
  Event = "Event",
  Error = "Error",
}

export enum MessageDirection {
  ToClient = "ToClient",
  ToServer = "ToServer",
}

// types (Not runtime)
export type Message<TPayload = any, TSchema = any> = {
  module?: string
  name: string
  type: MessageType
  isError: boolean
  trackId: string
  created: string
  payload: TPayload
  schema?: TSchema
  direction: MessageDirection
}

// Request
export type RequestResponse<TRequest, TResponse, TError = any> = {
  response: TResponse
  request: TRequest
  responseMessage: Message<TResponse>
  requestMessage: Message<TRequest>
  isError?: boolean
  error?: TError
  errorMessage?: Message<TError>
}

export type RequestOptionsTracked<TRequest, TResponse, TError = any> = {
  name: string
  payload: TRequest
  onSuccess?: SubscribeResponseTracked<TRequest, TResponse>
  onError?: SubscribeErrorResponseTracked<TRequest, TResponse, TError>
  module?: string
  timeout?: number
}

export type SendMessageOptions<
  TRequest = any,
  TResponse = any,
  TError = any,
  TSchema = any,
> = {
  requestMessage: Message<TRequest, TSchema>
  onSuccess?: SubscribeResponseTracked<TRequest, TResponse>
  onError?: SubscribeErrorResponseTracked<TRequest, TResponse, TError>
  timeout?: number
}

export type SubscribeResponseAsync<TRequest, TResponse> = (
  opt: RequestResponse<TRequest, TResponse>,
) => Promise<RequestResponse<TRequest, TResponse>>

export type SubscribeResponseTracked<TRequest, TResponse> = (
  opt: RequestResponse<TRequest, TResponse>,
) => void

export type SubscribeResponseWithCallbacks<TRequest, TResponse, TError = any> = {
  onSuccess?: SubscribeResponseAsync<TRequest, TResponse>
  onError?: SubscribeErrorAsync<TError, TRequest>
  requestMessage: Message<TRequest>
}

export type SubscribeEvent<TResponse> = (
  payload: TResponse,
  eventMessage: Message<TResponse>,
) => void

// Error
export type RequestError<TError = any, TRequest = any> = {
  reason?: TError
  request: TRequest
  responseMessage?: Message<TError>
  requestMessage: Message<TRequest>
}

export type RequestMaybeNoError<TError = any, TRequest = any> = {
  reason?: TError
  request: TRequest
  responseMessage?: Message<TError>
  requestMessage: Message<TRequest>
}

export type SubscribeErrorAsync<TError = any, TRequest = any> = (
  opt: RequestMaybeNoError<TError, TRequest>,
) => Promise<RequestResponse<TError, TRequest>>

export type SubscribeError<TError = any, TRequest = any> = (
  opt: RequestMaybeNoError<TError, TRequest>,
) => void

export type SubscribeErrorResponseTracked<
  TRequest = any,
  TResponse = any,
  TError = any,
> = (opt: RequestResponse<TRequest, TResponse, TError>) => void

// Internal Tracked
// used by tracking (No return value '=> void', it uses promise 'resolve')
export type InternalTrackedSubscribeResponse<TResponse> = (
  responseMessage: Message<TResponse>,
) => void

export type InternalTrackedSubscribeError<TError> = (
  responseMessage: Message<TError> | undefined,
) => void

export type InternalTrackedSubscribeResponseWithCatch<
  TRequest,
  TResponse,
  TError = any,
> = {
  successTrack?: InternalTrackedSubscribeResponse<TResponse>
  errorTrack?: InternalTrackedSubscribeError<TError>
  requestMessage: Message<TRequest>
}
