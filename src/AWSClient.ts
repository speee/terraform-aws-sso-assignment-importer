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
  DescribePermissionSetCommand,
  DescribePermissionSetCommandInput,
  DescribePermissionSetCommandOutput,
} from "@aws-sdk/client-sso-admin";

import {
  OrganizationsClient,
  OrganizationsPaginationConfiguration,
  ListAccountsCommandInput,
  paginateListAccounts,
  Account,
} from "@aws-sdk/client-organizations";

import {
  IdentitystoreClient,
  DescribeUserCommand,
  DescribeUserCommandInput,
  DescribeGroupCommand,
  DescribeGroupCommandInput,
} from "@aws-sdk/client-identitystore";

import { backOff } from "exponential-backoff";

interface IdentityStoreCache {
  [key: string]: string;
}

interface PermissionSetNameCache {
  [key: string]: string;
}

export class AWSClient {
  private ssoClient: SSOAdminClient;
  private orgClient: OrganizationsClient;
  private identityStoreClient: IdentitystoreClient;
  private identityStoreCache: IdentityStoreCache;
  private region: string;
  private accounts: Account[];
  private permissionSetNameCache: PermissionSetNameCache;

  constructor(region: string) {
    this.region = region;
    const config = {
      region: this.region,
    };
    this.ssoClient = new SSOAdminClient(config);
    this.orgClient = new OrganizationsClient({});
    this.identityStoreClient = new IdentitystoreClient(config);
    this.identityStoreCache = {};
    this.accounts = [];
    this.permissionSetNameCache = {};
  }

  public async getInstanceArn(): Promise<string> {
    const command = new ListInstancesCommand({});
    const response: ListInstancesCommandOutput = await backOff(() =>
      this.ssoClient.send(command)
    );

    return response.Instances![0].InstanceArn!;
  }

  private async getIdentityStoreId(): Promise<string> {
    const command = new ListInstancesCommand({});
    const response: ListInstancesCommandOutput = await backOff(() =>
      this.ssoClient.send(command)
    );

    return response.Instances![0].IdentityStoreId!;
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

  public async getPermissionSetName(
    permissionSetArn: string,
    instanceArn: string
  ): Promise<string> {
    if (Object.keys(this.permissionSetNameCache).includes(permissionSetArn)) {
      return this.permissionSetNameCache[permissionSetArn];
    } else {
      const config: DescribePermissionSetCommandInput = {
        InstanceArn: instanceArn,
        PermissionSetArn: permissionSetArn,
      };
      const command = new DescribePermissionSetCommand(config);
      const result: DescribePermissionSetCommandOutput = await backOff(() =>
        this.ssoClient.send(command)
      );
      return result.PermissionSet!.Name!;
    }
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
    if (this.accounts.length > 0) {
      return this.accounts;
    }

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
    this.accounts = accounts;
    return this.accounts;
  }

  public async getDisplayName(
    principalId: string,
    principalType: string
  ): Promise<string> {
    if (Object.keys(this.identityStoreCache).includes(principalId)) {
      return this.identityStoreCache[principalId];
    } else {
      const identityStoreId = await this.getIdentityStoreId();
      if (principalType === "USER") {
        const config: DescribeUserCommandInput = {
          IdentityStoreId: identityStoreId,
          UserId: principalId,
        };
        const command = new DescribeUserCommand(config);
        const response = await this.identityStoreClient.send(command);
        const userName = response.UserName;
        this.identityStoreCache[principalId] = userName!;
        return response.UserName!;
      } else if (principalType === "GROUP") {
        const config: DescribeGroupCommandInput = {
          IdentityStoreId: identityStoreId,
          GroupId: principalId,
        };
        const command = new DescribeGroupCommand(config);
        const response = await this.identityStoreClient.send(command);
        const groupName = response.DisplayName;
        this.identityStoreCache[principalId] = groupName!;
        return groupName!;
      } else {
        throw Error(`No such PrincipalType: ${principalType}`);
      }
    }
  }

  public async getAccountNameById(accoundId: string): Promise<string> {
    if (this.accounts.length === 0) {
      this.accounts = await this.listAccounts();
    }
    return this.accounts.filter((account) => account.Id === accoundId)[0].Name!;
  }
}
