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
        client_id = request.query_params.get('client_id', None)
        if client_id:
            try:
                serializer = RoomSerializer(Room.objects.get(client_id=client_id))
            except Room.DoesNotExist:
                return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            serializer = RoomSerializer(Room.objects.all(), many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        ''' Specifically used to create a new ROOM '''
        _mutable = request.data._mutable
        request.data._mutable = True
        request.data['code'] = self.generate_random_code()
        request.data._mutable = _mutable
        serializer = RoomSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
