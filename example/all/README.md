# Import account assignments of all accounts in AWS Organizations.

## How to import assignments

### Run import-all command.
This command generates `all.auto.tfvars` and run `terraform import` command.

Assign the region name of your AWS SSO region to `${AWS_SSO_REGION}`.

```bash
sso-importer import-all \
  --sso-region ${AWS_SSO_REGION} \
```

### Validate there is no diffs.

```bash
terraform plan -var="sso_region=${AWS_SSO_REGION}"
```
