import * as yargs from "yargs";
import { Importer } from "./importer";
import { SSOAssignmentInfo, TerraformHandler } from "./TerraformHandler";

(async (): Promise<number> => {
  const argv = yargs
    .scriptName("sso-importer")
    .usage("$0 <cmd> [args]")
    .command("import-all", "Import All AWS SSO assignments")
    .command("import", "Import AWS SSO assignments", (yargs) =>
      yargs
        .option("assignment-name", {
          alias: "n",
          type: "string",
          describe: "Name of assignments. (e.g. OU name)",
        })
        .option("accounts", {
          array: true,
          string: true,
          describe: "IDs of AWS accounts to be imported.",
        })
        .demandOption(
          ["assignment-name", "accounts"],
          "import command requires assignments name"
        )
    )
    .demandCommand(1)
    .option("sso-region", {
      description: "Region of AWS SSO instance",
      type: "string",
    })
    .option("generate-only", {
      description: "Not to run import command but generate Terraform file.",
      type: "boolean",
      default: false,
    })
    .demandOption(["sso-region"], "Region of AWS SSO must be specified")
    .help().argv;

  switch (argv._[0]) {
    case "import": {
      const region: string = argv["sso-region"];
      const importer: Importer = new Importer(region);
      const accounts: string[] = argv.accounts;
      const assignments = await importer.fetchAssignments(accounts);
      console.log(assignments);
      const assignmentName: string = argv["assignment-name"];
      const th: TerraformHandler = new TerraformHandler(assignments);
      th.generateTfvars(assignmentName);
      th.formatTfFile();
      if (!argv["generate-only"]) th.runImportCommands(assignmentName, region);
      break;
    }
    case "import-all": {
      const region: string = argv["sso-region"];
      const importer: Importer = new Importer(region);
      const assignments: SSOAssignmentInfo[] = await importer.fetchAllAssignments();
      console.log(assignments);
      const th: TerraformHandler = new TerraformHandler(assignments);
      th.generateTfvars("all");
      th.formatTfFile();
      if (!argv["generate-only"]) th.runImportCommands("all", region);
      break;
    }
  }
  return 0;
})();
