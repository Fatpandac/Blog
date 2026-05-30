---
title: 将树莓派系统从 SSD 迁移到 TF
date: 2026-03-27
tags:
  - Raspberry Pi
categories:
  - 技文
---

最近因为 SSD 的价格上涨我不太想再购买一个新的 SSD，刚好树莓派上面有一个 1T 的 SSD 可以使用，所以打算把系统从 SSD 迁移到 TF 把腾出来的 SSD 给我的 PC 使用，于是就有了这个迁移的文档。

<!-- more -->

在迁移之前可以先查看一下自己的 SSD 已经使用的大小，我这里通过 `lsblk` 查看到使用的空间仅有 35GB 也就是我 64GB 的 TF 卡完全可以承载。

之后就可以开始迁移了，首先要把挂在的硬盘通过 `sudo umount <挂载硬盘的地址>` 如果在运行的过程遇到提示 `is busy` 说明当前这个硬盘正在被使用可以通过 `lsof +D <硬盘地址>` 来查看是哪一个进程正在使用这个硬盘，之后通过停止这个应用或者使用 `kill` 命令粗暴关闭即可。所有硬盘都卸载之后就可以开始迁移的工作了。

首先要将 TF 卡进行分区，通过 `lsblk` 命令查看插入的 TF 卡地址（这里假设地址是 `/dev/mmcblk0`），之后使用 `sudo fdisk /dev/mmcblk0` 命令对这个 TF 卡进行分区，这里要分成两个区一个给 boot 另一个给 root，boot 建议的大小在 512MB 其余的空间都留给 root，这样分区之后你就会得到两个地址 `/dev/mmcblk0p1` 和 `/dev/mmcblk0p2`，之后就可以分别运行下面命令对分区进行格式化。

```bash
sudo mkfs.vfat /dev/mmcblk0p1
sudo mkfs.ext4 /dev/mmcblk0p2
```

格式化结束后再运行下面命令挂载分区：

```bash
sudo mkdir /mnt/tfboot
sudo mkdir /mnt/tfroot

sudo mount /dev/mmcblk0p1 /mnt/tfboot
sudo mount /dev/mmcblk0p2 /mnt/tfroot
```

完成挂载之后就可以开始迁移 SSD 盘的数据了，这里使用 `rsync` 来复制数据因为这样复制的只是使用了的数据，不会像 `dd` 一样按照 SSD 实际空间大小复制。

首先复制 boot 的内容使用命令如下：

```bash
sudo rsync -axHAWXS --numeric-ids --info=progress2 \
/ /mnt/tfroot \
--exclude={"/dev/*","/proc/*","/sys/*","/tmp/*","/run/*","/mnt/*","/media/*","/lost+found"}
```

之后再使用下面命令复制 root 的内容：

```bash
sudo rsync -ax /boot/ /mnt/tfboot/
```

紧接着修改配置，把原有的启动盘地址进行修改，使用 `sudo blkid` 记录 `/dev/mmcblk0p2` 的 UUID 和 PARTUUID，然后修改 `/mnt/tfboot/cmdline.txt` 文件里面的 UUID 和 PARTUUID 紧接着修改 `/mnt/tfroot/etc/fstab` 确保类似下面：

```
UUID=xxxx  /      ext4  defaults,noatime  0 1
UUID=xxxx  /boot  vfat  defaults          0 2
```

最后使用 `sudo poweroff` 关闭机子，去除 SSD 然后开机，系统将使用 TF 卡来启动，启动成功系统完成迁移！！！
