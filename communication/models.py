from django.db import models

# Create your models here.

class Room(models.Model):
    code = models.CharField(max_length=255)

    def __str__(self):
        return self.code

    @property
    def group_name(self):
        return f"room-{self.id}"
