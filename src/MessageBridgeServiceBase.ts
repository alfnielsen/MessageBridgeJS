import {
  Message,
  MessageDirection,
  MessageType,
  RequestResponse,
  SubscribeErrorAsync,
  SubscribeEvent,
  SubscribeResponseAsync,
  InternalTrackedSubscribeResponseWithCatch,
  OmitAndOptional,
  SubscribeResponse,
  SubscribeError,
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

  constructor(public wsUri: string) {}

  abstract connect(options?: unknown): Promise<void>
  abstract sendNetworkMessage(msg: Message): void

  subscribedTrackIdMap: {
    [trackId: string]: InternalTrackedSubscribeResponseWithCatch<any, any>
  } = {}

  subscribedEventListMap: {
    [eventName: string]: SubscribeEvent<any>[]
  } = {}

  history: Message[] = []
  bridgeErrors: (Error | string)[] = []

  sendMessage<TRequest = any, TResponse = any, TError = any, TSchema = any>(
    requestMessage: Message<TRequest, TSchema>,
    onSuccess?: SubscribeResponse<TRequest, TResponse>,
    onError?: SubscribeError<any, TRequest>,
  ) {
    requestMessage.direction = MessageDirection.ToServer
    this.internalSendMessage(requestMessage)

    // add chainable promise
    return new Promise<RequestResponse<TRequest, TResponse>>((resolve, reject) => {
      // wrap in promise to allow async (and run chains)
      this.subscribedTrackIdMap[requestMessage.trackId] = {
        onSuccess(responseOpt) {
          const opt = { ...responseOpt, request: requestMessage.payload, requestMessage }
          onSuccess?.(opt)
          resolve(opt)
        },
        onError(errorOpt) {
          const opt = { ...errorOpt, request: requestMessage.payload, requestMessage }
          onError?.(opt)
          reject(opt)
        },
        requestMessage: requestMessage,
      } as InternalTrackedSubscribeResponseWithCatch<TRequest, TResponse, TError>
    }).finally(() => {
      //console.log("finally")
      delete this.subscribedTrackIdMap[requestMessage.trackId]
    })
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

  sendCommand<TRequest = any, TResponse = any, TSchema = any>({
    name,
    payload,
    onSuccess,
    onError,
    module,
  }: {
    name: string
    payload: TRequest
    onSuccess?: SubscribeResponseAsync<TRequest, TResponse>
    onError?: SubscribeErrorAsync<any>
    module?: string
  }) {
    const msg = createCommandMessage({
      name,
      payload,
      module,
    })
    return this.sendMessage<TRequest, TResponse, TSchema>(msg, onSuccess, onError)
  }

  sendQuery<TRequest = any, TResponse = any, TSchema = any>({
    name,
    payload,
    onSuccess,
    onError,
    module,
  }: {
    name: string
    payload: TRequest
    onSuccess?: SubscribeResponse<TRequest, TResponse>
    onError?: SubscribeError<any>
    module?: string
  }) {
    const msg = createQueryMessage({
      name,
      payload,
      module,
    })
    return this.sendMessage<TRequest, TResponse, TSchema>(msg, onSuccess, onError)
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

  // can be overwritten by consumer!
  onError(err: Error) {
    this.bridgeErrors.push(err)
  }
  // can be overwritten by consumer!
  onClose(err: string | Error | undefined) {}

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
    this.sendNetworkMessage(msg)
  }

  protected handleIncomingMessage(msg: Message) {
    //console.log("handleIncomingMessage", msg)
    this.history.push(msg)
    if (msg.type === MessageType.Event) {
      this.receiveEventMessage(msg)
      return
    }
    const trackMsg = this.subscribedTrackIdMap[msg.trackId]
    if (trackMsg) {
      if (msg.type === MessageType.Error) {
        trackMsg.onError?.({
          reason: msg.payload,
          responseMessage: msg,
        })
      } else {
        trackMsg.onSuccess?.({
          response: msg.payload,
          responseMessage: msg,
        })
      }
      delete this.subscribedTrackIdMap[msg.trackId]
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
