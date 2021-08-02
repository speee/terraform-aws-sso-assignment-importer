# terraform-aws-sso-assignment-importer

A script to import AWS Resources defined by [speee/terraform-aws-sso-assignment](https://github.com/speee/terraform-aws-sso-assignment) automatically.

## Usage
```
sso-importer <command>

Commands:
  sso-importer import-all  Import All AWS SSO assignments
  sso-importer import      Import AWS SSO assignments

Options:
  --version        Show version number                                 [boolean]
  --sso-region     Region of AWS SSO instance                [string] [required]
  --generate-only  Not to run import command but generate Terraform file.
                                                      [boolean] [default: false]
  --help           Show help                                           [boolean]
```
