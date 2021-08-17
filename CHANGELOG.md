## 0.1.1

Split into a base class `MessageBridgeServiceBase` an different network implementations.

There are now two network implementations:

- SignalRMessageBridgeService (MessageBridgeService)
- WebSocketConnectionService

The exprted `MessageBridgeService` is the SignalRMessageBridgeService - `So no real changes except the onError`

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
