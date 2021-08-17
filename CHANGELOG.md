## 0.1.0

Add 'ConnectionService' for differnet underlaying connection models.

Default is still SignalR (SignelRConnectionService), but a "simple" WebsocketConnectionService has been added.

The MessageBridgeService contructor now take an optional second argument of type ConnectionService.

If not set, it will create an SignelRConnectionService that wotk the same way as previous.

A ConnectionService has one constructor argument whioch is the MessageService, and will use its porperties/methods: wsUrl, onError and handleIncommingMessage.

### Breaking changes

- onError now take an 'Error' instead of a 'string'

## 0.0.10

Add **onError** on subscribeQuery

## 0.0.5

Add **options?: IHttpConnectionOptions** on **connect** method

## 0.0.2

Add cdn build (for direct use in a browser)

https://unpkg.com/message-bridge-js/cdn-build/MessageBridgeService.js

## 0.0.1

Initial version
