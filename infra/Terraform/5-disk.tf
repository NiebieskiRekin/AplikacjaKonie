resource "google_compute_disk" "postgres_database" {
  name = "${local.res_prefix}disk"
  type = "pd-standard"
  zone = local.zone
  labels = {
    environment  = "dev"
    dedicated_to = "postgres_database"
  }
  size                      = 5
  physical_block_size_bytes = 4096 # block size
  project                   = local.project_id
  depends_on                = [google_project_service.api]
}
