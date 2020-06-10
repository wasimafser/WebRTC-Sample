from django.urls import path

from communication import views

urlpatterns = [
    path('', views.IndexView.as_view(), name='index'),
    path('video/<str:room>/', views.VideoView.as_view(), name='video'),
]
