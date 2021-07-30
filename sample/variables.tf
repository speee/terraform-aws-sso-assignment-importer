variable "sso_region" {
  type        = string
  description = "Region of your AWS SSO instance."
}

variable "assignments_sample" {
  type = map(map(map(list(string))))
}
