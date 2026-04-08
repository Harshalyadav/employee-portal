#!/bin/bash
# Deploy HRM (web/frontend) Docker image to AWS ECR
# Uses AWS profile: hrms
#
# Ensure executable: chmod +x deploy-ecr.sh
# Run from hrm directory: ./deploy-ecr.sh

set -e

# Ensure this script is executable for next run
chmod +x "$(dirname "$0")/$(basename "$0")" 2>/dev/null || true

AWS_PROFILE="${AWS_PROFILE:-hrms}"
AWS_REGION="me-central-1"
ECR_REGISTRY="715923838341.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_NAME="hrms/hrms-web"
ECR_URI="${ECR_REGISTRY}/${IMAGE_NAME}:latest"

echo "Using AWS profile: $AWS_PROFILE"
echo "Region: $AWS_REGION"
echo "ECR repository: $ECR_URI"
echo ""

# 1. Authenticate Docker to ECR
echo ">>> Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" --profile "$AWS_PROFILE" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"
echo "ECR login successful."
echo ""

# 2. Build the Docker image (from hrm directory)
# Use linux/amd64 for AWS (Ubuntu/x86_64)
echo ">>> Building Docker image (platform: linux/amd64)..."
docker build --platform linux/amd64 -t "$IMAGE_NAME:latest" .
echo "Build completed."
echo ""

# 3. Tag image for ECR
echo ">>> Tagging image..."
docker tag "$IMAGE_NAME:latest" "$ECR_URI"
echo "Tagged: $ECR_URI"
echo ""

# 4. Push to ECR
echo ">>> Pushing to ECR..."
docker push "$ECR_URI"
echo ""

echo "Done. Image pushed: $ECR_URI"
