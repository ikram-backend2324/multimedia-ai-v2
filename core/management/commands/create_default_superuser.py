"""
Creates a Django superuser from environment variables if one does not exist.
Safe to run on every deploy — it will not create duplicates and will not crash
the build if the credentials are missing (it just skips).

Set these env vars in the Render dashboard:
    DJANGO_SUPERUSER_USERNAME
    DJANGO_SUPERUSER_EMAIL      (optional)
    DJANGO_SUPERUSER_PASSWORD
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create a default superuser from environment variables if missing."

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.getenv("DJANGO_SUPERUSER_USERNAME")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "")

        if not username or not password:
            self.stdout.write(
                self.style.WARNING(
                    "Skipping superuser creation: set DJANGO_SUPERUSER_USERNAME "
                    "and DJANGO_SUPERUSER_PASSWORD to enable it."
                )
            )
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.NOTICE(f"Superuser '{username}' already exists. Skipping.")
            )
            return

        User.objects.create_superuser(
            username=username, email=email, password=password
        )
        self.stdout.write(
            self.style.SUCCESS(f"Superuser '{username}' created successfully.")
        )
