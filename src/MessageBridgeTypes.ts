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
  onSuccess?: (msg: RequestResponse) => void
  onClose?: (err?: unknown /*Error*/, eventOrData?: unknown) => void
  onConnect?: () => void
  // Can be used to send a cancel request to the server
  onCancel?: (msg: Message) => void
  // Interception:
  // - can be used to generalize behavior (Happens as early as possible in the process)
  // Happens just after user options is applied. Before stored in track map and before any other actions.
  interceptSendMessage?: (msg: Message) => Message // (default: undefined)
  // Happens after message-string parsing, but before stored in history, onMessage and all other actions
  // To get request for the message use: getTrackedRequestMessage(trackId: string): Message | undefined
  interceptReceivedMessage?: (msg: Message) => Message // (default: undefined)
  // Happens after the options for createMessage is applied)
  interceptCreatedMessageOptions?: (msg: CreatedMessage) => CreatedMessage // (default: undefined)
  interceptCreatedEventMessageOptions?: (msg: CreatedEvent) => CreatedEvent // (default: undefined)
  // Handle errors and timeouts:
  avoidThrowOnNonTrackedError?: boolean // (default: undefined)
  throwOnTrackedError?: boolean // (default: undefined)
  timeout?: number // (default: undefined)
  // Cancel
  // resolve on cancel (Let the process that did the request handle the cancel)
  resolveCancelledNonTrackedRequest?: boolean // (default: undefined)
  sendCancelledRequest?: boolean // (default: undefined)
  callOnErrorWhenRequestIsCancelled?: boolean // (default: undefined)
  callOnSuccessWhenRequestIsCancelled?: boolean // (default: undefined)
  // if true, the response can still have a value, else it will be undefined
  allowResponseValueWhenCancelled?: boolean // (default: undefined)
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
  cancelled?: boolean
  timedOut?: boolean
  trackId: string
  created: string
  payload: TPayload
  schema?: TSchema
  direction: MessageDirection
}

// Request
export type RequestResponse<TRequest = any, TResponse = any, TError = any> = {
  response: TResponse
  request: TRequest
  responseMessage: Message<TResponse>
  requestMessage: Message<TRequest>
  requestOptions: RequestOptions<TRequest, TResponse, TError>
  isError?: boolean
  error?: TError
  errorMessage?: Message<TError>
  cancelled?: boolean
  timedOut?: boolean
}

export type RequestOptions<TRequest, TResponse, TError = any> = {
  name: string
  payload: TRequest
  onSuccess?: TrackedOnSuccess<TRequest, TResponse>
  onError?: TrackedOnError<TRequest, TResponse, TError>
  module?: string
  timeout?: number
  resolveCancelledForNonTracked?: boolean
  sendCancelled?: boolean
  callOnErrorWhenRequestIsCancelled?: boolean
  callOnSuccessWhenRequestIsCancelled?: boolean
  allowResponseValueWhenCancelled?: boolean
}

export type SendMessageOptions<
  TRequest = any,
  TResponse = any,
  TError = any,
  TSchema = any,
> = {
  requestMessage: Message<TRequest, TSchema>
  requestOptions: RequestOptions<TRequest, TResponse, TError>
}

export type CreatedMessage<
  TRequest = any,
  TResponse = any,
  TError = any,
  TSchema = any,
> = {
  trackId: string
  requestMessage: Message<TRequest, TSchema>
  requestOptions: RequestOptions<TRequest, TResponse, TError>
  send: () => Promise<TResponse>
  sendTracked: () => Promise<RequestResponse<TRequest, TResponse, TError>>
  cancel: () => void
}

export type CreatedEvent<TPayload = any> = {
  trackId: string
  requestMessage: Message<TPayload>
  requestOptions: EventOptions<TPayload>
  send: () => void
  cancel: () => void
}

export type EventOptions<TPayload = any> = {
  name: string
  payload: TPayload
  module?: string
  sendCancelled?: boolean
}

export type TrackedOnSuccess<TRequest, TResponse> = (
  opt: RequestResponse<TRequest, TResponse>,
) => void

export type TrackedOnError<TRequest = any, TResponse = any, TError = any> = (
  opt: RequestResponse<TRequest, TResponse, TError>,
) => void

export type SubscribeEvent<TResponse> = (
  payload: TResponse,
  eventMessage: Message<TResponse>,
) => void

// Error
export type RequestMaybeNoError<TError = any, TRequest = any> = {
  reason?: TError
  request: TRequest
  responseMessage?: Message<TError>
  requestMessage: Message<TRequest>
}

export type OnTimeoutHandler<TError = any, TRequest = any> = (
  opt: RequestMaybeNoError<TError, TRequest>,
) => void

// Internal Tracked
// used by tracking (No return value '=> void', it uses promise 'resolve')
export type InternalTrackedOnSuccess<TResponse> = (
  responseMessage: Message<TResponse>,
) => void

export type InternalTrackedOnError<TError> = (
  responseMessage: Message<TError> | undefined,
) => void

export type InternalTrackedRequest<TRequest, TResponse, TError = any> = {
  successTrack: InternalTrackedOnSuccess<TResponse>
  errorTrack: InternalTrackedOnError<TError>
  requestMessage: Message<TRequest>
  requestOptions: RequestOptions<TRequest, TResponse, TError>
}
