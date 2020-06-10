from django.shortcuts import render
from django.views import View

from .models import Room

# Create your views here.
class IndexView(View):
    template_name = 'communication/index.html'

    def get(self, request, *args, **kwargs):
        return render(request, self.template_name)


class VideoView(View):
    template_name = 'communication/video.html'

    def get(self, request, room, *args, **kwargs):
        context = {
            'room': room,
            'rooms': Room.objects.all()
        }
        return render(request, self.template_name, context=context)
