import { v4 as uuidv4 } from "uuid";
import { MessageDirection, MessageType } from "./MessageBridgeInterfaces";
var Message = /** @class */ (function () {
    function Message(name, type, payload, schema, trackId, created, direction, module) {
        if (trackId === void 0) { trackId = uuidv4(); }
        if (created === void 0) { created = new Date(Date.now()).toJSON(); }
        if (direction === void 0) { direction = MessageDirection.ToServer; }
        this.module = module;
        this.name = name;
        this.type = type;
        this.trackId = trackId;
        this.created = created;
        this.payload = payload;
        this.schema = schema;
        this.direction = direction;
        this.isError = type === MessageType.Error;
    }
    Message.create = function (opt) {
        return new Message(opt.name, opt.type, opt.payload, opt.schema, opt.trackId, opt.created, opt.direction, opt.module);
    };
    Message.fromDto = function (msg, direction) {
        if (direction === void 0) { direction = MessageDirection.ToClient; }
        return new Message(msg.name, msg.type, msg.payload, msg.schema, msg.trackId, msg.created, direction, msg.module);
    };
    return Message;
}());
export { Message };
//# sourceMappingURL=Message.js.map