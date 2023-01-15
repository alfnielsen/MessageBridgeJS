// Typescript util
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

export type OmitAndOptional<
  T,
  TOmit extends keyof T,
  TOpt extends keyof Omit<T, TOmit>,
> = Pick<Partial<Omit<T, TOmit>>, TOpt> & Omit<Omit<T, TOmit>, TOpt>

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
export type RequestResponse<TRequest, TResponse> = {
  response: TResponse
  request: TRequest
  responseMessage: Message<TResponse>
  requestMessage: Message<TRequest>
}

export type SubscribeResponseAsync<TRequest, TResponse> = (
  opt: RequestResponse<TRequest, TResponse>,
) => Promise<RequestResponse<TRequest, TResponse>>

export type SubscribeResponse<TRequest, TResponse> = (
  opt: RequestResponse<TRequest, TResponse>,
) => void

export type SubscribeResponseWithCatch<TRequest, TResponse, TError = any> = {
  onSuccess?: SubscribeResponseAsync<TRequest, TResponse>
  onError?: SubscribeErrorAsync<TError, TRequest>
  requestMessage: Message<TRequest>
}

export type SubscribeEvent<TResponse> = (
  payload: TResponse,
  bridgeMessage: Message<TResponse>,
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

// Internal Tracked
// used by tracking (No return value '=> void', it uses promise 'resolve')
export type InternalTrackedSubscribeResponse<TResponse> = (opt: {
  response: TResponse
  responseMessage: Message<TResponse>
}) => void

export type InternalTrackedSubscribeError<TError> = (opt: {
  reason: TError | undefined
  responseMessage: Message<TError> | undefined
}) => void

export type InternalTrackedSubscribeResponseWithCatch<
  TRequest,
  TResponse,
  TError = any,
> = {
  onSuccess?: InternalTrackedSubscribeResponse<TResponse>
  onError?: InternalTrackedSubscribeError<TError>
  requestMessage: Message<TRequest>
}
