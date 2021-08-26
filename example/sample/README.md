# Import account assignments of specified accounts.

## How to import assignments

### Run import command.
This command generates `sample.auto.tfvars` and run `terraform import` command.

Assign the region name of your AWS SSO region to `${AWS_SSO_REGION}`.

```bash
sso-importer import \
  --sso-region ${AWS_SSO_REGION} \
  --assignment-name sample \
  --accounts ${AWS_ACCOUNT_ID_1} ${AWS_ACCOUNT_ID_2}
```

### Validate there is no diffs.

```bash
terraform plan -var="sso_region=${AWS_SSO_REGION}"
```
