import { createMessage } from "../MessageBridgeHelper"
import { Message, MessageDirection, MessageType } from "../MessageBridgeTypes"
import { MessageBridgeClientServer } from "./ClientSideMessageBridgeService"

export type RequestErrorResponse = {
  message: string
  request?: Message | string
  stack?: string
  error?: unknown
}

export type RequestHandler<TRequest = any, TResponse = any, TStore = any> = (opt: {
  requestMessage: Message<TRequest, TResponse>
  request: TRequest
  store: TStore
  event: (name: string, payload: any) => void
  error: (reason: any, cancelled?: boolean, timedOut?: boolean) => void
  response: (response: TResponse) => void
  sendResponseMessage: (responseMessage: Message<TRequest, TResponse>) => void
  createResponseMessage(response: TResponse): Message<TRequest, TResponse>
}) => void

export type RequestEventHandler<TRequest = any, TResponse = any, TStore = any> = (opt: {
  requestMessage: Message<TRequest, TResponse>
  request: TRequest
  store: TStore
  event: (name: string, payload: any) => void
  error: (reason: any) => void
}) => void

export class InMemoryClientSideServer<TStore> implements MessageBridgeClientServer {
  store = {} as TStore
  commands = {} as { [name: string]: RequestHandler }
  queries = {} as { [name: string]: RequestHandler }
  eventListeners = {} as { [name: string]: RequestEventHandler }

  saveToLocalStorage(key: string) {
    localStorage.setItem(key, JSON.stringify(this.store))
  }
  loadFromLocalStorage(key: string) {
    const store = localStorage.getItem(key)
    if (store) {
      this.store = JSON.parse(store) as TStore
    }
  }

  sendMessage?: (msg: Message<RequestErrorResponse>) => void

  connect(sendMessage: (msg: Message) => void) {
    this.sendMessage = sendMessage
  }

  sendError(
    payload: RequestErrorResponse,
    trackId?: string,
    cancelled?: boolean,
    timedOut?: boolean,
  ) {
    const errorMsg = createMessage({
      trackId,
      type: MessageType.Error,
      name: "Error",
      payload: payload,
      direction: MessageDirection.ToClient,
      cancelled,
      timedOut,
    })
    //console.log("SERVER: sendError", errorMsg)
    this.sendMessage?.(errorMsg)
  }

  createMessage(opt: { type: MessageType; name: string; payload: any; trackId: string }) {
    const responseMessage = createMessage({
      ...opt,
      direction: MessageDirection.ToClient,
    })
    return responseMessage
  }

  sendResponse(opt: { type: MessageType; name: string; payload: any; trackId: string }) {
    const responseMessage = this.createMessage(opt)
    //console.log("SERVER: sendResponse", responseMessage)
    this.sendMessage?.(responseMessage)
  }

  sendEvent(name: string, payload: any) {
    const responseMessage = createMessage({
      type: MessageType.Event,
      name,
      payload,
      direction: MessageDirection.ToClient,
    })
    this.sendMessage?.(responseMessage)
  }

  onMessage(requestMessage: Message | string) {
    //console.log("SERVER: onMessage", requestMessage)
    if (typeof requestMessage === "string") {
      try {
        requestMessage = JSON.parse(requestMessage) as Message
      } catch (e) {
        this.sendError({
          message: `Error parsing message: ${e}`,
          request: requestMessage,
          error: e,
          stack: (e as any)?.stack,
        })
        console.error("Error parsing message", e)
        return
      }
    }
    if (requestMessage.type === "Command") {
      if (!this.commands[requestMessage.name]) {
        this.sendError(
          {
            message: `Command ${requestMessage.name} not found (Register it with addCommand)`,
            request: requestMessage,
          },
          requestMessage.trackId,
        )
        return
      }
      this.serverHandleCommand(requestMessage)
    }
    if (requestMessage.type === "Query") {
      if (!this.queries[requestMessage.name]) {
        this.sendError(
          {
            message: `Query ${requestMessage.name} not found (Register it with addQuery)`,
            request: requestMessage,
          },
          requestMessage.trackId,
        )
        return
      }
      this.serverHandleQuery(requestMessage)
    }
    if (requestMessage.type === "Event") {
      if (!this.eventListeners[requestMessage.name]) {
        this.sendError(
          {
            message: `Event ${requestMessage.name} not found (Register it with addEvent)`,
            request: requestMessage,
          },
          requestMessage.trackId,
        )
        return
      }
      this.serverHandleEvent(requestMessage)
    }
  }
  serverHandleCommand(requestMessage: Message) {
    const handler = this.commands[requestMessage.name]
    const sendResponseMessage = (responseMessage: Message) => {
      this.sendMessage?.(responseMessage)
    }
    const createResponseMessage = (response: any) => {
      return this.createMessage({
        name: requestMessage.name,
        type: MessageType.CommandResponse,
        payload: response,
        trackId: requestMessage.trackId,
      })
    }
    const sendResponse = (response: any) => {
      const message = createResponseMessage(response)
      sendResponseMessage(message)
    }
    const sendError = (reason: any, cancelled?: boolean, timedOut?: boolean) => {
      this.sendError(
        {
          message: reason,
          request: requestMessage,
        },
        requestMessage.trackId,
        cancelled,
        timedOut,
      )
    }
    const fireEvent = (name: string, payload: any) => {
      this.sendEvent(name, payload)
    }
    try {
      handler({
        requestMessage: requestMessage,
        request: requestMessage.payload,
        store: this.store,
        error: sendError,
        event: fireEvent,
        response: sendResponse,
        createResponseMessage,
        sendResponseMessage,
      })
    } catch (e) {
      sendError({
        message: `Error in command handler for '${requestMessage.name}'`,
        requestMessage: requestMessage,
        error: e,
        stack: (e as any)?.stack,
      })
    }
  }

  serverHandleQuery(requestMessage: Message) {
    const handler = this.queries[requestMessage.name]
    const sendResponseMessage = (responseMessage: Message) => {
      this.sendMessage?.(responseMessage)
    }
    const createResponseMessage = (response: any) => {
      return this.createMessage({
        name: requestMessage.name,
        type: MessageType.QueryResponse,
        payload: response,
        trackId: requestMessage.trackId,
      })
    }
    const sendResponse = (response: any) => {
      const message = createResponseMessage(response)
      sendResponseMessage(message)
    }
    const sendError = (reason: any, cancelled?: boolean, timedOut?: boolean) => {
      this.sendError(
        {
          message: reason,
          request: requestMessage,
        },
        requestMessage.trackId,
        cancelled,
        timedOut,
      )
    }
    const fireEvent = (name: string, payload: any) => {
      this.sendEvent(name, payload)
    }
    handler({
      requestMessage: requestMessage,
      request: requestMessage.payload,
      store: this.store,
      error: sendError,
      event: fireEvent,
      response: sendResponse,
      createResponseMessage,
      sendResponseMessage,
    })
  }
  serverHandleEvent(requestMessage: Message) {
    const handler = this.eventListeners[requestMessage.name]
    const sendError = (reason: any) => {
      this.sendError(
        {
          message: reason,
          request: requestMessage,
        },
        requestMessage.trackId,
      )
    }
    const fireEvent = (name: string, payload: any) => {
      this.sendEvent(name, payload)
    }

    handler({
      requestMessage: requestMessage,
      request: requestMessage.payload,
      store: this.store,
      error: sendError,
      event: fireEvent,
    })
  }
  // In memory message bridge service
  addCommand<TCommand = any, TResponse = any>(
    name: string,
    handler: RequestHandler<TCommand, TResponse, TStore>,
  ) {
    this.commands[name] = handler
  }
  addQuery<TQuery = any, TResponse = any>(
    name: string,
    handler: RequestHandler<TQuery, TResponse, TStore>,
  ) {
    this.queries[name] = handler
  }
  addEventListener<TEvent = any>(
    name: string,
    handler: RequestEventHandler<TEvent, void, TStore>,
  ) {
    this.eventListeners[name] = handler
  }
}
