import { InMemoryClientSideServer } from "../src/connection-protocols/InMemoryClientSideServer"
import { RequestType, Store } from "./TestInterfaces"

function createTestServer() {
  let server = new InMemoryClientSideServer<Store>()

  server.store.todos = [
    { id: 1, title: "todo1" },
    { id: 2, title: "todo2" },
    { id: 3, title: "todo3" },
  ]
  server.addCommand(RequestType.UpdateTodoItemCommand, ({ request, event, response }) => {
    const todo = server.store.todos.find((t) => t.id === request.id)
    if (todo) {
      todo.title = request.title
    }
    setTimeout(() => {
      event(RequestType.TodoItemUpdated, {
        id: request.id,
        title: request.title,
      })
    }, 10)
    response({ done: true })
  })
  server.addQuery(RequestType.GetTodoItemQuery, ({ request, response }) => {
    const items = server.store.todos.filter((t) =>
      t.title.toLowerCase().includes(request.search.toLowerCase()),
    )
    response({ items })
  })
  return server
}

export { createTestServer }
