resource "google_storage_bucket" "zdjecia-koni" {
  name                        = "${local.res_prefix}zdjecia-koni"
  location                    = local.region
  storage_class               = "STANDARD"
  project                     = local.project_id
  uniform_bucket_level_access = false
  public_access_prevention    = "enforced"
}


output "images_bucket_name" {
  description = "Object storage bucket for user uploaded images"
  value       = google_storage_bucket.zdjecia-koni.name
}

