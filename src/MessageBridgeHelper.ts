import {
  Message,
  MessageDirection,
  MessageType,
  OmitAndOptional,
} from "./MessageBridgeTypes"
import { v4 } from "uuid"

export function createMessageFromDto<TPayload = any, TSchema = any>(
  msg: Message<TPayload, TSchema>,
  direction = MessageDirection.ToClient,
): Message<TPayload, TSchema> {
  msg.isError = msg.type === MessageType.Error
  msg.direction ??= direction
  return msg
}

export function MapResponseType(type: MessageType) {
  switch (type) {
    case MessageType.Command:
      return MessageType.CommandResponse
    case MessageType.Query:
      return MessageType.QueryResponse
    default:
      return type
  }
}

export function createMessage<TPayload = any | undefined, TSchema = any>(
  opt: OmitAndOptional<
    Message<TPayload, TSchema>,
    "created" | "isError",
    "trackId" | "direction"
  >,
): Message<TPayload, TSchema> {
  return {
    name: opt.name,
    payload: opt.payload,
    type: opt.type,
    // optionals
    direction: opt.direction ?? MessageDirection.ToClient,
    trackId: opt.trackId ?? v4(),
    module: opt.module,
    schema: opt.schema,
    // alway created
    created: new Date().toISOString(),
    isError: opt.type === MessageType.Error,
  }
}

export function createCommandMessage<TRequest = any, TSchema = any>(
  opt: OmitAndOptional<
    Message<TRequest, TSchema>,
    "created" | "isError" | "type",
    "trackId" | "direction"
  >,
): Message<TRequest, TSchema> {
  return createMessage({
    ...opt,
    type: MessageType.Command,
  })
}

export function createQueryMessage<TRequest = any, TSchema = any>(
  opt: OmitAndOptional<
    Message<TRequest, TSchema>,
    "created" | "isError" | "type",
    "trackId" | "direction"
  >,
) {
  return createMessage({
    ...opt,
    type: MessageType.Query,
  })
}

export function createEventMessage<TPayload = any>(
  opt: OmitAndOptional<
    Message<TPayload>,
    "created" | "isError" | "type",
    "trackId" | "direction"
  >,
) {
  return createMessage<TPayload>({
    ...opt,
    type: MessageType.Event,
  })
}
