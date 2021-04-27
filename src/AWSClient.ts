import {
  SSOAdminClient,
  ListInstancesCommand,
  ListInstancesCommandOutput,
  paginateListPermissionSets,
  ListPermissionSetsCommandInput,
  SSOAdminPaginationConfiguration,
  AccountAssignment,
  ListAccountAssignmentsCommandInput,
  paginateListAccountAssignments,
} from "@aws-sdk/client-sso-admin";

import {
  OrganizationsClient,
  OrganizationsPaginationConfiguration,
  ListAccountsCommandInput,
  paginateListAccounts,
  Account,
} from "@aws-sdk/client-organizations";

export class AWSClient {
  private ssoClient: SSOAdminClient;
  private orgClient: OrganizationsClient;

  constructor(region: string) {
    const config = {
      region: region,
    };
    this.ssoClient = new SSOAdminClient(config);
    this.orgClient = new OrganizationsClient({});
  }

  public async getInstanceArn(): Promise<string> {
    const command = new ListInstancesCommand({});
    const response: ListInstancesCommandOutput = await this.ssoClient.send(
      command
    );

    return response.Instances![0].InstanceArn!;
  }

  public async listPermissionSetArns(instanceArn: string): Promise<string[]> {
    const paginationConfig: SSOAdminPaginationConfiguration = {
      client: this.ssoClient,
    };
    const commandConfig: ListPermissionSetsCommandInput = {
      InstanceArn: instanceArn,
    };

    const permissionSetArns = [];
    for await (const page of paginateListPermissionSets(
      paginationConfig,
      commandConfig
    )) {
      permissionSetArns.push(...page.PermissionSets!);
    }

    return permissionSetArns;
  }

  public async listAccountAssignments(
    accountId: string,
    instanceArn: string,
    permissionSetArn: string
  ): Promise<AccountAssignment[]> {
    const paginationConfig: SSOAdminPaginationConfiguration = {
      client: this.ssoClient,
    };
    const commandConfig: ListAccountAssignmentsCommandInput = {
      AccountId: accountId,
      InstanceArn: instanceArn,
      PermissionSetArn: permissionSetArn,
    };

    const accountAssignments: AccountAssignment[] = [];
    for await (const page of paginateListAccountAssignments(
      paginationConfig,
      commandConfig
    )) {
      accountAssignments.push(...page.AccountAssignments!);
    }

    return accountAssignments;
  }

  public async listAccounts(): Promise<Account[]> {
    const paginationConfig: OrganizationsPaginationConfiguration = {
      client: this.orgClient,
    };
    const commandConfig: ListAccountsCommandInput = {};
    const accounts: Account[] = [];
    for await (const page of paginateListAccounts(
      paginationConfig,
      commandConfig
    )) {
      accounts.push(...page.Accounts!);
    }
    return accounts;
  }
}
