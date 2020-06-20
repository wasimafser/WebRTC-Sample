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


class VideoAPI(APIView):
    def post(self, request, format=None):
        baseDir = settings.BASE_DIR
        path = baseDir + "/media/recordings/test/"

        try:
            # recordingLength = float(request.META['HTTP_LENGTH'])

            path = baseDir + "/media/recordings/test/"
            filename = "test"

            if not os.path.exists(path):
                os.makedirs(path)

            extension = ".ogg" if promptGroup.type == "audio" else ".webm"
            with open(path + filename + extension, 'wb+') as destination:
                for chunk in request.FILES['blob'].chunks():
                    destination.write(chunk)

            # AudioSegment.from_file(path+filename+".ogg").export(path+filename+".mp3", format="mp3").close()
            # os.remove(path+filename+".ogg")

            # Recording.objects.create(path=path, name=filename + extension, created=timezone.now(),
            #                                      user_id=userID,
            #                                      length=recordingLength)
        except:
            logger.critical("Error while trying to upload! Please check previous Log Messages")
            raise SuspiciousFileOperation

        return Response(path, status=status.HTTP_201_CREATED)
