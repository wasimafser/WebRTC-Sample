from django.urls import re_path
from django.conf.urls import url

from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/video/(?P<room>\w+)/$', consumers.VideoConsumer),
    # url(r'^ws/video/(?P<room>[^/]+)/$', consumers.VideoConsumer),
]
