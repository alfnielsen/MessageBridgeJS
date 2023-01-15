import { Message, MessageDirection, OmitAndOptional } from "./MessageBridgeTypes";
export declare function createMessageFromDto<TPayload = any, TSchema = any>(msg: Message<TPayload, TSchema>, direction?: MessageDirection): Message<TPayload, TSchema>;
export declare function createMessage<TPayload = any, TSchema = any>(opt: OmitAndOptional<Message<TPayload, TSchema>, "created" | "isError", "trackId" | "direction">): Message<TPayload, TSchema>;
export declare function createCommandMessage<TRequest = any, TSchema = any>(opt: OmitAndOptional<Message<TRequest, TSchema>, "created" | "isError" | "type", "trackId" | "direction">): Message<TRequest, TSchema>;
export declare function createQueryMessage<TRequest = any, TSchema = any>(opt: OmitAndOptional<Message<TRequest, TSchema>, "created" | "isError" | "type", "trackId" | "direction">): Message<TRequest, TSchema>;
export declare function createEventMessage<TRequest = any>(opt: OmitAndOptional<Message<TRequest>, "created" | "isError" | "type", "trackId" | "direction" | "payload">): Message<undefined, any>;
//# sourceMappingURL=MessageBridgeHelper.d.ts.map