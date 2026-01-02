# Task 1.1.1 - Video Ingestion DigitalOcean Space

Terraform configuration for the Auto-Storefront video ingestion infrastructure on DigitalOcean.

## What This Creates

- DigitalOcean Space (S3-compatible) in `sgp1` (Singapore)
- CORS configuration for direct browser uploads
- Lifecycle policies:
  - `raw/` - Auto-delete after 7 days
  - `processed/` - Auto-delete after 90 days
  - `thumbnails/` - Auto-delete after 365 days
  - Abort incomplete multipart uploads after 1 day
- Optional CDN endpoint for faster SEA delivery

## Prerequisites

1. **Install Terraform**:
   ```bash
   brew install terraform
   ```

2. **DigitalOcean Account**: Sign up at [cloud.digitalocean.com](https://cloud.digitalocean.com)

3. **Generate API Credentials**:

   **API Token** (for Terraform provider):
   - Go to: API → Tokens → Generate New Token
   - Name: `terraform-autostorefront`
   - Scopes: Read + Write
   - Copy the token (shown only once)

   **Spaces Keys** (for S3-compatible access):
   - Go to: API → Spaces Keys → Generate New Key
   - Name: `autostorefront-spaces`
   - Copy both Access Key and Secret Key

## Secure Execution Instructions

### 1. Navigate to infra directory
```bash
cd ~/auto-storefront/infra
```

### 2. Create your tfvars file
```bash
cp terraform.tfvars.example terraform.tfvars
```

### 3. Edit terraform.tfvars with your credentials
```bash
nano terraform.tfvars
```

Fill in:
- `do_token` - Your API token
- `spaces_access_id` - Spaces access key
- `spaces_secret_key` - Spaces secret key
- `space_name` - Globally unique name (lowercase, hyphens only)

### 4. Initialize Terraform
```bash
terraform init
```

### 5. Preview changes (always do this first)
```bash
terraform plan
```

Review the output. Should show 1-2 resources to create (Space + optional CDN).

### 6. Apply the configuration
```bash
terraform apply
```

Type `yes` when prompted.

### 7. Verify outputs
```bash
terraform output
```

Note the `space_endpoint` and `s3_compatible_config` for Task 1.1.2.

## Using with AWS SDK (S3-compatible)

DigitalOcean Spaces is S3-compatible. Configure AWS SDK like this:

```javascript
const { S3Client } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  endpoint: "https://sgp1.digitaloceanspaces.com",
  region: "sgp1",
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_ID,
    secretAccessKey: process.env.SPACES_SECRET_KEY,
  },
});
```

## Destroy (if needed)

```bash
terraform destroy
```

**Warning**: This will delete the Space and all contents.

## Security Checklist

- [ ] Never commit `terraform.tfvars`
- [ ] Never commit DO tokens or Spaces keys
- [ ] Review `terraform plan` before applying
- [ ] Rotate keys periodically
- [ ] Use separate keys for dev/staging/prod
