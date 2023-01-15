import {
  Message,
  MessageDirection,
  MessageType,
  RequestMaybeNoError,
  RequestResponse,
} from "../src/MessageBridgeTypes"
import { ClientSideMessageBridgeService } from "../src/connection-protocols/ClientSideMessageBridgeService"
import { GetTodoItemQuery, GetTodoItemQueryResponse, RequestType } from "./TestInterfaces"
import { createTestServer } from "./TestServer"

const bridge = new ClientSideMessageBridgeService("ws://localhost:1234")
bridge.server = createTestServer()

// --------------------------- collect promise test ---------------------------

function isPromise(p: any) {
  return p && Object.prototype.toString.call(p) === "[object Promise]"
}

test("collect promises sendQueryTracked", async () => {
  await bridge.connect()
  let control = await bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
  })

  expect(control.items?.[0]).toMatchObject({
    id: 1,
    title: "todo1",
  })

  // do multiple searches:
  let promise1 = bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "todo" },
  })
  expect(isPromise(promise1)).toBe(true)

  var laterResult = await promise1

  expect(laterResult.items.length).toBe(3)
  expect(laterResult.items?.[0]).toMatchObject({ id: 1, title: "todo1" })
})

// --------------------------- parallel test ---------------------------

test("parallel sendQueryTracked", async () => {
  await bridge.connect()
  let control = await bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
  })
  expect(control.items?.[0]).toMatchObject({
    id: 1,
    title: "todo1",
  })

  // do multiple searches:
  let promise1 = bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
  })

  let promise2 = bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    string
  >({
    name: "NonExistingRequest",
    payload: { search: "50" },
  })

  let promise3 = bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "2" },
  })

  expect(isPromise(promise1)).toBe(true)
  expect(isPromise(promise2)).toBe(true)
  expect(isPromise(promise3)).toBe(true)

  // wait for all to complete
  const allResults = await Promise.all([promise1, promise2, promise3])

  expect(allResults.length).toBe(3)

  for (const { request, response, isError, error } of allResults) {
    if (request.search === "1") {
      expect(response.items.length).toBe(1)
      expect(response.items[0].id).toBe(1)
      expect(response.items[0].title).toBe("todo1")
    }
    if (request.search === "50") {
      // error
      expect(isError).toBe(true)
      expect(error).toBeDefined()
      if (!error) {
        throw new Error("error should be defined")
      }
      expect(/not found/.test(error.message)).toBe(true)
    }
    if (request.search === "2") {
      expect(response.items.length).toBe(1)
      expect(response.items[0].id).toBe(2)
      expect(response.items[0].title).toBe("todo2")
    }
    if (request.search === "3") {
      expect(response.items.length).toBe(1)
      expect(response.items[0].id).toBe(3)
      expect(response.items[0].title).toBe("todo3")
    }
  }
})
