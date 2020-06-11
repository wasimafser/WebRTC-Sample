from channels.db import database_sync_to_async

from .exceptions import ClientError
from .models import Room


# This decorator turns this function from a synchronous function into an async one
# we can call from our async consumers, that handles Django DBs correctly.
# For more, see http://channels.readthedocs.io/en/latest/topics/databases.html
@database_sync_to_async
def get_room_or_none(room):
    """
    Tries to fetch a room
    """
    # Find the room they requested (by code)
    try:
        room = Room.objects.get(code=room)
    except Room.DoesNotExist:
        room = None

    return room
