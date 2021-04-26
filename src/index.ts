import * as yargs from "yargs";
import { Importer } from "./importer";

(async (): Promise<number> => {
  const argv = yargs
    .command("import", "Import AWS SSO assignments")
    .demandCommand(1)
    .help().argv;

  switch (argv._[0]) {
    case "import":
      console.log("import command");
      break;
    case "debug": {
      const region = "us-west-2";
      const importer = new Importer(region);
      const assignments = await importer.fetchAllAssignments([
        "000000000000",
        "111111111111",
      ])
      console.log(assignments);
      break;
    }
  }
  return 0;
})();
