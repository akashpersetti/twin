import os
import shutil
import subprocess
import zipfile


def main():
    print("Creating blog Lambda deployment package...")

    if os.path.exists("blog-lambda-package"):
        shutil.rmtree("blog-lambda-package")
    if os.path.exists("blog-lambda.zip"):
        os.remove("blog-lambda.zip")

    os.makedirs("blog-lambda-package")

    print("Installing dependencies for Lambda runtime...")
    subprocess.run(
        [
            "docker",
            "run",
            "--rm",
            "-v",
            f"{os.getcwd()}:/var/task",
            "--platform",
            "linux/amd64",
            "--entrypoint",
            "",
            "public.ecr.aws/lambda/python:3.12",
            "/bin/sh",
            "-c",
            "pip install --target /var/task/blog-lambda-package -r /var/task/requirements.txt "
            "--platform manylinux2014_x86_64 --only-binary=:all: --upgrade",
        ],
        check=True,
    )

    print("Copying application files...")
    for src_file in ["blog_server.py", "blog_lambda_handler.py"]:
        if os.path.exists(src_file):
            shutil.copy2(src_file, "blog-lambda-package/")

    print("Creating zip file...")
    with zipfile.ZipFile("blog-lambda.zip", "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk("blog-lambda-package"):
            for name in files:
                path = os.path.join(root, name)
                zf.write(path, os.path.relpath(path, "blog-lambda-package"))

    size_mb = os.path.getsize("blog-lambda.zip") / (1024 * 1024)
    print(f"✓ Created blog-lambda.zip ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
