"""Run locally: python -m scripts.sync_agroalert_boundaries [--force] [--strict]."""

import argparse

from app.services.agroalert_boundaries import sync


def main() -> int:
    parser = argparse.ArgumentParser(description="Sincronizar límites OSM para AgroAlert")
    parser.add_argument("--if-needed", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()
    try:
        changed = sync(force=args.force)
        print(
            "Límites actualizados." if changed else "Los límites existentes ya pasan la validación."
        )
        return 0
    except (ValueError, OSError):
        print("No se pudo actualizar: se conservan los límites locales.")
        return 1 if args.strict else 0


if __name__ == "__main__":
    raise SystemExit(main())
