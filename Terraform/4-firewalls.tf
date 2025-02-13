resource "google_compute_firewall" "rules" {
  for_each    = local.firewall_rules
  project     = local.project_id
  name        = "${google_compute_network.vpc.name}-${each.key}"
  network     = google_compute_network.vpc.name
  description = each.value.description
  priority    = each.value.priority
  target_tags = lookup(each.value, "tags", null)
  allow {
    protocol = each.value.protocol
    ports    = lookup(each.value, "ports", null)
  }
  source_ranges = try(each.value.source_ip_ranges, [])
  depends_on    = [google_project_service.api]
}

