#!/bin/bash
# AWS Lambda Web Adapter bootstrap script
# Launches uvicorn with FastAPI app for streaming support
export AWS_LAMBDA_LOG_LEVEL=info
exec /var/lang/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8000
