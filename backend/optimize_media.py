from pathlib import Path
from PIL import Image, ImageOps

SOURCE = Path("media_storage")
OUTPUT = Path("media_storage_optimized")

# Only optimize image files larger than this.
MIN_SIZE_MB = 1.0

# Maximum dimension for very large source images.
MAX_DIMENSION = 2560

JPEG_QUALITY = 82


def optimize_image(source: Path, destination: Path) -> None:
    with Image.open(source) as img:
        img = ImageOps.exif_transpose(img)

        original_size = img.size
        width, height = img.size

        # Resize only oversized images.
        max_dimension = max(width, height)

        if max_dimension > MAX_DIMENSION:
            scale = MAX_DIMENSION / max_dimension
            new_size = (
                max(1, round(width * scale)),
                max(1, round(height * scale)),
            )

            img = img.resize(new_size, Image.Resampling.LANCZOS)

        suffix = source.suffix.lower()

        if suffix in {".jpg", ".jpeg"}:
            # Keep the same filename and JPEG extension.
            if img.mode not in {"RGB", "L"}:
                img = img.convert("RGB")

            img.save(
                destination,
                format="JPEG",
                quality=JPEG_QUALITY,
                optimize=True,
                progressive=True,
            )

        elif suffix == ".png":
            # Keep PNG as PNG so database MIME/extension remain consistent.
            img.save(
                destination,
                format="PNG",
                optimize=True,
            )

        elif suffix == ".webp":
            img.save(
                destination,
                format="WEBP",
                quality=JPEG_QUALITY,
                method=6,
            )

        else:
            # Copy unsupported image types unchanged.
            destination.write_bytes(source.read_bytes())


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)

    processed = 0
    skipped = 0

    for source in SOURCE.iterdir():
        if not source.is_file():
            continue

        suffix = source.suffix.lower()

        if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue

        destination = OUTPUT / source.name

        size_mb = source.stat().st_size / (1024 * 1024)

        if size_mb < MIN_SIZE_MB:
            destination.write_bytes(source.read_bytes())
            skipped += 1
            continue

        try:
            optimize_image(source, destination)

            old_size = source.stat().st_size
            new_size = destination.stat().st_size

            old_mb = old_size / (1024 * 1024)
            new_mb = new_size / (1024 * 1024)
            saved = 100 * (1 - new_size / old_size)

            with Image.open(destination) as check:
                dimensions = check.size

            print(
                f"{source.name}\n"
                f"  {old_mb:.2f} MB -> {new_mb:.2f} MB "
                f"({saved:.1f}% smaller)\n"
                f"  dimensions: {dimensions}\n"
            )

            processed += 1

        except Exception as exc:
            print(f"ERROR: {source.name}: {exc}")

    print(f"Optimized: {processed}")
    print(f"Copied unchanged: {skipped}")


if __name__ == "__main__":
    main()
