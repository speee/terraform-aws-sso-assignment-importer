import { AWSClient } from "./AWSClient";
import {
  AccountAssignment,
} from "@aws-sdk/client-sso-admin";

export class Importer {
  private client: AWSClient;

  constructor (region: string) {
    this.client = new AWSClient(region);
  }

  public async fetchAllAssignments(accountIds: string[]): Promise<AccountAssignment[]> {
    const instanceArn = await this.client.getInstanceArn();
    const permissionSets: string[] = await this.client.listPermissionSetArns(instanceArn);
    const allAssignment: AccountAssignment[] = [];
    for await (const accountId of accountIds) {
      allAssignment.push(...await this.fetchAssingmentsByAccountId(accountId, instanceArn, permissionSets))
    }
    return allAssignment;
  }

  public async fetchAssingmentsByAccountId(accountId: string, instanceArn: string, permissionSets: string[]): Promise<AccountAssignment[]> {
    const accountAssignments = [];
    console.debug(`Fetching account assignments for Account: ${accountId}...`);
    for await (const permissionSet of permissionSets) {
      accountAssignments.push(
        ...await this.client.listAccountAssignments(accountId, instanceArn, permissionSet)
      )
    }
    console.debug(`Fetched ${accountAssignments.length} account assignments.`);
    return accountAssignments;
  }
}
