# Message Bridge (JS)

A CQRS Hook.

Extreme simplified Commands, Queries and Events for applications UI.

The Bridge enabled sending Commands, Queries and Event between a frontend and backend
through a websocket.

![Overview-diagram](docs/Overview-diagram.jpg)

### Bridge commands:

Most used commands:

- sendCommand
- sendQuery
- sendEvent _(It's called send because it will send it to the backend - not fire it! )_
- subscribeEvent
- connect

Tracked versions of requests (They resolve the promise with a full RequestResponse<TRequest,TResponse>)  
It includes the request and response messages (So you can track which request data what used to get the response)

- sendCommandTracked
- sendQueryTracked

Underlying commands _(can sometime be used to fetch trackId ect...)_

- sendMessage
- onError _(override to handle errors)_
- onClose _(override to handle close)_

Helper commands _(advanced use)_

- createCommandMessage
- createQueryMessage
- createEventMessage
- createMessage
- createMessageFromDto

Protected commands _(advanced use)_

- onMessage
- handleIncomingMessage
- receiveEventMessage
- internalSendMessage

### Examples

```ts
// See "/examples" in repository for more examples
const bridge = new MessageBridgeService("ws://localhost:8080")
await bridge.connect()

// Command
const command = { name: "Remember to", priority: "low" } as ICreateTodo
const id = await bridge.sendCommand({
  module: "todo", // module is optional (But can be used to track different microservices etc..)
  name: "CreateTodo", // name of the command
  payload: command, // payload (arguments) of the command
})
console.log(`Todo created with id: ${id}`)

// Query
const todo = await bridge.sendQuery({
  name: "GetTotoItem", // name of the query
  payload: { id: 25 }, // payload (arguments) of the query
})
console.log(`Todo with id:25 has title: ${todo.title}`)

// Subscribe Event
const unsub = bridge.subscribeEvent({
  name: "TotoItemUpdated", // name of the event
  onEvent(todo: ITodoItem) {
    // event handler
  },
})
```

Callback options:

```ts
// sendCommand and sendQuery can take a callback instead of awaiting the response
bridge.sendCommand({
  name: "CreateTodo",
  payload: command,
  onSucess(id) {
    console.log(`Todo created with id: ${id}`)
  },
  onError(error) {
    // if the server send an bridge error message
    console.log(`Error: ${error}`)
  },
})
// or a combination to handle errors without try/catch
const id = await bridge.sendCommand({
  name: "CreateTodo",
  payload: command,
  onError(error) {
    // handle error
  },
})
```

Multiple parallel requests:

```ts
let promise1 = bridge.sendCommand({
  name: "CreateTodo",
  payload: command,
})
let promise2 = bridge.sendCommand({
  name: "CreateTodoNode",
  payload: commandNote,
})
const [todo, note] = await Promise.all([promise1, promise2])
```

Tracked requests:

```ts
// base:
const { response: todoItems, request: searchOptions } = await bridge.sendQueryTracked({
  name: "GetTotoItem",
  payload: someSearchOptions,
})
// parallel:
// do multiple searches:
let queryPromise1 = searchOptions.map((searchOptions) =>
  bridge.sendQueryTracked({
    name: "GetTotoItem",
    payload: { searchTerm: "se" },
  }),
)
let queryPromise2 = searchOptions.map((searchOptions) =>
  bridge.sendQueryTracked({
    name: "GetTotoItem",
    payload: { searchTerm: "se" },
  }),
)
const allResults = await Promise.all([queryPromise1, queryPromise2])
allResults.forEach(({ response, request }) => {
  console.log(
    `Search with '${request.payload.searchTerm}' returned ${response.length} items`,
  )
})
```

### Install

```
> npm i message-bridge-js
```

```
> yarn add message-bridge-js
```

### Backend

On the backend it has a sister library (MessageBridgeCS) that execute Command and Queries and notify the UI on Events.

The general pattern will remove the needs for controllers\* and hook directly into you Commands, Queries and Events in your backend.

_\*This doesn't mean you don't want them or need them to expose you API for other sources_

#### Coexist with Controllers

MessageBridge don't restrict you to implement anything you did'n have before,
and you can choose to use it on only a couple of elements
(fx your admin or support UI)

All command/queries call can have use both the bridge and a controller,
no restrictions.
(But your controllers should in this scenario never do anything
else then just "send" the command/query to the handlers
i the application layer of your backend )

### Events

The Bridge enabled the frontend to listen to events.

### Technologies

Build on SignalR (Websockets)

Backend is (currently build on C# and MediatR)

#### Internal - how it does it

The bridge sends BridgeMessage that contains a:

**Name** of the command, query or event

**Payload** that contains the actual Command/Query or payload for en Event for Error

**TrackId** that is used to catch responses

**Type** that are ont of

- Command
- Query
- CommandResponse
- QueryResponse
- Event
- Error

The frontend will add a **TrackId** which in the backend will be added in the responses.

The message is sent to the through a websocket and
deserialize its payload in the backend.

It will then execute the Command/Query, receive the application process (Handlers)
response and create a response message,
that are sent back to the frontend including the **TrackId**

![Overview-diagram](docs/Command-flow.jpg)

#### Not restricted to these Technologies

The first version of MessageBridge is designed for a C# backend,
and uses @microsoft/SignalR and its back ends hubs.

The is not a restriction, but a choice for the first version.
Other implementation using other messageQues then SignalR
and other backends like Javascript (typescript) or Java can be created in the future.

### Flow diagram

![Flow-diagram](docs/CommandServiceDiagram.jpg)

# Getting started

You can use the included **ClientSideMessageBridgeService** and **InMemoryClientSideServer**
to get started quickly (and later change the bridge to the **SignalR** or **Websocket** version).

```ts
// TestServer.ts
import { InMemoryClientSideServer } from "../src/connection-protocols/InMemoryClientSideServer"
import { RequestType, Store } from "./TestInterfaces"

let server = new InMemoryClientSideServer<Store>()
server.store.todos = [
  { id: 1, title: "todo1" },
  { id: 2, title: "todo2" },
  { id: 3, title: "todo3" },
]
server.addCommand(RequestType.UpdateTodoItemCommand, (opt) => {
  const todo = server.store.todos.find((t) => t.id === opt.requestMessage.payload.id)
  if (todo) {
    todo.title = opt.requestMessage.payload.title
  }
  setTimeout(() => {
    opt.fireEvent(RequestType.TodoItemUpdated, {
      id: opt.requestMessage.payload.id,
      title: opt.requestMessage.payload.title,
    })
  }, 10)
  return { done: true }
})
server.addQuery(RequestType.GetTodoItemQuery, (opt) => {
  const items = server.store.todos.filter((t) =>
    t.title.toLowerCase().includes(opt.requestMessage.payload.search.toLowerCase()),
  )
  return { items }
})

export { server as testServer }
```
