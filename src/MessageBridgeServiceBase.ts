import {
  Message,
  MessageDirection,
  MessageType,
  RequestResponse,
  SubscribeEvent,
  InternalTrackedRequest,
  OmitAndOptional,
  OnTimeoutHandler,
  RequestOptions,
  BridgeOptions,
  RequestMaybeNoError,
  SendMessageOptions,
  CreatedMessage,
  CreatedEvent,
  EventOptions,
} from "./MessageBridgeTypes"

import {
  createCommandMessage,
  createEventMessage,
  createMessageFromDto,
  createQueryMessage,
} from "./MessageBridgeHelper"

export abstract class MessageBridgeServiceBase {
  connected = false
  trackedRequestMap: {
    [trackId: string]: InternalTrackedRequest<any, any>
  } = {}

  subscribedEventListMap: {
    [eventName: string]: SubscribeEvent<any>[]
  } = {}

  history: Message[] = []
  bridgeErrors: unknown[] /*Error*/ = []

  options: BridgeOptions = {
    timeout: undefined,
    allowResponseValueWhenCancelled: false,
    keepHistoryForReceivedMessages: false,
    keepHistoryForSendingMessages: false,
    logger: (...data: any[]) => console?.log ?? (() => {}),
    logParseIncomingMessageError: true,
    timeoutFromBridgeOptionsMessage: (ms: number) =>
      `Timeout after ${ms}ms (BridgeOptions.timeout)`,
    timeoutFromRequestOptionsMessage: (ms: number) =>
      `Timeout after ${ms}ms (RequestOptions.timeout)`,
    logParseIncomingMessageErrorFormat: (err: unknown) => [
      "Bridge-Error (parse messageReceived):",
      err,
    ],
    logMessageReceived: false,
    logMessageReceivedFormat: (msg: Message) => ["Bridge (messageReceived):", msg],
    logSendingMessage: false,
    logSendingMessageFormat: (msg: Message) => ["Bridge (sendingMessage):", msg],
  }

  constructor(public wsUri: string) {}

  abstract connect(options?: unknown): Promise<void>
  abstract close(): void
  abstract sendNetworkMessage(msg: Message): void

  setOptions(opt: BridgeOptions) {
    this.options = { ...this.options, ...opt }
  }

  getTrackedRequestMessage(trackId: string): Message | undefined {
    return this.trackedRequestMap[trackId]?.requestMessage
  }

  // This will not cancel the request itself (on the server),
  // but set a cancel flag on the trackMap (so the response will be ignored)
  cancelRequest(trackId: string): void {
    if (this.trackedRequestMap[trackId]) {
      this.trackedRequestMap[trackId].requestMessage.cancelled = true
    }
  }

  // the following methods can overwritten with class inheritance
  // but should override version should call super.methodName()
  protected onConnect() {
    this.connected = true
    this.options.onConnect?.()
  }
  protected onError(err?: unknown /*Error*/, eventOrData?: unknown) {
    if (err !== undefined) {
      this.bridgeErrors.push(err)
    }
    this.options.onError?.(err, eventOrData)
  }
  protected onClose(err?: unknown /*Error*/, eventOrData?: unknown) {
    if (err !== undefined) {
      this.bridgeErrors.push(err)
    }
    this.connected = false
    this.options.onClose?.(err, eventOrData)
  }

  // base methods (should mostly not be overwritten)
  protected setOptionalRequestTimeout<TRequest = any, TSchema = any>({
    requestMessage,
    timeout,
    onTimeout,
  }: {
    requestMessage: Message<TRequest, TSchema>
    timeout: number | undefined
    onTimeout: OnTimeoutHandler<string, TRequest>
  }) {
    let reason: string
    let timeoutMs: number | undefined

    if (timeout !== undefined) {
      reason =
        this.options.timeoutFromRequestOptionsMessage?.(timeout) ??
        `timeout after ${timeout}`
      timeoutMs = timeout
    } else if (this.options.timeout !== undefined) {
      reason =
        this.options.timeoutFromBridgeOptionsMessage?.(this.options.timeout) ??
        `timeout after ${this.options.timeout}`
      timeoutMs = this.options.timeout
    }

    if (timeoutMs === undefined) {
      return
    }
    return setTimeout(() => {
      requestMessage.timedOut = true
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
    if (opt.requestMessage.cancelled) {
      let cancel = true
      if (opt.requestOptions.sendCancelled !== undefined) {
        cancel = !opt.requestOptions.sendCancelled
      } else if (this.options.sendCancelledRequest) {
        cancel = false
      }
      if (cancel) {
        // check cancel
        const cancelPromiseValue = {
          request: opt.requestMessage.payload,
          requestMessage: opt.requestMessage,
          cancelled: true,
          //responseMessage: undefined
          //response: undefined,
        } as RequestResponse<TRequest, TResponse, TError>
        return Promise.resolve(cancelPromiseValue)
      }
    }
    return new Promise<RequestResponse<TRequest, TResponse, TError>>(
      (resolve, reject) => {
        this.sendMessagePromiseHandler({
          ...opt,
          handleSuccess: (cancelled, response) => {
            resolve(response)
          },
          handleError: (cancelled, response) => {
            if (this.options.throwOnTrackedError) {
              reject(response)
            } else {
              resolve(response)
            }
          },
        })
      },
    ).finally(() => {
      delete this.trackedRequestMap[opt.requestMessage.trackId]
    })
  }

  /**
   * Only resolve the promise with the TResponse (not the tracked/full response)
   * onSuccess contains the response in the first argument (and the the tracked/full response in the second argument)
   */
  sendMessage<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    opt: SendMessageOptions<TRequest, TResponse, TError, TSchema>,
  ) {
    // check cancel
    const cancelPromiseValue = undefined as TResponse
    if (opt.requestMessage.cancelled) {
      let cancel = true
      if (opt.requestOptions.sendCancelled !== undefined) {
        cancel = !opt.requestOptions.sendCancelled
      } else if (this.options.sendCancelledRequest) {
        cancel = false
      }
      if (cancel) {
        return Promise.resolve(cancelPromiseValue)
      }
    }
    return new Promise<TResponse>((resolve, reject) => {
      this.sendMessagePromiseHandler({
        ...opt,
        handleSuccess: (cancelled, response) => {
          if (cancelled) {
            resolve(cancelPromiseValue)
            return
          }
          resolve(response.response)
        },
        handleError: (cancelled, response, error) => {
          if (cancelled) {
            resolve(cancelPromiseValue)
          }
          if (this.options.avoidThrowOnNonTrackedError) {
            //@ts-ignore (The response is not the correct type, but we ignore it)
            resolve(error?.payload)
          } else {
            reject(response)
          }
        },
      })
    })
  }

  protected sendMessagePromiseHandler<
    TRequest = any,
    TResponse = any,
    TError = any,
    TSchema = any,
  >({
    handleError,
    handleSuccess,
    requestMessage,
    requestOptions,
  }: SendMessageOptions<TRequest, TResponse, TError, TSchema> & {
    handleError: (
      cancelled: boolean,
      response: RequestResponse<TRequest, TResponse, TError>,
      error?: RequestMaybeNoError<any, TRequest>,
    ) => void
    handleSuccess: (
      cancelled: boolean,
      response: RequestResponse<TRequest, TResponse, TError>,
    ) => void
  }) {
    requestMessage.direction = MessageDirection.ToServer
    if (this.options.interceptSendMessage) {
      requestMessage = this.options.interceptSendMessage(requestMessage)
    }

    // handle error and timeout
    const handleErrorMessage = (
      cancelled: boolean,
      errOpt: RequestMaybeNoError<any, TRequest>,
    ) => {
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
        cancelled:
          requestMessage.cancelled ||
          errOpt.requestMessage?.cancelled ||
          errOpt.responseMessage?.cancelled,
        timedOut:
          requestMessage.timedOut ||
          errOpt.requestMessage?.timedOut ||
          errOpt.responseMessage?.timedOut,
      }
      if (
        !cancelled ||
        !this.options.callOnErrorWhenRequestIsCancelled ||
        !requestOptions.callOnErrorWhenRequestIsCancelled
      ) {
        this.onError(resolveWithError)
        requestOptions.onError?.(resolveWithError)
      }
      handleError(cancelled, resolveWithError, errOpt)
    }
    // set timeout if needed
    const optionalTimeId = this.setOptionalRequestTimeout({
      requestMessage,
      timeout: requestOptions.timeout,
      onTimeout: (timeoutErrorMessage) => {
        const cancelled = this.handleCancelOptions(requestOptions, requestMessage)
        handleErrorMessage(cancelled, timeoutErrorMessage)
      },
    })
    // add to subscribedTrackIdMap
    const track: InternalTrackedRequest<TRequest, TResponse, TError> = {
      successTrack: (responseMessage) => {
        const { response, cancelled } = this.handleCancelResponse<
          TRequest,
          TResponse,
          TError
        >(requestOptions, requestMessage, responseMessage)

        const opt: RequestResponse<TRequest, TResponse, TError> = {
          // 'response' be undefined if timedOut or response from server is undefined
          // Or be forced undefined if cancelled (bridge or request options)
          response: response as TResponse,
          responseMessage,
          requestOptions,
          request: requestMessage.payload,
          requestMessage,
          isError: false,
          cancelled: requestMessage.cancelled || responseMessage.cancelled,
          timedOut: requestMessage.timedOut || responseMessage.timedOut,
        }
        if (optionalTimeId) {
          clearTimeout(optionalTimeId)
        }

        if (
          !cancelled ||
          !!this.options.callOnSuccessWhenRequestIsCancelled ||
          !!requestOptions.callOnSuccessWhenRequestIsCancelled
        ) {
          this.options.onSuccess?.(opt)
          requestOptions.onSuccess?.(opt)
        }
        handleSuccess(cancelled, opt)
      },
      errorTrack: (responseMessage) => {
        const { response, cancelled } = this.handleCancelResponse<
          TRequest,
          TResponse,
          TError
        >(requestOptions, requestMessage, responseMessage)

        const opt: RequestMaybeNoError<TError, TRequest> = {
          // 'response' be undefined if timedOut or response from server is undefined
          // Or be forced undefined if cancelled (bridge or request options)
          reason: response as TError,
          responseMessage,
          request: requestMessage.payload,
          requestMessage,
        }
        handleErrorMessage(cancelled, opt)
      },
      requestMessage: requestMessage,
      requestOptions,
    }
    this.trackedRequestMap[requestMessage.trackId] = track

    // send message
    this.internalSendMessage(requestMessage)
  }

  private handleCancelOptions<
    TRequest = any,
    TResponse = any,
    TError = any,
    TSchema = any,
  >(
    requestOptions: RequestOptions<TRequest, TResponse, TError>,
    requestMessage: Message<TRequest, TSchema>,
    responseMessage?: Message<TResponse | TError, any>,
  ) {
    let resolveCancel = false
    if (requestOptions.resolveCancelledForNonTracked !== undefined) {
      resolveCancel = requestOptions.resolveCancelledForNonTracked
    } else if (this.options.resolveCancelledNonTrackedRequest) {
      resolveCancel = true
    }
    let cancelled = false
    if (responseMessage?.cancelled || requestMessage.cancelled) {
      cancelled = true
    }
    if (resolveCancel && cancelled) {
      cancelled = false
    }
    return cancelled
  }

  private handleCancelResponse<
    TRequest = any,
    TResponse = any,
    TError = any,
    TSchema = any,
  >(
    requestOptions: RequestOptions<TRequest, TResponse, TError>,
    requestMessage: Message<TRequest, TSchema>,
    responseMessage?: Message<TResponse | TError, any>,
  ) {
    const cancelled = this.handleCancelOptions(
      requestOptions,
      requestMessage,
      responseMessage,
    )
    let response = responseMessage?.payload
    if (cancelled) {
      if (requestOptions.allowResponseValueWhenCancelled !== undefined) {
        if (requestOptions.allowResponseValueWhenCancelled !== true) {
          response = undefined as TResponse
        }
      } else if (this.options.allowResponseValueWhenCancelled !== true) {
        response = undefined as TResponse
      }
    }
    return { response, cancelled }
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

  private createTrackedMessage<
    TRequest = any,
    TResponse = any,
    TError = any,
    TSchema = any,
  >(
    sendOptions: SendMessageOptions<TRequest, TResponse, TError, TSchema>,
  ): CreatedMessage<TRequest, TResponse, TError, TSchema> {
    const trackId = sendOptions.requestMessage.trackId
    let createdMessage: CreatedMessage = {
      trackId: trackId,
      requestMessage: sendOptions.requestMessage,
      requestOptions: sendOptions.requestOptions,
      send: () => this.sendMessage(sendOptions),
      sendTracked: () => this.sendMessageTracked(sendOptions),
      cancel: () => {
        // before run
        if (sendOptions?.requestMessage) {
          sendOptions.requestMessage.cancelled = true
        }
        // running
        this.cancelRequest(trackId)
      },
    }
    if (this.options.interceptCreatedMessageOptions) {
      createdMessage = this.options.interceptCreatedMessageOptions(createdMessage)
    }
    return createdMessage
  }

  createCommand<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    requestOptions: RequestOptions<TRequest, TResponse>,
  ): CreatedMessage<TRequest, TResponse, TError, TSchema> {
    const requestMessage = createCommandMessage(requestOptions)
    return this.createTrackedMessage<TRequest, TResponse, TError, TSchema>({
      requestMessage,
      requestOptions,
    })
  }

  createQuery<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    requestOptions: RequestOptions<TRequest, TResponse>,
  ): CreatedMessage<TRequest, TResponse, TError, TSchema> {
    const requestMessage = createQueryMessage(requestOptions)
    return this.createTrackedMessage<TRequest, TResponse, TError, TSchema>({
      requestMessage,
      requestOptions,
    })
  }

  sendCommand<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    requestOptions: RequestOptions<TRequest, TResponse>,
  ) {
    return this.createCommand<TRequest, TResponse, TError, TSchema>(requestOptions).send()
  }

  sendCommandTracked<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    requestOptions: RequestOptions<TRequest, TResponse>,
  ) {
    return this.createCommand<TRequest, TResponse, TError, TSchema>(
      requestOptions,
    ).sendTracked()
  }

  sendQuery<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    requestOptions: RequestOptions<TRequest, TResponse>,
  ) {
    return this.createQuery<TRequest, TResponse, TError, TSchema>(requestOptions).send()
  }

  sendQueryTracked<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    requestOptions: RequestOptions<TRequest, TResponse, TError>,
  ) {
    return this.createQuery<TRequest, TResponse, TError, TSchema>(
      requestOptions,
    ).sendTracked()
  }

  createEvent<TPayload = any>(
    eventOptions: EventOptions<TPayload>,
  ): CreatedEvent<TPayload> {
    let eventMessage = createEventMessage<TPayload>(eventOptions)
    eventMessage.direction = MessageDirection.ToServer
    let createdEvent: CreatedEvent = {
      trackId: eventMessage.trackId,
      requestMessage: eventMessage,
      requestOptions: eventOptions,
      cancel: () => {
        // before run
        if (eventMessage) {
          eventMessage.cancelled = true
        }
      },
      send: () => {
        if (eventMessage.cancelled) {
          if (eventOptions.sendCancelled !== undefined) {
            if (!eventOptions.sendCancelled) {
              return
            }
          } else if (!this.options.sendCancelledRequest) {
            return
          }
        }
        if (this.options.interceptSendMessage) {
          eventMessage = this.options.interceptSendMessage(eventMessage)
        }
        this.internalSendMessage(eventMessage)
      },
    }
    if (this.options.interceptCreatedEventMessageOptions) {
      createdEvent = this.options.interceptCreatedEventMessageOptions(createdEvent)
    }

    return createdEvent
  }

  sendEvent<TPayload = any>(
    eventOptions: OmitAndOptional<
      Message<TPayload>,
      "trackId" | "created" | "isError" | "type",
      "direction"
    >,
  ) {
    return this.createEvent<TPayload>(eventOptions).send()
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
      let msg = createMessageFromDto(messageDto)
      if (this.options.interceptReceivedMessage) {
        msg = this.options.interceptReceivedMessage(msg)
      }
      this.handleIncomingMessage(msg)
    } catch (e) {
      this.onError(e as Error)
      if (this.options.logger && this.options.logParseIncomingMessageError) {
        const logData = this.options.logParseIncomingMessageErrorFormat?.(messageDto) ?? [
          e,
        ]
        this.options.logger(logData)
      }
    }
  }

  protected internalSendMessage(msg: Message) {
    if (this.options.keepHistoryForSendingMessages) {
      this.history.push(msg)
    }
    if (this.options.logger && this.options.logSendingMessage) {
      let log = true
      if (this.options.logSendingMessageFilter) {
        log = !!msg.name.match(this.options.logSendingMessageFilter)
      }
      if (log) {
        const logData = this.options.logSendingMessageFormat?.(msg) ?? [msg]
        this.options.logger(...logData)
      }
    }
    this.options.onSend?.(msg)
    this.sendNetworkMessage(msg)
  }

  protected handleIncomingMessage(msg: Message) {
    //console.log("handleIncomingMessage", msg)
    if (this.options.keepHistoryForReceivedMessages) {
      this.history.push(msg)
    }
    if (this.options.logger && this.options.logMessageReceived) {
      let log = true
      if (this.options.logMessageReceivedFilter) {
        log = !!msg.name.match(this.options.logMessageReceivedFilter)
      }
      if (log) {
        const logData = this.options.logMessageReceivedFormat?.(msg) ?? [msg]
        this.options.logger(...logData)
      }
    }
    this.options.onMessage?.(msg)

    let errorHandled = msg.type !== MessageType.Error

    if (msg.type === MessageType.Event) {
      this.receiveEventMessage(msg)
      return
    }
    const trackMsg = this.trackedRequestMap[msg.trackId]
    if (trackMsg) {
      if (msg.type === MessageType.Error) {
        trackMsg.errorTrack(msg)
        errorHandled = true
      } else {
        trackMsg.successTrack(msg)
      }
      delete this.trackedRequestMap[msg.trackId]
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
