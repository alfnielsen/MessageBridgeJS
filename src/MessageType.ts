export enum MessageType {
  Command = "Command",
  CommandResponse = "CommandResponse", // null or created id (number)
  Query = "Query",
  QueryResponse = "QueryResponse",
  Event = "Event",
  Error = "Error",
}
