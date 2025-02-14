resource "google_compute_network" "vpc" {
  name                            = "${local.res_prefix}main"
  routing_mode                    = "REGIONAL"
  auto_create_subnetworks         = false
  delete_default_routes_on_create = false
  depends_on                      = [google_project_service.api]
}

resource "google_compute_subnetwork" "subnetwork" {
  name          = "${local.res_prefix}subnetwork"
  ip_cidr_range = "192.168.32.0/24"
  region        = local.region
  network       = google_compute_network.vpc.id
}
