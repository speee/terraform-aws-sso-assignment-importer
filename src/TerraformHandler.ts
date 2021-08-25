import * as fs from "fs";
import { execSync } from "child_process";

export interface SSOAssignmentInfo {
  principalId: string;
  principalType: string;
  principalDisplayName: string;
  accountId: string;
  accountName: string;
  permissionSetArn: string;
  permissionSetName: string;
  instanceArn: string;
}

export class TerraformHandler {
  private assignments: SSOAssignmentInfo[];

  constructor(assignments: SSOAssignmentInfo[]) {
    this.assignments = assignments;
  }

  public runImportCommands(assignmentName: string, ssoRegion: string): void {
    const commands = this.generateTerraformImportCommands(assignmentName, ssoRegion);
    execSync("terraform init");
    commands.forEach((command) => {
      console.log(`Started to run command: '${command}'`);
      execSync(command);
    });
  }

  private generateTerraformImportCommands(assignmentName: string, ssoRegion: string): string[] {
    return this.assignments.map((assignment: SSOAssignmentInfo) => {
      if (!["GROUP", "USER"].includes(assignment.principalType)) {
        throw new Error(
          `Unexpected principalType: ${assignment.principalType}`
        );
      }
      const principalTypeName =
        assignment.principalType === "GROUP" ? "groups" : "users";
      return [
        "terraform",
        "import",
        `-var="sso_region=${ssoRegion}"`,
        [
          "module",
          `${assignmentName}_assignments`,
          "aws_ssoadmin_account_assignment",
          `${principalTypeName}[\\"${[
            assignment.accountName,
            assignment.principalDisplayName,
            assignment.permissionSetName,
          ].join(".")}\\"]`,
        ].join("."),
        [
          assignment.principalId,
          assignment.principalType,
          assignment.accountId,
          "AWS_ACCOUNT",
          assignment.permissionSetArn,
          assignment.instanceArn,
        ].join(","),
      ].join(" ");
    });
  }

  public formatTfFile(): void {
    execSync("terraform fmt");
  }

  public generateTfvars(assignmentName: string): void {
    const accountNames: string[] = Array.from(
      new Set(this.assignments.map((assignment) => assignment.accountName))
    );
    const filebody =
      `assignments_${assignmentName} = {\n` +
      accountNames
        .map((accountName) => {
          const assignmentAccounts: SSOAssignmentInfo[] = this.assignments.filter(
            (assignment) => assignment.accountName === accountName
          );
          if (Object.keys(assignmentAccounts).length === 0) {
            return;
          }

          let accountAssignmentsHcl = `"${accountName}" = {\n`;

          // groups
          const assignmentGroups: SSOAssignmentInfo[] = this.assignments.filter(
            (assignment) =>
              assignment.accountName === accountName &&
              assignment.principalType === "GROUP"
          );
          if (Object.keys(assignmentGroups).length !== 0) {
            const groupNames = Array.from(
              new Set(
                assignmentGroups.map(
                  (assignment) => assignment.principalDisplayName
                )
              )
            );
            // eslint-disable-next-line prettier/prettier
            accountAssignmentsHcl += "\"groups\" = {\n";
            groupNames.forEach((groupName: string) => {
              accountAssignmentsHcl += `"${groupName}" = [\n`;
              accountAssignmentsHcl += assignmentGroups
                .filter(
                  (assignment: SSOAssignmentInfo) =>
                    assignment.principalDisplayName === groupName
                )
                .map(
                  (assignment: SSOAssignmentInfo) =>
                    `"${assignment.permissionSetName}",\n`
                )
                .join("");
              accountAssignmentsHcl += "],\n";
            });
            accountAssignmentsHcl += "},\n";
          }

          // Users
          const assignmentUsers: SSOAssignmentInfo[] = this.assignments.filter(
            (assignment) =>
              assignment.accountName === accountName &&
              assignment.principalType === "USER"
          );
          if (Object.keys(assignmentUsers).length !== 0) {
            const userNames = Array.from(
              new Set(
                assignmentUsers.map(
                  (assignment: SSOAssignmentInfo) =>
                    assignment.principalDisplayName
                )
              )
            );
            // eslint-disable-next-line prettier/prettier
            accountAssignmentsHcl += "\"users\" = {\n";
            userNames.forEach((userName: string) => {
              accountAssignmentsHcl += `"${userName}" = [\n`;
              accountAssignmentsHcl += assignmentUsers
                .filter(
                  (assignment: SSOAssignmentInfo) =>
                    assignment.principalDisplayName === userName
                )
                .map(
                  (assignment: SSOAssignmentInfo) =>
                    `"${assignment.permissionSetName}",\n`
                )
                .join("");
              accountAssignmentsHcl += "],\n";
            });
            accountAssignmentsHcl += "},\n";
          }
          accountAssignmentsHcl += "},\n";
          return accountAssignmentsHcl;
        })
        .join("") +
      "}\n";

    fs.writeFileSync(`./${assignmentName}.auto.tfvars`, filebody, "utf-8");
  }
}
