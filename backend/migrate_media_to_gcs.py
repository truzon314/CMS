from pathlib import Path
import mimetypes

from google.cloud import storage


PROJECT_ID = "truzonhomescom"
BUCKET_NAME = "truzon-cms-media"
MEDIA_DIR = Path("media_storage")


def main():
    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(BUCKET_NAME)

    files = [p for p in MEDIA_DIR.iterdir() if p.is_file()]

    print(f"Found {len(files)} local media files.")
    print()

    uploaded = 0
    skipped = 0
    failed = 0

    for index, path in enumerate(files, start=1):
        key = path.name
        blob = bucket.blob(key)

        try:
            if blob.exists():
                print(f"[{index}/{len(files)}] SKIP   {key}")
                skipped += 1
                continue

            content_type = (
                mimetypes.guess_type(str(path))[0]
                or "application/octet-stream"
            )

            blob.upload_from_filename(
                str(path),
                content_type=content_type,
            )

            print(f"[{index}/{len(files)}] UPLOAD {key}")
            uploaded += 1

        except Exception as exc:
            print(f"[{index}/{len(files)}] FAILED {key}")
            print(f"    {exc}")
            failed += 1

    print()
    print("================================")
    print("Migration complete")
    print("================================")
    print(f"Uploaded : {uploaded}")
    print(f"Skipped  : {skipped}")
    print(f"Failed   : {failed}")


if __name__ == "__main__":
    main()
