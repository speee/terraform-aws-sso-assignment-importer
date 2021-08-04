# terraform-aws-sso-assignment-importer

A script to import AWS Resources defined by [speee/terraform-aws-sso-assignment](https://github.com/speee/terraform-aws-sso-assignment) automatically.

## Installation
```
npm build
npm i -g .
```

## Usage
### Create .tf files
To execute `import-all` command, set `${ASSIGNMENT_NAME}` as `all`
- `main.tf` (Replace the `${ASSIGNMENT_NAME}`)
```
module "${ASSIGNMENT_NAME}_assignments" {
  source = "git@github.com:speee/terraform-aws-sso-assignment.git"

  instance_arn      = local.instance_arn
  identity_store_id = local.identity_store_id

  organization_accounts = local.accounts

  assignments = var.assignments_${ASSIGNMENT_NAME}
}
```

- `variables.tf` (Replace the `${ASSIGNMENT_NAME}`)
```
variable "assignments_${ASSIGNMENT_NAME}" {
  type = map(map(map(list(string))))
}
```


### Import
- To import account assignments of all accounts in AWS Organizations.
```
sso-importer import-all

Import All AWS SSO assignments

Options:
  --version        Show version number                                 [boolean]
  --sso-region     Region of AWS SSO instance                [string] [required]
  --generate-only  Not to run import command but generate Terraform file.
                                                      [boolean] [default: false]
  --help           Show help                                           [boolean]
```

- To import account assignments of specified accounts.
```
sso-importer import

Import AWS SSO assignments

Options:
      --version          Show version number                           [boolean]
      --sso-region       Region of AWS SSO instance          [string] [required]
      --generate-only    Not to run import command but generate Terraform file.
                                                      [boolean] [default: false]
      --help             Show help                                     [boolean]
  -n, --assignment-name  Name of assignments. (e.g. OU name) [string] [required]
      --accounts         IDs of AWS accounts to be imported.  [array] [required]
```

## Example
### Import account assignments of all accounts in AWS Organizations.
```
cd ./example
sso-importer import-all
```

### Import account assignments of specified accounts.
```
cd ./example
sso-importer import \
  --sso-region ${AWS_SSO_REGION} \
  --assignment-name sample \
  --accounts 123456789012 234567890123
```
