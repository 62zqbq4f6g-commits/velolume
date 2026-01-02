# Outputs for Video Ingestion Infrastructure (DigitalOcean)

output "space_name" {
  description = "Name of the DigitalOcean Space"
  value       = digitalocean_spaces_bucket.video_ingestion.name
}

output "space_urn" {
  description = "URN of the DigitalOcean Space"
  value       = digitalocean_spaces_bucket.video_ingestion.urn
}

output "space_region" {
  description = "Region of the Space"
  value       = digitalocean_spaces_bucket.video_ingestion.region
}

output "space_domain_name" {
  description = "Bucket domain name (for direct access)"
  value       = digitalocean_spaces_bucket.video_ingestion.bucket_domain_name
}

output "space_endpoint" {
  description = "S3-compatible endpoint URL"
  value       = "https://${var.do_region}.digitaloceanspaces.com"
}

output "cdn_endpoint" {
  description = "CDN endpoint (if enabled)"
  value       = var.enable_cdn ? digitalocean_cdn.video_cdn[0].endpoint : null
}

output "upload_paths" {
  description = "Space paths for different upload types"
  value = {
    raw        = "https://${digitalocean_spaces_bucket.video_ingestion.bucket_domain_name}/raw/"
    processed  = "https://${digitalocean_spaces_bucket.video_ingestion.bucket_domain_name}/processed/"
    thumbnails = "https://${digitalocean_spaces_bucket.video_ingestion.bucket_domain_name}/thumbnails/"
  }
}

output "s3_compatible_config" {
  description = "Config for S3-compatible clients (AWS SDK, etc.)"
  value = {
    endpoint         = "https://${var.do_region}.digitaloceanspaces.com"
    bucket           = digitalocean_spaces_bucket.video_ingestion.name
    region           = var.do_region
    force_path_style = false
  }
}
