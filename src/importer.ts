import { AWSClient } from "./AWSClient";
import { AccountAssignment } from "@aws-sdk/client-sso-admin";
import { Account } from "@aws-sdk/client-organizations";
import { SSOAssignmentInfo } from "./TerraformHandler";
import { backOff } from "exponential-backoff";

export class Importer {
  private client: AWSClient;

  constructor(region: string) {
    this.client = new AWSClient(region);
  }

  public async fetchAllAssignments(): Promise<SSOAssignmentInfo[]> {
    console.log("Fetching accounts in AWS Organizations.");
    const accounts: Account[] = await this.client.listAccounts();
    const accountIds: string[] = accounts.map((account) => account.Id!);
    console.log(
      "Fetched accounts. Assignments in accounts below will be imported."
    );
    console.log(accounts);

    return this.fetchAssignments(accountIds);
  }

  public async fetchAssignments(
    accountIds: string[]
  ): Promise<SSOAssignmentInfo[]> {
    const instanceArn: string = await this.client.getInstanceArn();
    const permissionSets: string[] = await this.client.listPermissionSetArns(
      instanceArn
    );
    const allAssignments: SSOAssignmentInfo[] = [];
    for await (const accountId of accountIds) {
      const accountAssignments: SSOAssignmentInfo[] =
        await this.fetchAssingmentsByAccountId(
          accountId,
          instanceArn,
          permissionSets
        );
      allAssignments.push(...accountAssignments);
    }
    return allAssignments;
  }

  public async fetchAssingmentsByAccountId(
    accountId: string,
    instanceArn: string,
    permissionSets: string[]
  ): Promise<SSOAssignmentInfo[]> {
    const accountAssignments: AccountAssignment[] = [];
    console.debug(`Fetching account assignments for Account: ${accountId}...`);
    for await (const permissionSet of permissionSets) {
      const accountPermissionSetAssignments: AccountAssignment[] =
        await this.client.listAccountAssignments(
          accountId,
          instanceArn,
          permissionSet
        );
      accountAssignments.push(...accountPermissionSetAssignments);
    }
    console.debug(`Fetched ${accountAssignments.length} account assignments.`);
    const ssoAssingmensInfo: SSOAssignmentInfo[] = await Promise.all(
      accountAssignments.map((assignment: AccountAssignment) =>
        backOff(() => this.convertSSOAssignmentInfo(assignment))
      )
    );
    return ssoAssingmensInfo;
  }

  public async convertSSOAssignmentInfo(
    accountAssignment: AccountAssignment
  ): Promise<SSOAssignmentInfo> {
    const instanceArn: string = await this.client.getInstanceArn();
    const ssoAssignmentInfo: SSOAssignmentInfo = {
      accountId: accountAssignment.AccountId!,
      accountName: await this.client.getAccountNameById(
        accountAssignment.AccountId!
      ),
      instanceArn: instanceArn,
      permissionSetArn: accountAssignment.PermissionSetArn!,
      permissionSetName: await this.client.getPermissionSetName(
        accountAssignment.PermissionSetArn!,
        instanceArn
      ),
      principalDisplayName: await this.client.getDisplayName(
        accountAssignment.PrincipalId!,
        accountAssignment.PrincipalType!
      ),
      principalId: accountAssignment.PrincipalId!,
      principalType: accountAssignment.PrincipalType!,
    };
    return ssoAssignmentInfo;
  }
}
