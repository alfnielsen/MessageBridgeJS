import { createMessage } from "../MessageBridgeHelper"
import { MessageBridgeServiceBase } from "../MessageBridgeServiceBase"
import { Message, MessageDirection, MessageType } from "../MessageBridgeTypes"
import { MessageBridgeClientServer } from "./ClientSideMessageBridgeService"

export type RequestHandler<TRequest = any, TResponse = any, TStore = any> = (opt: {
  requestMessage: Message<TRequest, TResponse>
  store: TStore
  fireEvent: (name: string, payload: any) => void
  sendError: (reason: any) => void
}) => TResponse

export type RequestEventHandler<TRequest = any, TResponse = any, TStore = any> = (opt: {
  requestMessage: Message<TRequest, TResponse>
  store: TStore
  fireEvent: (name: string, payload: any) => void
  sendError: (reason: any) => void
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

  sendMessage?: (msg: Message) => void

  connect(sendMessage: (msg: Message) => void) {
    this.sendMessage = sendMessage
  }

  sendError(payload: any) {
    const errorMsg = createMessage({
      type: MessageType.Error,
      name: "Error",
      payload: payload,
      direction: MessageDirection.ToClient,
    })
    this.sendMessage?.(errorMsg)
  }

  sendResponse(type: MessageType, name: string, payload: any, trackId: string) {
    const responseMessage = createMessage({
      trackId,
      type,
      name,
      payload,
      direction: MessageDirection.ToClient,
    })
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
    if (typeof requestMessage === "string") {
      try {
        requestMessage = JSON.parse(requestMessage) as Message
      } catch (e) {
        this.sendError({
          message: `Error parsing message: ${e}`,
          request: requestMessage,
        })
        console.error("Error parsing message", e)
        return
      }
    }
    if (requestMessage.type === "Command") {
      if (!this.commands[requestMessage.name]) {
        this.sendError({
          message: `Command ${requestMessage.name} not found (Register it with addCommand)`,
          request: requestMessage,
        })
        return
      }
      this.serverHandleCommand(requestMessage)
    }
    if (requestMessage.type === "Query") {
      if (!this.queries[requestMessage.name]) {
        this.sendError({
          message: `Query ${requestMessage.name} not found (Register it with addQuery)`,
          request: requestMessage,
        })
        return
      }
      this.serverHandleQuery(requestMessage)
    }
    if (requestMessage.type === "Event") {
      if (!this.eventListeners[requestMessage.name]) {
        this.sendError({
          message: `Event ${requestMessage.name} not found (Register it with addEvent)`,
          request: requestMessage,
        })
        const errorMsg = createMessage({
          type: MessageType.Error,
          name: requestMessage.name,
          payload: `Event ${requestMessage.name} not found (Register it with addEvent)`,
          direction: MessageDirection.ToClient,
        })
        this.sendMessage?.(errorMsg)
        return
      }
      this.serverHandleEvent(requestMessage)
    }
  }
  serverHandleCommand(requestMessage: Message) {
    const handler = this.commands[requestMessage.name]
    const sendResponse = (response: any) => {
      this.sendResponse(
        MessageType.CommandResponse,
        requestMessage.name,
        response,
        requestMessage.trackId,
      )
    }
    const sendError = (reason: any) => {
      this.sendError({
        message: reason,
        request: requestMessage,
      })
    }
    const fireEvent = (name: string, payload: any) => {
      this.sendEvent(name, payload)
    }
    const result = handler({
      requestMessage: requestMessage,
      store: this.store,
      sendError,
      fireEvent,
    })
    sendResponse(result)
  }

  serverHandleQuery(requestMessage: Message) {
    const handler = this.queries[requestMessage.name]
    const sendResponse = (response: any) => {
      this.sendResponse(
        MessageType.QueryResponse,
        requestMessage.name,
        response,
        requestMessage.trackId,
      )
    }
    const sendError = (reason: any) => {
      this.sendError({
        message: reason,
        request: requestMessage,
      })
    }
    const fireEvent = (name: string, payload: any) => {
      this.sendEvent(name, payload)
    }
    const result = handler({
      requestMessage: requestMessage,
      store: this.store,
      sendError,
      fireEvent,
    })
    if (result) {
      sendResponse(result)
    }
  }
  serverHandleEvent(requestMessage: Message) {
    const handler = this.eventListeners[requestMessage.name]
    const sendError = (reason: any) => {
      this.sendError({
        message: reason,
        request: requestMessage,
      })
    }
    const fireEvent = (name: string, payload: any) => {
      this.sendEvent(name, payload)
    }
    handler({
      requestMessage: requestMessage,
      store: this.store,
      sendError,
      fireEvent,
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
