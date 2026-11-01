---
title: 通过 YOLO 识别宠物活动推送至 IM
date: 2026-10-30
tags:
  - YOLO
  - AI
  - Raspberry Pi
categories:
  - 技文
---

<script setup>
import CatRecapDiagram from '../../../.vitepress/theme/components/Atoms/CatRecapDiagram.vue'
</script>

最近搞了一个 Aqara 摄像头，本来是打算用商家自带的宠物识别的但是这个订阅服务费用太高了，
后来我看到这个摄像头是可以在局域网通过 RTSP 协议获取视频流的，于是我就想能不能自己做一个宠物识别。

<!-- more -->

看了一下我家里面的设备，我刚好有一个 Raspberry Pi 4B 它 7x24 小时开着刚好可以拿来配合分析这个摄像头的视频流，
于是我的整个识别方案就是，通过树莓派获取摄像头的 RTSP 视频流，然后通过 YOLOv8 来识别宠物的活动，最后把识别结果推送到我的 IM 上。

在最初我的实现是直接把整个视频帧传给 YOLO 来识别，但是发现这样做的识别效率太低了，而且每一帧都要识别画面是静止的也会推送识别，
这样会浪费我树莓派的资源毕竟我在树莓派上跑的不只这一个服务还有其他的，所以我换了另一个方案先通过 OpenCV 来做运动检测，
然后把发现运动的区域裁切出来再传给 YOLO 来识别，这样做的好处是可以减少 YOLO 的识别次数，节省树莓派的资源同时也可以得到很好的识别效果，
这样做还可以通过移动物体的面积大小来区分是人还是宠物，避免误识别。

最终我得到的整体流程如下：

<CatRecapDiagram />

推送方面目前只支持 TG 和 QQ，如果后面有需求可以通过接入 [Server酱](https://sct.ftqq.com/) 来实现更多的推送方式。

目前这套方案已经在我家里运行了一个多月了，识别准确率还不错，误报率也不高，基本上可以满足我的需求也帮我节省了每个月 50 元的订阅费用。

开源地址在 [catRecap](https://github.com/Fatpandac/catRecap)
