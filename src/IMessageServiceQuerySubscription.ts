import { Message } from "./Message"

export interface IMessageServiceQuerySubscription<TQuery, TResponse> {
  name: string
  query: TQuery
  triggers: string[]
  update: (value: Message<TResponse>) => void
}
