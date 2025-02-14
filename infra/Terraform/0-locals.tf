locals {
  project_id = "aplikacjakonie"
  region     = "us-east1" # https://cloud.google.com/free/docs/free-cloud-features#compute
  zone       = "us-east1-b"
  res_prefix = "aplikacjakonie-"
  apis = [
    "compute.googleapis.com"
  ]
  firewall_rules = {
    "allow-https" = {
      "protocol"    = "tcp"
      "ports"       = ["443"]
      "priority"    = "1000"
      "tags"        = ["https"]
      "description" = "Allow https from anywhere."
      "source_ip_ranges" = [
        "0.0.0.0/0"
      ]
    },
    "allow-http" = {
      "protocol"    = "tcp"
      "ports"       = ["80"]
      "priority"    = "1000"
      "tags"        = ["http"]
      "description" = "Allow http from anywhere."
      "source_ip_ranges" = [
        "0.0.0.0/0"
      ]
    },
    "allow-ssh" = {
      "protocol"    = "tcp"
      "ports"       = ["22"]
      "priority"    = "1000"
      "tags"        = ["ssh"]
      "description" = "Allow SSH communication from trusted sources."
      "source_ip_ranges" = concat([
        "35.245.240.0/20", # ip range of internal google
      ], var.vpn_ip_addr)
    },
    "allow-postgres" = {
      "protocol"    = "tcp"
      "ports"       = ["5432"]
      "priority"    = "1000"
      "tags"        = ["postgres"]
      "description" = "Allow access to database for development."
      "source_ip_ranges" = [
        "0.0.0.0/0"
      ]
    }
  }
}

variable "vpn_ip_addr" {
  type        = list(string)
  description = "IP address CIDR of VPN to allow SSH connections"
  default     = ["0.0.0.0/0"]
}

