---
title: Detecting Pet Activity with YOLO and Sending IM Notifications
date: 2026-10-30
tags:
  - YOLO
  - AI
  - Raspberry Pi
categories:
  - Tech
---

<script setup>
import CatRecapDiagram from '../../../.vitepress/theme/components/Atoms/CatRecapDiagram.vue'
</script>

> [!info]
> This article was auto-translated using ChatGPT.

I recently got an Aqara camera and originally planned to use its built-in pet detection feature, but the subscription was too expensive. Later, I discovered that the camera could stream video over RTSP on the local network, which got me wondering whether I could build my own pet detection system.

<!-- more -->

Looking at the devices I already had at home, I realized that my Raspberry Pi 4B, which runs 24/7, would be a good fit for analyzing the camera's video stream. The overall idea was to pull the RTSP stream on the Pi, use YOLOv8 to detect pet activity, and send the results to my instant messaging app.

My initial implementation passed entire video frames directly to YOLO, but this turned out to be inefficient. Every frame was analyzed, and detections could trigger notifications even when the scene was static. That wasted resources on the Pi, especially since it also runs other services. So I switched to a different approach: first use OpenCV for motion detection, then crop the regions where movement is detected and pass only those regions to YOLO. This reduces the number of YOLO inference calls, saves resources, and still delivers good detection results. The size of the moving regions can also help distinguish people from pets and reduce false detections.

Here is the final workflow:

<CatRecapDiagram />

Notifications currently support only Telegram (TG) and QQ. If I need more options in the future, I can integrate [ServerChan](https://sct.ftqq.com/) to support additional notification channels.

This setup has been running at home for over a month now. Detection accuracy has been pretty good, with relatively few false positives. It meets my needs and saves me RMB 50 per month in subscription fees.

The project is open source: [catRecap](https://github.com/Fatpandac/catRecap).
