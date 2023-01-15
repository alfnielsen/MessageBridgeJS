import {
  Message,
  MessageDirection,
  MessageType,
  RequestResponse,
} from "../src/MessageBridgeTypes"
import { ClientSideMessageBridgeService } from "../src/connection-protocols/ClientSideMessageBridgeService"
import {
  GetTodoItemQuery,
  GetTodoItemQueryResponse,
  RequestType,
  UpdateTodoItemCommand,
  UpdateTodoItemCommandResponse,
} from "./TestInterfaces"
import { createTestServer } from "./TestServer"

const bridge = new ClientSideMessageBridgeService("ws://localhost:1234")
bridge.server = createTestServer()

// --------------------- tracked versions ---------------------

test("await sendCommandTracked", async () => {
  await bridge.connect()
  const { request, response, requestMessage, responseMessage } =
    await bridge.sendCommandTracked<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>(
      {
        name: RequestType.UpdateTodoItemCommand,
        payload: {
          id: 1,
          title: "todo1 changed",
        },
      },
    )

  // test query response
  expect(request.id).toBe(1)
  expect(request.title).toBe("todo1 changed")
  expect(response.done).toBe(true)
  expect(requestMessage.name).toBe(RequestType.UpdateTodoItemCommand)
  expect(requestMessage.type).toBe(MessageType.Command)
  expect(requestMessage.payload).toMatchObject({ id: 1, title: "todo1 changed" })
  expect(requestMessage.direction).toBe(MessageDirection.ToServer)
  expect(responseMessage.name).toBe(RequestType.UpdateTodoItemCommand)
  expect(responseMessage.type).toBe(MessageType.CommandResponse)
  expect(responseMessage.payload).toMatchObject({ done: true })
  expect(responseMessage.direction).toBe(MessageDirection.ToClient)
})

test("callback (await) sendCommandTracked", async () => {
  await bridge.connect()
  let result:
    | RequestResponse<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>
    | undefined
  await bridge.sendCommandTracked<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 1,
      title: "todo1 changed",
    },
    onSuccess(_result) {
      result = _result
    },
  })

  expect(result).toBeDefined()
  if (!result) {
    throw new Error("result is undefined")
  }
  // test query response
  expect(result.request.id).toBe(1)
  expect(result.request.title).toBe("todo1 changed")
  expect(result.response.done).toBe(true)
  expect(result.requestMessage.name).toBe(RequestType.UpdateTodoItemCommand)
  expect(result.requestMessage.type).toBe(MessageType.Command)
  expect(result.requestMessage.payload).toMatchObject({ id: 1, title: "todo1 changed" })
  expect(result.requestMessage.direction).toBe(MessageDirection.ToServer)
  expect(result.responseMessage.name).toBe(RequestType.UpdateTodoItemCommand)
  expect(result.responseMessage.type).toBe(MessageType.CommandResponse)
  expect(result.responseMessage.payload).toMatchObject({ done: true })
  expect(result.responseMessage.direction).toBe(MessageDirection.ToClient)
})

test("callback (no await) sendCommandTracked", async () => {
  await bridge.connect()
  let result:
    | RequestResponse<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>
    | undefined
  bridge.sendCommandTracked<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 1,
      title: "todo1 changed",
    },

    onSuccess(_result) {
      result = _result
    },
  })

  // wait for response
  await new Promise((resolve) => setTimeout(resolve, 100))

  expect(result).toBeDefined()
  if (!result) {
    throw new Error("result is undefined")
  }
  // test query response
  expect(result.request.id).toBe(1)
  expect(result.request.title).toBe("todo1 changed")
  expect(result.response.done).toBe(true)
  expect(result.requestMessage.name).toBe(RequestType.UpdateTodoItemCommand)
  expect(result.requestMessage.type).toBe(MessageType.Command)
  expect(result.requestMessage.payload).toMatchObject({ id: 1, title: "todo1 changed" })
  expect(result.requestMessage.direction).toBe(MessageDirection.ToServer)
  expect(result.responseMessage.name).toBe(RequestType.UpdateTodoItemCommand)
  expect(result.responseMessage.type).toBe(MessageType.CommandResponse)
  expect(result.responseMessage.payload).toMatchObject({ done: true })
  expect(result.responseMessage.direction).toBe(MessageDirection.ToClient)
})

// --------------------- non tracked ("normal") ---------------------

test("await sendCommand", async () => {
  await bridge.connect()
  const response = await bridge.sendCommand<
    UpdateTodoItemCommand,
    UpdateTodoItemCommandResponse
  >({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 1,
      title: "todo1 changed",
    },
  })

  // test query response
  expect(response.done).toBe(true)
  expect(response).toMatchObject({ done: true })
})

test("callback (await) sendCommand", async () => {
  await bridge.connect()
  let response: UpdateTodoItemCommandResponse | undefined
  await bridge.sendCommand<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 1,
      title: "todo1 changed",
    },
    onSuccess({ response: _response }) {
      response = _response
    },
  })

  expect(response).toBeDefined()
  if (!response) {
    throw new Error("response is undefined")
  }
  // test query response
  expect(response.done).toBe(true)
  expect(response).toMatchObject({ done: true })
})

test("callback (no await) sendCommand", async () => {
  await bridge.connect()
  let response: UpdateTodoItemCommandResponse | undefined
  bridge.sendCommand<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 1,
      title: "todo1 changed",
    },
    onSuccess({ response: _response }) {
      response = _response
    },
  })

  // wait for response
  await new Promise((resolve) => setTimeout(resolve, 100))

  expect(response).toBeDefined()
  if (!response) {
    throw new Error("response is undefined")
  }
  // test query response
  expect(response.done).toBe(true)
  expect(response).toMatchObject({ done: true })
})

test("await sendCommand (spread)", async () => {
  await bridge.connect()
  const { done } = await bridge.sendCommand<
    UpdateTodoItemCommand,
    UpdateTodoItemCommandResponse
  >({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 1,
      title: "todo1 changed",
    },
  })

  // test query response
  expect(done).toBe(true)
})
