resource "google_service_account" "image-uploader-and-notifier" {
  account_id   = "image-uploader"
  display_name = "Image uploader and notifier service account"
}

// Google Cloud Object Storage
resource "google_project_iam_member" "storage_uploader_binding" {
  project = local.project_id
  role    = "roles/storage.objectUser"
  member  = "serviceAccount:${google_service_account.image-uploader-and-notifier.email}"
}

// Firebase Cloud messaging
# resource "google_project_iam_member" "fcm_admin_binding" {
#   project = local.project_id
#   role    = "roles/cloudmessaging.messages.create"
#   member  = "serviceAccount:${google_service_account.image-uploader-and-notifier.email}"
# }

resource "google_service_account_key" "image-uploader-and-notifier-key" {
  service_account_id = google_service_account.image-uploader-and-notifier.name
}

output "service_account_email" {
  value = google_service_account.image-uploader-and-notifier.email
}

output "service_account_key" {
  value     = google_service_account_key.image-uploader-and-notifier-key.private_key
  sensitive = true
}

