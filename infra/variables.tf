# Variables for Video Ingestion Infrastructure (DigitalOcean)

# Authentication
variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "spaces_access_id" {
  description = "DigitalOcean Spaces access key ID"
  type        = string
  sensitive   = true
}

variable "spaces_secret_key" {
  description = "DigitalOcean Spaces secret key"
  type        = string
  sensitive   = true
}

# Region
variable "do_region" {
  description = "DigitalOcean region for Spaces"
  type        = string
  default     = "sgp1" # Singapore - optimal for SEA
}

# Space Configuration
variable "space_name" {
  description = "Name for the DigitalOcean Space (must be globally unique)"
  type        = string
}

variable "cors_allowed_origins" {
  description = "Allowed origins for CORS (your frontend domains)"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

# CDN (Optional)
variable "enable_cdn" {
  description = "Enable CDN for the Space"
  type        = bool
  default     = false
}

variable "cdn_custom_domain" {
  description = "Custom domain for CDN (optional)"
  type        = string
  default     = null
}

variable "cdn_certificate_name" {
  description = "SSL certificate name for custom CDN domain (optional)"
  type        = string
  default     = null
}

# Tags
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}
