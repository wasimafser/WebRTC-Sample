import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from communication.utils import get_room_or_none

NOTIFY_USER_ON_JOIN = True

user_data = {}

class VideoConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room']
        self.room_group_name = 'video_%s' % self.room_name

        self.is_room = await get_room_or_none(self.room_name)
        print(self.is_room)

        if not self.is_room:
            return

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        user_data[self.room_group_name].remove(self.channel_name)
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        message = content['message']
        # Send message to room group
        if message == 'join':
            await self.join()
        else:
            # room_name = None
            for channel in user_data[self.room_group_name]:
                if channel != self.channel_name:
                    await self.channel_layer.send(
                        channel,
                        {
                            'type': 'message',
                            'message': message,
                            'channel': self.channel_name
                        }
                    )
                    break
            # await self.channel_layer.group_send(
            #     self.room_group_name,
            #     {
            #         'type': 'message',
            #         'message': message,
            #         'channel': self.channel_name
            #     }
            # )

    async def join(self):
        if not self.is_room:
            await self.channel_layer.send(
                self.channel_name,
                {
                    'type': 'message',
                    'message': 'rejected'
                }
            )
            return

        await self.channel_layer.send(
            self.channel_name,
            {
                'type': 'message',
                'message': 'joined'
            }
        )

        # count = getattr(self.channel_layer, )
        if self.room_group_name not in user_data.keys():
            user_data[self.room_group_name] = [self.channel_name]
        else:
            user_data[self.room_group_name].append(self.channel_name)
        # print(user_data)

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

    async def message(self, event):
        # print(event)
        await self.send_json({
            'message': event['message'],
            'channel': self.channel_name
        })
