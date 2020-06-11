from django.urls import path

from communication import views
from communication import api

urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
    path('video/<str:room>/', views.VideoView.as_view(), name='video'),
    path('api/room/', api.RoomAPI.as_view(), name='room_api'),
]
