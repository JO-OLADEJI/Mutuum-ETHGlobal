import { VanillaProtocolModules } from "@proto-kit/library";
const modules = VanillaProtocolModules.with({});
const config = {
    ...VanillaProtocolModules.defaultConfig(),
};
export default { modules, config };
