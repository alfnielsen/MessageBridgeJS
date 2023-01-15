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
