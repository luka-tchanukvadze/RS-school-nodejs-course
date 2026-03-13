import readline from "node:readline";

const interactive = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.setPrompt("> ");
  rl.prompt();

  rl.on("line", (input) => {
    const cmd = input.trim();

    switch (cmd) {
      case "uptime":
        console.log(`Uptime: ${process.uptime().toFixed(2)}s`);
        break;
      case "cwd":
        console.log(process.cwd());
        break;
      case "date":
        console.log(new Date().toISOString());
        break;
      case "exit":
        console.log("Goodbye!");
        process.exit(0);
        break;
      default:
        console.log("Unknown command");
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log("Goodbye");
    process.exit(0);
  });
};

interactive();
