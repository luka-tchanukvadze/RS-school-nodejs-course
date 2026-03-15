import { homedir } from "node:os";
import { startRepl } from "./repl.js";

console.log("Welcome to data Processing CLI");
console.log(`You are currently in ${homedir()}`);

await startRepl(homedir());
