import { InMemoryClientSideServer } from "../src/services/InMemoryClientSideServer"
import {
  GetTodoItemQuery,
  GetTodoItemQueryResponse,
  RequestType,
  Store,
  UpdateTodoItemCommand,
  UpdateTodoItemCommandResponse,
} from "./TestInterfaces"

function createTestServer() {
  let server = new InMemoryClientSideServer<Store>()

  server.store.todos = [
    { id: 1, title: "todo1" },
    { id: 2, title: "todo2" },
    { id: 3, title: "todo3" },
  ]
  server.addCommand<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>(
    RequestType.UpdateTodoItemCommand,
    async ({ request, event, error, response, store }) => {
      const todo = store.todos.find((t) => t.id === request.id)
      if (todo) {
        todo.title = request.title
      }
      setTimeout(() => {
        event(RequestType.TodoItemUpdated, {
          id: request.id,
          title: request.title,
        })
      }, 10)
      if (request.throwError) {
        error("ServerError(UpdateTodoItemCommand) Some kind of error!")
        return
      }
      if (request.sleep) {
        await new Promise((resolve) => setTimeout(resolve, request.sleep))
      }
      response({ done: true })
    },
  )
  server.addEventListener(RequestType.Ping, ({ event }) => {
    setTimeout(() => {
      event(RequestType.Pong, {})
    })
  })

  server.addQuery<GetTodoItemQuery, GetTodoItemQueryResponse>(
    RequestType.GetTodoItemQuery,
    async ({
      request,
      response,
      error,
      store,
      createResponseMessage,
      sendResponseMessage,
    }) => {
      const items = store.todos.filter((t) =>
        t.title.toLowerCase().includes(request.search.toLowerCase()),
      )
      if (request.log) {
        console?.log(request.log)
      }
      if (request.throwError) {
        error(
          "ServerError(GetTodoItemQuery) Some kind of error!",
          request.sendCancel,
          request.sendTimedOut,
        )
        return
      }
      if (request.sleep) {
        await new Promise((resolve) => setTimeout(resolve, request.sleep))
      }
      if (request.sendCancel) {
        const resMsg = createResponseMessage({ items })
        resMsg.cancelled = true
        sendResponseMessage(resMsg)
      } else {
        response({ items })
      }
    },
  )
  return server
}

export { createTestServer }
