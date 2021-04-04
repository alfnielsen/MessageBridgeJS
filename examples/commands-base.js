import { MessageBridgeService } from "../src/MessageBridgeService";
var msgBridge = new MessageBridgeService("ws:/localhost:8080");
msgBridge.connect();
/**
 * React hook
 *
 * (Note: add provider)
 *
 * @param name
 * @param query
 * @param triggers
 */
function useQuery(name, query, triggers) {
    //@ts-ignore
    var _a = useState(), state = _a[0], setState = _a[1];
    //@ts-ignore
    useEffect(function () {
        var unsubscribe = msgBridge.subscribeQuery({
            name: name,
            query: query,
            triggers: triggers,
            update: function (msg) {
                setState(msg.payload);
            },
        });
        return function () { return unsubscribe(); };
    }, [name, query, triggers]);
    return state;
}
export var CreateTodoItem = function (command) {
    return new Promise(function (resolve, reject) {
        msgBridge.sendCommand({
            name: "CreateTodoItem",
            command: command,
            callback: function (msg) {
                var _a;
                resolve((_a = msg.payload) !== null && _a !== void 0 ? _a : -1);
            },
        });
    });
};
CreateTodoItem({ listId: 1, title: "ss" }).then(function (id) { });
export var DeleteTodoItem = function (command) {
    msgBridge.sendCommand({ name: "DeleteTodoItem", command: command });
};
var useGetTodo = function (id, triggers) {
    return useQuery("GetTodo", { id: id }, triggers);
};
export var functionalComponent = function () {
    var todoItem = useGetTodo(1, ["UpdateTodoItem"]);
    var todoItem = useGetTodo(1, ["UpdateTodoItem"]);
    //@ts-ignore
    return <div>{todoItem === null || todoItem === void 0 ? void 0 : todoItem.id}</div>;
};
