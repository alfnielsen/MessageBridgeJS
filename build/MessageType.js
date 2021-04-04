export var MessageType;
(function (MessageType) {
    MessageType["Command"] = "Command";
    MessageType["CommandResponse"] = "CommandResponse";
    MessageType["Query"] = "Query";
    MessageType["QueryResponse"] = "QueryResponse";
    MessageType["Event"] = "Event";
    MessageType["Error"] = "Error";
})(MessageType || (MessageType = {}));
