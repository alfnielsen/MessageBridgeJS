import { v4 as uuidv4 } from "uuid"
import { MessageDirection, MessageType } from "./MessageBridgeInterfaces"

export class Message<TPayload = any, TResponse = any, TSchema = any> {
  public module?: string
  public name: string
  public type: MessageType
  public isError: boolean
  public trackId: string
  public created: string
  public payload?: TPayload
  public schema?: TSchema
  public direction: MessageDirection
  constructor(
    name: string,
    type: MessageType,
    payload?: TPayload,
    schema?: TSchema,
    trackId = uuidv4(),
    created = new Date(Date.now()).toJSON(),
    direction = MessageDirection.ToServer,
    module?: string,
  ) {
    this.module = module
    this.name = name
    this.type = type
    this.trackId = trackId
    this.created = created
    this.payload = payload
    this.schema = schema
    this.direction = direction
    this.isError = type === MessageType.Error
  }

  static create<TPayload = any, TResponse = any, TSchema = any>(opt: {
    name: string
    type: MessageType
    payload?: TPayload
    schema?: TSchema
    trackId?: string
    created?: string
    direction?: MessageDirection
    module?: string
  }) {
    return new Message<TPayload, TResponse, TSchema>(
      opt.name,
      opt.type,
      opt.payload,
      opt.schema,
      opt.trackId,
      opt.created,
      opt.direction,
      opt.module,
    )
  }

  static fromDto<TPayload = any, TResponse = any, TSchema = any>(
    msg: Message<TPayload, TResponse, TSchema>,
    direction = MessageDirection.ToClient,
  ): Message<TPayload, TResponse, TSchema> {
    return new Message<TPayload, TResponse, TSchema>(
      msg.name,
      msg.type,
      msg.payload,
      msg.schema,
      msg.trackId,
      msg.created,
      direction,
      msg.module,
    )
  }
}
