import {
  Message,
  MessageType,
  RequestMaybeNoError,
  RequestResponse,
} from "../src/MessageBridgeTypes"
import { ClientSideMessageBridgeService } from "../src/services/ClientSideMessageBridgeService"
import {
  GetTodoItemQuery,
  GetTodoItemQueryResponse,
  RequestType,
  UpdateTodoItemCommand,
  UpdateTodoItemCommandResponse,
} from "./TestInterfaces"
import { createTestServer } from "./TestServer"
import { RequestErrorResponse } from "../src/services/InMemoryClientSideServer"
import { createMessage } from "../src/MessageBridgeHelper"

const bridge = new ClientSideMessageBridgeService("ws://localhost:1234")
bridge.server = createTestServer()

// -------------------- intercept --------------------

test("bridge options: intercept", async () => {
  bridge.server = createTestServer() // reset server
  await bridge.connect()

  bridge.setOptions({
    interceptReceivedMessage: (message) => {
      if (
        message.type === MessageType.QueryResponse &&
        message.payload?.items?.[0]?.title === "todo1"
      ) {
        //@ts-ignore // secretData is not defined in Message
        message.secretData = "secret"
      }
      if (message.type === MessageType.CommandResponse) {
        const request = bridge.getTrackedRequestMessage(message.trackId)
        if (request?.payload?.id === 2) {
          const iMsg = createMessage({
            ...message,
            type: MessageType.Error,
          })
          return iMsg
        }
      }
      return message
    },
    interceptSendMessage: (message) => {
      // change type!!
      if (message.type === MessageType.Command && message.payload?.id === 2) {
        const iMsg = createMessage({
          ...message,
          payload: {
            ...message.payload,
            title: "todo2 changed [intercepted]",
          },
        })
        return iMsg
      }
      return message
    },
  })

  const { responseMessage: responseWithSecret } = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse
  >({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "1",
    },
  })

  const { isError, request } = await bridge.sendCommandTracked<
    UpdateTodoItemCommand,
    UpdateTodoItemCommandResponse
  >({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 2,
      title: "todo2 changed",
    },
  })

  expect(responseWithSecret.payload).toMatchObject({
    items: [{ id: 1, title: "todo1" }],
  })
  //@ts-ignore // secretData is not defined in Message
  const secret = responseWithSecret.secretData
  expect(secret).toBe("secret")

  expect(isError).toBe(true)
  expect(request).toMatchObject({
    id: 2,
    title: "todo2 changed [intercepted]",
  })

  // CLEANUP
  bridge.setOptions({
    interceptReceivedMessage: undefined,
    interceptSendMessage: undefined,
  })
})
