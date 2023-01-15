import { Message, RequestMaybeNoError, RequestResponse } from "../src/MessageBridgeTypes"
import { ClientSideMessageBridgeService } from "../src/connection-protocols/ClientSideMessageBridgeService"
import { GetTodoItemQuery, GetTodoItemQueryResponse, RequestType } from "./TestInterfaces"
import { createTestServer } from "./TestServer"
import { RequestErrorResponse } from "../src/connection-protocols/InMemoryClientSideServer"

// --------------------- error tracking ---------------------
const bridge = new ClientSideMessageBridgeService("ws://localhost:1234")
bridge.server = createTestServer()

test("request options: timeout:1000", async () => {
  jest.setTimeout(10000)
  await bridge.connect()

  const { error: shouldBeUndefined, isError: shouldNotBeError } =
    await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
      name: RequestType.GetTodoItemQuery,
      payload: { search: "1", sleep: 500 },
      timeout: 1000,
    })
  const { error, isError } = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    string
  >({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1", sleep: 500 },
    timeout: 200,
  })
  expect(shouldNotBeError).toBe(false)
  expect(shouldBeUndefined).toBeUndefined()
  expect(isError).toBe(true)
  expect(error).toBeDefined()
  if (!error) {
    throw new Error("error should be defined")
  }
  expect(/timeout/i.test(error)).toBe(true)
})