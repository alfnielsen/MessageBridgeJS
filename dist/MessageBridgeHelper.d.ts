import { Message, MessageDirection, MessageType, OmitAndOptional } from "./MessageBridgeTypes";
export declare function createMessageFromDto<TPayload = any, TSchema = any>(msg: Message<TPayload, TSchema>, direction?: MessageDirection): Message<TPayload, TSchema>;
export declare function MapResponseType(type: MessageType): MessageType.CommandResponse | MessageType.QueryResponse | MessageType.Event | MessageType.Error;
export declare function createMessage<TPayload = any | undefined, TSchema = any>(opt: OmitAndOptional<Message<TPayload, TSchema>, "created" | "isError", "trackId" | "direction">): Message<TPayload, TSchema>;
export declare function createCommandMessage<TRequest = any, TSchema = any>(opt: OmitAndOptional<Message<TRequest, TSchema>, "created" | "isError" | "type", "trackId" | "direction">): Message<TRequest, TSchema>;
export declare function createQueryMessage<TRequest = any, TSchema = any>(opt: OmitAndOptional<Message<TRequest, TSchema>, "created" | "isError" | "type", "trackId" | "direction">): Message<TRequest, TSchema>;
export declare function createEventMessage<TPayload = any>(opt: OmitAndOptional<Message<TPayload>, "created" | "isError" | "type", "trackId" | "direction">): Message<TPayload, any>;
//# sourceMappingURL=MessageBridgeHelper.d.ts.map