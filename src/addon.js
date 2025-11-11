import { config } from "../package.json";
import hooks from "./hooks";
import { createZToolkit } from "./utils/ztoolkit";
class Addon {
    data;
    // Lifecycle hooks
    hooks;
    // APIs
    api;
    constructor() {
        this.data = {
            alive: true,
            config,
            env: __env__,
            initialized: false,
            ztoolkit: createZToolkit(),
        };
        this.hooks = hooks;
        this.api = {};
    }
}
export default Addon;
