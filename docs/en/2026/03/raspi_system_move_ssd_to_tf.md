---
title: Migrating Raspberry Pi System from SSD to TF Card
date: 2026-03-27
tags:
  - Raspberry Pi
categories:
  - Tech
---

> [!info]
> This article was auto-translated using ChatGPT.

Recently, due to the rising price of SSDs, I didn’t want to buy a new one. Since I already had a 1TB SSD on my Raspberry Pi, I decided to migrate the system from the SSD to a TF card so I could free up the SSD for my PC. That’s how this migration guide came about.

<!-- more -->

Before starting the migration, you can first check how much space is currently used on your SSD. I used `lsblk` and found that only 35GB was in use, meaning my 64GB TF card is more than sufficient.

Next, you can begin the migration. First, unmount the mounted disk using `sudo umount <mount point>`. If you encounter a message like `is busy`, it means the disk is currently in use. You can run `lsof +D <disk path>` to see which process is using it, then stop that process or forcefully terminate it with the `kill` command. Once all disks are unmounted, you can proceed with the migration.

First, partition the TF card. Use `lsblk` to identify the TF card device (assume it is `/dev/mmcblk0`), then run `sudo fdisk /dev/mmcblk0` to partition it. Create two partitions: one for boot and one for root. The boot partition is recommended to be 512MB, and the remaining space should be allocated to root. After partitioning, you will have `/dev/mmcblk0p1` and `/dev/mmcblk0p2`. Then format them with the following commands:

```bash
sudo mkfs.vfat /dev/mmcblk0p1
sudo mkfs.ext4 /dev/mmcblk0p2
```

After formatting, mount the partitions:

```bash
sudo mkdir /mnt/tfboot
sudo mkdir /mnt/tfroot

sudo mount /dev/mmcblk0p1 /mnt/tfboot
sudo mount /dev/mmcblk0p2 /mnt/tfroot
```

Once mounted, you can start copying data from the SSD. Here we use `rsync` because it only copies used data, unlike `dd`, which copies the entire disk size.

First, copy the boot contents using:

```bash
sudo rsync -axHAWXS --numeric-ids --info=progress2 \
/ /mnt/tfroot \
--exclude={"/dev/*","/proc/*","/sys/*","/tmp/*","/run/*","/mnt/*","/media/*","/lost+found"}
```

Then copy the root contents:

```bash
sudo rsync -ax /boot/ /mnt/tfboot/
```

Next, update the configuration. Use `sudo blkid` to get the UUID and PARTUUID of `/dev/mmcblk0p2`. Then edit `/mnt/tfboot/cmdline.txt` to update the UUID and PARTUUID accordingly. After that, modify `/mnt/tfroot/etc/fstab` to look like this:

```
UUID=xxxx  /      ext4  defaults,noatime  0 1
UUID=xxxx  /boot  vfat  defaults          0 2
```

Finally, shut down the system with `sudo poweroff`, remove the SSD, and power it back on. The system will now boot from the TF card, and the migration is complete!
