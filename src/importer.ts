import { AWSClient } from "./AWSClient";
import { AccountAssignment } from "@aws-sdk/client-sso-admin";

export class Importer {
  private client: AWSClient;

  constructor(region: string) {
    this.client = new AWSClient(region);
  }

  public async fetchAllAssignments(): Promise<AccountAssignment[]> {
    console.log("Fetching accounts in AWS Organizations.");
    const accounts = (await this.client.listAccounts()).map(
      (account) => account.Id!
    );
    console.log(
      "Fetched accounts. Assignments in accounts below will be imported."
    );
    console.log(accounts);

    return this.fetchAssignments(accounts);
  }

  public async fetchAssignments(
    accountIds: string[]
  ): Promise<AccountAssignment[]> {
    const instanceArn = await this.client.getInstanceArn();
    const permissionSets: string[] = await this.client.listPermissionSetArns(
      instanceArn
    );
    const allAssignment: AccountAssignment[] = [];
    for await (const accountId of accountIds) {
      const accountAssignments = await this.fetchAssingmentsByAccountId(
        accountId,
        instanceArn,
        permissionSets
      );
      allAssignment.push(...accountAssignments);
    }
    return allAssignment;
  }

  public async fetchAssingmentsByAccountId(
    accountId: string,
    instanceArn: string,
    permissionSets: string[]
  ): Promise<AccountAssignment[]> {
    const accountAssignments = [];
    console.debug(`Fetching account assignments for Account: ${accountId}...`);
    for await (const permissionSet of permissionSets) {
      const accountPermissionSetAssignments = await this.client.listAccountAssignments(
        accountId,
        instanceArn,
        permissionSet
      );
      accountAssignments.push(...accountPermissionSetAssignments);
    }
    console.debug(`Fetched ${accountAssignments.length} account assignments.`);
    return accountAssignments;
  }
}
