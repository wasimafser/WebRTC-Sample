from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.shortcuts import get_object_or_404

from .serializers import *

class RoomAPI(APIView):
    ''' Manage Room identities '''

    def generate_random_code(self):
        import random
        import string
        while True:
            code = ''.join(random.choice(string.ascii_letters) for _ in range(10))
            try:
                model_object = Room.objects.get(code=code)
            except Room.DoesNotExist:
                return code

    def get(self, request, format=None):
        serializer = RoomSerializer(Room.objects.all(), many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        ''' Specifically used to create a new ROOM '''
        request.data['code'] = self.generate_random_code()
        serializer = RoomSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
