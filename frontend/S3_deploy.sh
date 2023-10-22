#!/bin/bash

# Usage: ./S3-deploy.sh --bucket your-bucket-name [--skip-build] [--undo]

S3_BUCKET_NAME=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --bucket)
      shift
      S3_BUCKET_NAME="$1"
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --undo)
      UNDO=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Function to deploy the app to S3
deploy_app() {
  if [ "$SKIP_BUILD" != true ]; then
    # Build your React app (use your build command)
    npm run build
  fi

  # Check if the S3 bucket exists, create it if not
  if ! aws s3api head-bucket --bucket "${S3_BUCKET_NAME}" 2>/dev/null; then
    echo "Creating S3 bucket: ${S3_BUCKET_NAME}"
    aws s3 mb s3://${S3_BUCKET_NAME} --region ap-southeast-1
  fi

  # # Sync the build directory with the S3 bucket
  aws s3 sync ./build "s3://${S3_BUCKET_NAME}"

  aws s3api delete-public-access-block --bucket ${S3_BUCKET_NAME}

  # Enable the s3 bucket to host an index and error html page, so refresh can work
  # and direct url access can work.
  aws s3 website "s3://${S3_BUCKET_NAME}" --index-document index.html --error-document index.html

  # Configure public read access
  aws s3api put-bucket-policy --bucket "${S3_BUCKET_NAME}" --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadForGetBucketObjects",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::'"${S3_BUCKET_NAME}"'/*"
      }
    ]
  }'

  # Display the URL of the deployed app
  echo "App deployed to S3 bucket: ${S3_BUCKET_NAME}"
  echo "Access the app at: http://${S3_BUCKET_NAME}.s3-website-ap-southeast-1.amazonaws.com/photo"
}

# Function to undo the deployment
undo_deploy() {
  # Check if the AWS CLI is installed
  if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it and configure your credentials."
    exit 1
  fi

  # List objects in the S3 bucket
  echo "Listing objects in the S3 bucket..."
  aws s3 ls "s3://${S3_BUCKET_NAME}" --recursive

  # Prompt for confirmation to delete objects
  read -p "Do you want to delete these objects? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation canceled."
    exit 0
  fi

  # Delete all objects in the S3 bucket
  echo "Deleting objects in the S3 bucket..."
  aws s3 rm "s3://${S3_BUCKET_NAME}/" --recursive

  # Delete the S3 bucket
  echo "Deleting the S3 bucket..."
  aws s3 rb "s3://${S3_BUCKET_NAME}"

  echo "Undo operation completed. The S3 bucket and its contents have been deleted."
}

# Check if the S3_BUCKET_NAME is provided
if [ -z "$S3_BUCKET_NAME" ]; then
  echo "Error: Please provide the S3 bucket name using the --bucket argument."
  exit 1
fi

# Check for the "--undo" argument
if [ "$UNDO" = true ]; then
  undo_deploy
else
  deploy_app
fi
