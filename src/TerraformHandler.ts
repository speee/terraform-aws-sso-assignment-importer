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

  // public generateTerraformFiles() {}

  // private initDirectories() {}

  // public runImportCommands() {}

  //  private generateTerraformImportCommands() {}

  public formatTfFile(filename: string): void {
    execSync(`terraform fmt ${filename}`);
  }

  public generateTfvars(assignments_name: string): void {
    const accountNames: string[] = Array.from(
      new Set(this.assignments.map((assignment) => assignment.accountName))
    );
    const filebody =
      `${assignments_name} = {\n` +
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
            // eslint-disable-next-line quotes
            accountAssignmentsHcl += '"groups" = {\n';
            groupNames.forEach((groupName: string) => {
              accountAssignmentsHcl += `"${groupName}" = [\n`;
              accountAssignmentsHcl += assignmentGroups
                .filter(
                  (assignment: SSOAssignmentInfo) =>
                    assignment.principalDisplayName == groupName
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
            // eslint-disable-next-line quotes
            accountAssignmentsHcl += '"users" = {\n';
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

    fs.writeFileSync(`./${assignments_name}.auto.tfvars`, filebody, "utf-8");
  }
}
