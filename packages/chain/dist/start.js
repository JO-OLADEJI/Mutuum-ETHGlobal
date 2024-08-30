import { log } from "@proto-kit/common";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
yargs(hideBin(process.argv))
    .command("start [app-chain]", "Start the specified app-chain", (yargs) => {
    return yargs
        .env("PROTOKIT")
        .positional("appChain", {
        type: "string",
        demandOption: true,
    })
        .option("pruneOnStartup", {
        type: "boolean",
        default: false,
    })
        .option("logLevel", {
        type: "string",
        default: "info",
    });
}, async (args) => {
    log.setLevel(args.logLevel);
    // For windows support, we need to parse out environment variables used in the path
    let path = replaceEnvTemplates(args.appChain);
    const appChainFactory = (await import(path))
        .default;
    const appChain = await appChainFactory(args);
    await appChain.start();
})
    .parse();
function replaceEnvTemplates(str) {
    let temp = str;
    const envRegex = /\$[A-Z1-9_]*/;
    let m;
    while ((m = envRegex.exec(temp)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === envRegex.lastIndex) {
            envRegex.lastIndex++;
        }
        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            const envVarName = match.slice(1);
            const envVarValue = process.env[envVarName];
            if (envVarValue === undefined) {
                throw new Error(`Substituted environment variable ${envVarName} not found`);
            }
            temp = temp.replace(match, envVarValue);
        });
    }
    return temp;
}
