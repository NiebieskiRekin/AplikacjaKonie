variable "machine_type" {
  default = "e2-micro"
  type    = string
}

variable "machine_image" {
  default = "debian-cloud/debian-12" # NOTE: Bloated by google-cloud-cli, preferably use another image or remove it BEFORE first upgrade
  type    = string
}

resource "google_compute_instance" "default" {
  name         = "${local.res_prefix}vm"
  machine_type = var.machine_type
  zone         = local.zone
  tags         = ["http", "https", "ssh", "postgres"]

  boot_disk {
    initialize_params {
      image = var.machine_image
    }
  }

  attached_disk {
    source      = google_compute_disk.postgres_database.id
    device_name = google_compute_disk.postgres_database.name
  }

  # Ignore changes for persistent disk attachments
  lifecycle {
    ignore_changes = [attached_disk]
  }

  network_interface {
    network    = google_compute_network.vpc.id
    subnetwork = google_compute_subnetwork.subnetwork.id
    access_config {
    }
  }
  depends_on = [google_project_service.api]
}

resource "google_compute_attached_disk" "postgres_database_attached_disk" {
  disk     = google_compute_disk.postgres_database.self_link
  instance = google_compute_instance.default.self_link
}

output "instance_public_ip" {
  description = "Public IP of compute instance"
  value       = google_compute_instance.default.network_interface[0].access_config[0].nat_ip
}

output "postgres_disk_device_name" {
  description = "Device name of external disk for postgres database"
  value       = google_compute_attached_disk.postgres_database_attached_disk.device_name
}

