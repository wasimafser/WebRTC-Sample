from django.urls import path

from communication import views
from communication import api

urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
    path('video/<str:room>/', views.VideoView.as_view(), name='video'),
    path('client_1/', views.ClientOneView.as_view(), name='client_1'),
    path('client_2/', views.ClientTwoView.as_view(), name='client_2'),
    path('api/room/', api.RoomAPI.as_view(), name='room_api'),
    path('api/recording/', api.VideoAPI.as_view(), name='recording_api'),
]
