import * as signalR from "@microsoft/signalr"

import { IMessageServiceQuerySubscription } from "./IMessageServiceQuerySubscription"
import { Message } from "./Message"
import { MessageDirection } from "./MessageDirection"
import { MessageType } from "./MessageType"

export class MessageBridgeService {
  connected = false
  connection?: signalR.HubConnection

  constructor(public wsUri: string) {}

  protected subscriptionTrackIdList: {
    [trackId: string]: (value: Message) => void
  } = {}
  protected subscriptionEventList: {
    [eventName: string]: ((value: Message) => void)[]
  } = {}
  protected subscriptionQuery: IMessageServiceQuerySubscription<any, any>[] = []
  history: Message[] = []

  sendMessage<TPayload = any, TResponse = any, TSchema = any>(
    msg: Message<TPayload, TResponse, TSchema>,
    callback?: (msg: Message<TResponse>) => void
  ) {
    msg.direction = MessageDirection.ToServer
    if (callback) {
      this.subscriptionTrackIdList[msg.trackId] = callback
    }
    this.internalSendMessage(msg)
  }

  subscribeEvent<TResponse = any>({
    name,
    callback,
  }: {
    name: string
    callback: (msg: Message<TResponse>) => void
  }) {
    if (!this.subscriptionEventList[name]) this.subscriptionEventList[name] = []
    this.subscriptionEventList[name].push(callback)
    return () => {
      const index = this.subscriptionEventList[name].findIndex(
        (x) => x === callback
      )
      this.subscriptionEventList[name].splice(index, 1)
    }
  }

  createCommandMessage<TPayload = any, TResponse = any, TSchema = any>(
    name: string,
    payload: TPayload,
    direction = MessageDirection.ToServer
  ) {
    return Message.create<TPayload, TResponse, TSchema>({
      name,
      type: MessageType.Command,
      payload,
      direction,
    })
  }
  sendCommand<TPayload = any, TResponse = any, TSchema = any>({
    name,
    command,
    callback,
  }: {
    name: string
    command: TPayload
    callback?: (msg: Message<TResponse>) => void
  }) {
    const msg = this.createCommandMessage(name, command)
    this.sendMessage<TPayload, TResponse, TSchema>(msg, callback)
  }

  createQueryMessage<TPayload = any>(
    name: string,
    payload: TPayload,
    direction = MessageDirection.ToServer
  ) {
    return Message.create({
      name,
      type: MessageType.Query,
      payload,
      direction,
    })
  }

  createAndSendQueryMessage<TQuery = any, TResponse = any>({
    name,
    query,
    callback,
  }: {
    name: string
    query: TQuery
    callback: (msg: Message<TResponse>) => void
  }) {
    const msg = this.createQueryMessage(name, query)
    this.sendMessage<TQuery, TResponse>(msg, callback)
    return msg
  }

  subscribeQuery<TPayload = any, TResponse = any>(
    opt: IMessageServiceQuerySubscription<TPayload, TResponse>
  ) {
    //call right away
    this.createAndSendQueryMessage({
      name: opt.name,
      query: opt.query,
      callback: opt.update,
    })
    //then subscribe
    this.subscriptionQuery.push(opt)
    return () => {
      const index = this.subscriptionQuery.findIndex((x) => x === opt)
      if (index > 0) {
        this.subscriptionQuery.splice(index, 1)
      }
    }
  }

  onError(err: string) {}

  connect() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.wsUri)
      .withAutomaticReconnect()
      .build()
    this.connection.on("ReceiveMessage", (messageDto: Message) => {
      this.handleIncomingMessage(messageDto)
    })
    return this.connection
      .start()
      .then(() => {
        this.connected = true
      })
      .catch((err: Error) => {
        this.onError(err.toString())
      })
  }

  handleIncomingMessage(messageDto: Message) {
    var msg = Message.fromDto(messageDto)
    this.history.push(msg)
    if (this.subscriptionTrackIdList[msg.trackId]) {
      this.subscriptionTrackIdList[msg.trackId](msg)
      delete this.subscriptionTrackIdList[msg.trackId]
    }
    if (msg.type === MessageType.Event) {
      this.receiveEventMessage(msg)
    }
  }
  protected receiveEventMessage(eventMsg: Message) {
    if (
      this.subscriptionEventList[eventMsg.name] &&
      this.subscriptionEventList[eventMsg.trackId]
    ) {
      this.subscriptionEventList[eventMsg.trackId].forEach((x) => x(eventMsg))
    }
    this.subscriptionQuery
      .filter((x) => x.triggers?.some((x) => x === eventMsg.name) ?? false)
      .forEach((x) => {
        const msg = this.createQueryMessage(x.name, x.query)
        this.sendMessage(msg, x.update)
      })
  }

  protected internalSendMessage(msg: Message) {
    console.log("COUNT")
    this.history.push(msg)
    this.connection?.invoke("SendMessage", msg).catch((err) => {
      msg.errors.push(err)
      return console.error(err.toString())
    })
  }
}
