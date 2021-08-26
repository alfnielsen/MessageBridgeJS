import { MessageDirection, MessageType } from "./MessageBridgeInterfaces";
export declare class Message<TPayload = any, TResponse = any, TSchema = any> {
    name: string;
    type: MessageType;
    isError: boolean;
    trackId: string;
    created: string;
    payload?: TPayload;
    schema?: TSchema;
    direction: MessageDirection;
    constructor(name: string, type: MessageType, payload?: TPayload, schema?: TSchema, trackId?: string, created?: string, direction?: MessageDirection);
    static create<TPayload = any, TResponse = any, TSchema = any>(opt: {
        name: string;
        type: MessageType;
        payload?: TPayload;
        schema?: TSchema;
        trackId?: string;
        created?: string;
        direction?: MessageDirection;
    }): Message<TPayload, TResponse, TSchema>;
    static fromDto<TPayload = any, TResponse = any, TSchema = any>(msg: Message<TPayload, TResponse, TSchema>, direction?: MessageDirection): Message<TPayload, TResponse, TSchema>;
}
//# sourceMappingURL=Message.d.ts.map