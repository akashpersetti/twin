import os
import shutil
import zipfile
import subprocess
import stat


def main():
    print("Creating Lambda deployment package...")

    # Clean up
    if os.path.exists("lambda-package"):
        shutil.rmtree("lambda-package")
    if os.path.exists("lambda-deployment.zip"):
        os.remove("lambda-deployment.zip")

    # Create package directory
    os.makedirs("lambda-package")

    # Install dependencies using Docker with Lambda runtime image
    print("Installing dependencies for Lambda runtime...")

    # Use the official AWS Lambda Python 3.12 image
    # This ensures compatibility with Lambda's runtime environment
    subprocess.run(
        [
            "docker",
            "run",
            "--rm",
            "-v",
            f"{os.getcwd()}:/var/task",
            "--platform",
            "linux/amd64",  # Force x86_64 architecture
            "--entrypoint",
            "",  # Override the default entrypoint
            "public.ecr.aws/lambda/python:3.12",
            "/bin/sh",
            "-c",
            "pip install --target /var/task/lambda-package -r /var/task/requirements.txt --platform manylinux2014_x86_64 --only-binary=:all: --upgrade",
        ],
        check=True,
    )

    # Copy application files
    print("Copying application files...")
    for file in ["server.py", "auth.py", "lambda_handler.py", "telegram_handler.py", "context.py", "resources.py", "retrieval.py", "bedrock_client.py"]:
        if os.path.exists(file):
            shutil.copy2(file, "lambda-package/")

    # Copy run.sh bootstrap script for Lambda Web Adapter
    if os.path.exists("run.sh"):
        dest_run_sh = os.path.join("lambda-package", "run.sh")
        shutil.copy2("run.sh", dest_run_sh)
        # Make it executable (755 permissions)
        st = os.stat(dest_run_sh)
        os.chmod(dest_run_sh, st.st_mode | stat.S_IEXEC | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

    # Copy data directory
    if os.path.exists("data"):
        shutil.copytree("data", "lambda-package/data")

    # Create zip
    print("Creating zip file...")
    with zipfile.ZipFile("lambda-deployment.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("lambda-package"):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, "lambda-package")
                # Preserve executable permissions for run.sh
                if file == "run.sh":
                    zinfo = zipfile.ZipInfo(arcname)
                    zinfo.external_attr = os.stat(file_path).st_mode << 16
                    with open(file_path, "rb") as f:
                        zipf.writestr(zinfo, f.read())
                else:
                    zipf.write(file_path, arcname)

    # Show package size
    size_mb = os.path.getsize("lambda-deployment.zip") / (1024 * 1024)
    print(f"✓ Created lambda-deployment.zip ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
