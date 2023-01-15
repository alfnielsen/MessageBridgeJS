import {
  Message,
  MessageDirection,
  MessageType,
  RequestResponse,
  SubscribeEvent,
  InternalTrackedSubscribeResponseWithCatch,
  OmitAndOptional,
  SubscribeError,
  RequestOptionsTracked,
  BridgeOptions,
  RequestMaybeNoError,
  SendMessageOptions,
} from "./MessageBridgeTypes"

import {
  createCommandMessage,
  createEventMessage,
  createMessageFromDto,
  createQueryMessage,
} from "./MessageBridgeHelper"

export abstract class MessageBridgeServiceBase {
  connected = false
  debugLogger: (...data: any[]) => void = console?.log ?? (() => {}) // set custom logger
  debugLogging = {
    messageReceived: false,
    sendingMessage: false,
    messageReceivedFilter: undefined as undefined | string | RegExp,
    sendingMessageFilter: undefined as undefined | string | RegExp,
  }

  subscribedTrackIdMap: {
    [trackId: string]: InternalTrackedSubscribeResponseWithCatch<any, any>
  } = {}

  subscribedEventListMap: {
    [eventName: string]: SubscribeEvent<any>[]
  } = {}

  history: Message[] = []
  bridgeErrors: unknown[] /*Error*/ = []

  options: BridgeOptions = {}

  constructor(public wsUri: string) {}

  abstract connect(options?: unknown): Promise<void>
  abstract close(): void
  abstract sendNetworkMessage(msg: Message): void

  setOptions(opt: BridgeOptions) {
    this.options = { ...this.options, ...opt }
  }

  // the following methods can overwritten with class inheritance
  // but should override version should call super.methodName()
  onConnect() {
    this.connected = true
    this.options.onConnect?.()
  }
  onError(err?: unknown /*Error*/, eventOrData?: unknown) {
    if (err !== undefined) {
      this.bridgeErrors.push(err)
    }
    this.options.onError?.(err, eventOrData)
  }
  onClose(err?: unknown /*Error*/, eventOrData?: unknown) {
    if (err !== undefined) {
      this.bridgeErrors.push(err)
    }
    this.connected = false
    this.options.onClose?.(err, eventOrData)
  }

  // base methods (should mostly not be overwritten)

  setOptionalRequestTimeout<TRequest = any, TSchema = any>({
    requestMessage,
    timeout,
    onTimeout,
  }: {
    requestMessage: Message<TRequest, TSchema>
    timeout: number | undefined
    onTimeout: SubscribeError<string, TRequest>
  }) {
    let reason: string
    let timeoutMs: number | undefined
    if (this.options.timeout !== undefined) {
      reason = `Timeout after ${this.options.timeout}ms (Set in BridgeOptions.timeout)`
      timeoutMs = this.options.timeout
    }
    if (timeout !== undefined) {
      reason = `Timeout after ${timeout}ms (Set in RequestOptions.timeout)`
      timeoutMs = timeout
    }
    if (timeoutMs === undefined) {
      return
    }
    return setTimeout(() => {
      const opt: RequestMaybeNoError<string, TRequest> = {
        reason,
        responseMessage: undefined,
        request: requestMessage.payload,
        requestMessage,
      }
      onTimeout(opt)
    }, timeoutMs)
  }

  sendMessageTracked<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    opt: SendMessageOptions<TRequest, TResponse, TError, TSchema>,
  ) {
    return new Promise<RequestResponse<TRequest, TResponse, TError>>(
      (resolve, reject) => {
        this.sendMessagePromiseHandler({
          ...opt,
          handleResponseReject: (isError, response) => {
            if (isError) {
              if (this.options.throwOnTrackedError) {
                reject(response)
              } else {
                resolve(response)
              }
            } else {
              resolve(response)
            }
          },
        })
      },
    ).finally(() => {
      delete this.subscribedTrackIdMap[opt.requestMessage.trackId]
    })
  }

  /**
   * Only resolve the promise with the TResponse (not the tracked/full response)
   * onSuccess contains the response in the first argument (and the the tracked/full response in the second argument)
   */
  sendMessage<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    opt: SendMessageOptions<TRequest, TResponse, TError, TSchema>,
  ) {
    return new Promise<TResponse>((resolve, reject) => {
      this.sendMessagePromiseHandler({
        ...opt,
        handleResponseReject: (isError, response, error) => {
          if (isError) {
            if (this.options.avoidThrowOnNonTrackedError) {
              //@ts-ignore (The response is not the correct type, but we ignore it)
              resolve(error?.payload)
            } else {
              reject(response)
            }
          } else {
            resolve(response.response)
          }
        },
      })
    })
  }

  private sendMessagePromiseHandler<
    TRequest = any,
    TResponse = any,
    TError = any,
    TSchema = any,
  >({
    handleResponseReject,
    requestMessage,
    onSuccess,
    onError,
    timeout,
  }: SendMessageOptions<TRequest, TResponse, TError, TSchema> & {
    handleResponseReject: (
      isError: boolean,
      response: RequestResponse<TRequest, TResponse, TError>,
      error?: RequestMaybeNoError<any, TRequest>,
    ) => void
  }) {
    requestMessage.direction = MessageDirection.ToServer
    // handle error and timeout
    const handleError = (errOpt: RequestMaybeNoError<any, TRequest>) => {
      if (optionalTimeId) {
        clearTimeout(optionalTimeId)
      }
      // resolve with error
      const resolveWithError: RequestResponse<TRequest, TResponse, TError> = {
        //@ts-ignore (The response is not the correct type, but we ignore it)
        response: undefined,
        //@ts-ignore (The response is not the correct type, but we ignore it)
        responseMessage: undefined,
        request: requestMessage.payload,
        requestMessage,
        isError: true,
        error: errOpt.reason,
        errorMessage: errOpt.responseMessage,
      }
      this.onError(resolveWithError)
      onError?.(resolveWithError)
      handleResponseReject(true, resolveWithError, errOpt)
    }
    // set timeout if needed
    const optionalTimeId = this.setOptionalRequestTimeout({
      requestMessage,
      timeout,
      onTimeout: (timeoutErrorMessage) => {
        handleError(timeoutErrorMessage)
      },
    })
    // add to subscribedTrackIdMap
    this.subscribedTrackIdMap[requestMessage.trackId] = {
      successTrack: (responseMessage) => {
        const opt: RequestResponse<TRequest, TResponse, TError> = {
          response: responseMessage.payload,
          responseMessage,
          request: requestMessage.payload,
          requestMessage,
          isError: false,
        }
        if (optionalTimeId) {
          clearTimeout(optionalTimeId)
        }
        onSuccess?.(opt)
        handleResponseReject(false, opt, undefined)
      },
      errorTrack: (responseMessage) => {
        const opt: RequestMaybeNoError<TError, TRequest> = {
          reason: responseMessage?.payload,
          responseMessage,
          request: requestMessage.payload,
          requestMessage,
        }
        handleError(opt)
      },
      requestMessage: requestMessage,
    } as InternalTrackedSubscribeResponseWithCatch<TRequest, TResponse, TError>
    // send message
    this.internalSendMessage(requestMessage)
  }

  subscribeEvent<TResponse = any>({
    name,
    onEvent,
  }: {
    name: string | string[]
    onEvent: SubscribeEvent<TResponse>
  }): () => void {
    if (Array.isArray(name)) {
      const unsubs = name.map((_name) => this.subscribeEvent({ name: _name, onEvent }))
      return () => unsubs.forEach((unsub) => unsub())
    }
    if (!this.subscribedEventListMap[name]) this.subscribedEventListMap[name] = []
    this.subscribedEventListMap[name].push(onEvent)
    return () => {
      const index = this.subscribedEventListMap[name].findIndex((x) => x === onEvent)
      this.subscribedEventListMap[name].splice(index, 1)
    }
  }

  sendCommand<TRequest = any, TResponse = any, TSchema = any>(
    opt: RequestOptionsTracked<TRequest, TResponse>,
  ) {
    const msg = createCommandMessage(opt)
    return this.sendMessage<TRequest, TResponse, TSchema>({
      requestMessage: msg,
      onSuccess: opt.onSuccess,
      onError: opt.onError,
      timeout: opt.timeout,
    })
  }

  sendCommandTracked<TRequest = any, TResponse = any, TSchema = any>(
    opt: RequestOptionsTracked<TRequest, TResponse>,
  ) {
    const msg = createCommandMessage(opt)
    return this.sendMessageTracked<TRequest, TResponse, TSchema>({
      requestMessage: msg,
      onSuccess: opt.onSuccess,
      onError: opt.onError,
      timeout: opt.timeout,
    })
  }

  sendQuery<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    opt: RequestOptionsTracked<TRequest, TResponse>,
  ) {
    const msg = createQueryMessage(opt)
    return this.sendMessage<TRequest, TResponse, TError, TSchema>({
      requestMessage: msg,
      onSuccess: opt.onSuccess,
      onError: opt.onError,
      timeout: opt.timeout,
    })
  }

  sendQueryTracked<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    opt: RequestOptionsTracked<TRequest, TResponse, TError>,
  ) {
    const msg = createQueryMessage(opt)
    return this.sendMessageTracked<TRequest, TResponse, TError, TSchema>({
      requestMessage: msg,
      onSuccess: opt.onSuccess,
      onError: opt.onError,
      timeout: opt.timeout,
    })
  }

  sendEvent<TPayload = any>(
    top: OmitAndOptional<
      Message<TPayload>,
      "trackId" | "created" | "isError" | "type",
      "direction"
    >,
  ) {
    const msg = createEventMessage(top)
    msg.direction = MessageDirection.ToServer
    this.internalSendMessage(msg)
    return msg
  }

  protected onMessage(messageString: string | Message) {
    //console.log("onMessage", messageString)
    let messageDto: Message
    try {
      messageDto =
        typeof messageString === "string"
          ? (JSON.parse(messageString) as Message)
          : messageString
    } catch (e) {
      this.onError(e as Error)
      //console.log("Incorrect message received: " + messageString)
      return
    }
    try {
      const msg = createMessageFromDto(messageDto)
      if (this.debugLogging.messageReceived) {
        let log = true
        if (this.debugLogging.messageReceivedFilter) {
          log = !!msg.name.match(this.debugLogging.messageReceivedFilter)
        }
        if (log) {
          this.debugLogger("Bridge (messageReceived): ", msg)
        }
      }
      this.handleIncomingMessage(msg)
    } catch (e) {
      this.onError(e as Error)
      console.log("Error in response handle for message: " + e)
    }
  }

  protected internalSendMessage(msg: Message) {
    this.history.push(msg)
    if (this.debugLogging.sendingMessage) {
      let log = true
      if (this.debugLogging.sendingMessageFilter) {
        log = !!msg.name.match(this.debugLogging.sendingMessageFilter)
      }
      if (log) {
        this.debugLogger("Bridge (sendingMessage): ", msg)
      }
    }
    this.options.onSend?.(msg)
    this.sendNetworkMessage(msg)
  }

  protected handleIncomingMessage(msg: Message) {
    //console.log("handleIncomingMessage", msg)
    this.history.push(msg)
    this.options.onMessage?.(msg)

    let errorHandled = msg.type !== MessageType.Error

    if (msg.type === MessageType.Event) {
      this.receiveEventMessage(msg)
      return
    }
    const trackMsg = this.subscribedTrackIdMap[msg.trackId]
    if (trackMsg) {
      if (msg.type === MessageType.Error) {
        trackMsg.errorTrack?.(msg)
        errorHandled = true
      } else {
        trackMsg.successTrack?.(msg)
      }
      delete this.subscribedTrackIdMap[msg.trackId]
    }

    if (!errorHandled) {
      this.onError?.(msg)
    }
  }

  protected receiveEventMessage(eventMsg: Message) {
    if (this.subscribedEventListMap[eventMsg.name]) {
      this.subscribedEventListMap[eventMsg.name].forEach((callback) =>
        callback(eventMsg.payload, eventMsg),
      )
    }
  }
}
