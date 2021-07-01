import {Message} from "./Message";

export enum MessageType {
  Command = "Command",
  CommandResponse = "CommandResponse", // null or created id (number)
  Query = "Query",
  QueryResponse = "QueryResponse",
  Event = "Event",
  Error = "Error",
}

export type SubscribeResponse<TMessageType> = (payload: TMessageType, bridgeMessage: Message<TMessageType>) => void

export type SubscribeResponseWithCatch<TMessageType, TErrorMessageType = any> = {
  onSuccess?: SubscribeResponse<TMessageType>
  onError?: SubscribeResponse<TErrorMessageType>
}

export interface IMessageServiceQuerySubscription<TQuery, TResponse> {
  name: string
  query: TQuery
  triggers: string[]
  onUpdate: SubscribeResponse<TResponse>
  onError?: SubscribeResponse<any>
}


export enum MessageDirection {
  ToClient = "ToClient",
  ToServer = "ToServer",
}