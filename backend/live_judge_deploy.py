import os
import shutil
import subprocess
import zipfile


def main():
    print("Creating live-judge Lambda deployment package...")

    if os.path.exists("live-judge-package"):
        shutil.rmtree("live-judge-package")
    if os.path.exists("live-judge-lambda.zip"):
        os.remove("live-judge-lambda.zip")

    os.makedirs("live-judge-package")

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
            "pip install --target /var/task/live-judge-package boto3 --platform manylinux2014_x86_64 --only-binary=:all: --upgrade",
        ],
        check=True,
    )

    print("Copying application files...")
    for file in ["live_judge_handler.py", "bedrock_client.py"]:
        if os.path.exists(file):
            shutil.copy2(file, "live-judge-package/")

    judge_src = os.path.join("..", "evals", "judge.py")
    if os.path.exists(judge_src):
        shutil.copy2(judge_src, "live-judge-package/")

    print("Creating zip file...")
    with zipfile.ZipFile("live-judge-lambda.zip", "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk("live-judge-package"):
            for name in files:
                path = os.path.join(root, name)
                zf.write(path, os.path.relpath(path, "live-judge-package"))

    size_mb = os.path.getsize("live-judge-lambda.zip") / (1024 * 1024)
    print(f"✓ Created live-judge-lambda.zip ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
