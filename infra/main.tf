# Auto-Storefront Infrastructure
# Task 1.1.1 - Video Ingestion DigitalOcean Space

terraform {
  required_version = ">= 1.0.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token             = var.do_token
  spaces_access_id  = var.spaces_access_id
  spaces_secret_key = var.spaces_secret_key
}

# DigitalOcean Space for Video Ingestion (S3-compatible)
resource "digitalocean_spaces_bucket" "video_ingestion" {
  name   = var.space_name
  region = var.do_region

  # CORS Configuration for Direct Browser Uploads
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    max_age_seconds = 3600
  }

  # Lifecycle Rules
  # Rule 1: Delete raw uploads after 7 days
  lifecycle_rule {
    id      = "delete-raw-uploads"
    enabled = true
    prefix  = "raw/"

    expiration {
      days = 7
    }
  }

  # Rule 2: Delete processed videos after 90 days
  lifecycle_rule {
    id      = "delete-processed-videos"
    enabled = true
    prefix  = "processed/"

    expiration {
      days = 90
    }
  }

  # Rule 3: Delete thumbnails after 365 days
  lifecycle_rule {
    id      = "delete-thumbnails"
    enabled = true
    prefix  = "thumbnails/"

    expiration {
      days = 365
    }
  }

  # Rule 4: Abort incomplete multipart uploads
  lifecycle_rule {
    id      = "abort-incomplete-uploads"
    enabled = true

    abort_incomplete_multipart_upload_days = 1
  }
}

# CDN Endpoint for faster delivery across SEA
resource "digitalocean_cdn" "video_cdn" {
  origin           = digitalocean_spaces_bucket.video_ingestion.bucket_domain_name
  custom_domain    = var.cdn_custom_domain
  certificate_name = var.cdn_certificate_name
  ttl              = 3600

  count = var.enable_cdn ? 1 : 0
}
