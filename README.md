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
- subscribeQuery
- subscribeEvent
- connect

Underlying commands _(can sometime be used to fetch trackId ect...)_

- sendMessage
- createCommandMessage
- createQueryMessage
- createEventMessage
- onError // override to handle errors
- onClose // override to handle close

Protected commands

- handleIncomingMessage
- receiveEventMessage
- internalSendMessage

### Examples

```ts
// See "/examples" in repository for more examples
const bridge = new MessageBridgeService("ws://localhost:8080")
await bridge.connect()

// Command
const command: ICreateTodo = { name: "Remember to", priority: "low" }
bridge.sendCommand({
  module: "base-module", // module is optional (in version 0.1.x)
  name: "CreateTodo",
  payload: command,
  onSuccess: (id: number) => {
    alert(`Todo created with id: ${id}`)
  },
  //onError (handler error response)
})
// Query (subscribe)
bridge.subscribeQuery({
  name: "GetTotoItem",
  query: { id: 25 },
  triggers: ["UpdatedTotoIem"],
  onUpdate: (todo: ITodoItem) => {
    // update ui
  },
})

// Query (subscribe)
bridge.subscribeEvent({
  name: "UpdatedTotoIem",
  onEvent: (todo: ITodoItem) => {
    // do stoff..
  },
})
```

### Install

```
> npm i message-bridge-js
```

```
> yarn add message-bridge-js
```

### CDN

Use directly in a browser: (CDN)

The dependencies (@microsoft/signalr and uuid) most be added before this script

```html
<!-- @microsoft/signalr -->
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/5.0.4/signalr.min.js"
  integrity="sha512-h0xYAfohLfIHQffhHCtxoKLpHronITi3ocJHetJf4K1YCeCeEwAFA3gYsIYCrzFSHftQwXALtXvZIw51RoJ1hw=="
  crossorigin="anonymous"
></script>
<!-- uuid -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js"></script>
<!-- message-bridge-js -->
<script src="https://unpkg.com/message-bridge-js/cdn-build/MessageBridgeService.js"></script>
```

_For a specific version use: (Not updated since version 0.1.5 !):_
https://unpkg.com/message-bridge-js@0.0.1/cdn-build/MessageBridgeService.js

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
