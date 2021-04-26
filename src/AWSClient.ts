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

export class AWSClient {
  private client: SSOAdminClient;

  constructor(region: string) {
    const config = {
      region: region,
    };
    this.client = new SSOAdminClient(config);
  }

  public async getInstanceArn(): Promise<string> {
    const command = new ListInstancesCommand({});
    const response: ListInstancesCommandOutput = await this.client.send(
      command
    );

    return response.Instances![0].InstanceArn!;
  }

  public async listPermissionSetArns(instanceArn: string): Promise<string[]> {
    const paginationConfig: SSOAdminPaginationConfiguration = {
      client: this.client,
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
      client: this.client,
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
}
