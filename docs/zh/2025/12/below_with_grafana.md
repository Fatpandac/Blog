---
title: below 配合 Grafana 打造树莓派监控看板
date: 2025-12-30
tags:
  - Grafana
  - below
  - Raspberry Pi
categories:
  - 技文
---

前段时间在 Hacker News 上看到一篇文章介绍了一个名为 [below](https://github.com/facebookincubator/below) 的工具，它是由 Facebook 开源的一个 Linux 系统监控工具。拥有非常强大的功能可以通过 TUI 的方式查看过去一段时间的系统资源使用情况，还可以将数据导出，更多的内容可以看 [below 的介绍文章](https://developers.facebook.com/blog/post/2021/09/21/below-time-travelling-resource-monitoring-tool/)。 于是我决定将 below 部署到我的树莓派上，并将数据导出通过 Grafana 打造一个树莓派的监控看板。

<!-- more -->

安装 below，可以查看[官方的教程](https://github.com/facebookincubator/below#quickstart)。安装完成之后，执行下面的命令保持 below 在后台运行并收集数据：

```bash
sudo cp etc/below.service /etc/systemd/system
sudo systemctl daemon-reload
sudo systemctl start below
```

这样就可以开始收集数据了，然后通过 `below dump` 命令可以将数据导出为想要的格式，比如 CSV、JSON 等等。下面的命令将系统信息数据导出为 CSV 格式：

```bash
below dump system -d --begin 1m --raw -O csv
```

有了这个命令我们就可以拿到想要的数据了，之后就是实现数据如何保存以及和 Grafana 的互动。这里 Grafana 推荐用的数据源是 InfluxDB，所以我们需要先安装 InfluxDB 并创建一个数据库用来存储 below 导出的数据。安装 InfluxDB 可以参考[官方文档](https://docs.influxdata.com/influxdb3/core/install/#install)。这里我选择使用 Docker 来安装 InfluxDB 这样方便管理：

```bash
docker run \
  --name influxdb2 \
  --publish 8086:8086 \
  --mount type=volume,source=influxdb2-data,target=/var/lib/influxdb2 \
  --mount type=volume,source=influxdb2-config,target=/etc/influxdb2 \
  --env DOCKER_INFLUXDB_INIT_MODE=setup \
  --env DOCKER_INFLUXDB_INIT_USERNAME=admin \
  --env DOCKER_INFLUXDB_INIT_PASSWORD=password \
  --env DOCKER_INFLUXDB_INIT_ORG=myOrg \
  --env DOCKER_INFLUXDB_INIT_BUCKET=below-bucket \
  --detach \
  influxdb:2
```

Docker 容器启动之后，我们可以通过 `http://<Raspberry_Pi_IP>:8086` 访问 InfluxDB 的 Web 界面，完成初始设置。 密码对应配置的 `DOCKER_INFLUXDB_INIT_PASSWORD`，帐号对应 `DOCKER_INFLUXDB_INIT_USERNAME`。

接下来我们就需要通过编写一个工具来实现将 below 导出的数据写入到 InfluxDB 中。这里我使用 Python 来实现，并使用 `influxdb-client` 这个库来和 InfluxDB 进行交互。下面是一个简单的示例代码(忽略了一些不重要的代码)：

```python
class Uploader:
    token: str
    bucket: str
    org: str
    url: str
    interval: int
    write_api: WriteApi

    def __init__(self):
        # 读取环境变量配置
        write_client = InfluxDBClient(url=self.url, token=self.token, org=self.org)
        self.write_api = write_client.write_api(write_options=SYNCHRONOUS)

    # 将 CSV 数据转换为 InfluxDB Line Protocol 格式
    def csv_to_line_protocol(
        self,
        raw_csv: str,
        measurement: str,
        tags: list[str],
        fields: list[tuple[str, FieldType]],
    ) -> list[str]:
        reader = csv.DictReader(raw_csv.splitlines())
        lines = []
        for row in reader:
            timestamp = (
                int(row.get("Timestamp") or datetime.now().timestamp()) * 1_000_000_000
            )

            tags_str = []
            for tag in filter(lambda t: t in row, tags):
                tags_str.append(
                    f"{self.format_key(tag)}={self.escape_string_value(row[tag])}"
                )
            field_str = []
            for field in filter(lambda x: x[0] in row, fields):
                (field_name, field_type) = field
                field_str.append(
                    f"{self.format_key(field_name)}={self.format_value(row[field_name], field_type)}"
                )

            line = (
                f"{measurement},{','.join(tags_str)} {','.join(field_str)} {timestamp}"
            )
            lines.append(line)

        return lines

    # 上传数据到 InfluxDB
    def upload_lines(self, lines: list[str]):
        resp = self.write_api.write(
            bucket=self.bucket, org=self.org, record="\n".join(lines)
        )
        measurement = lines[0].split(",")[0] if lines else "unknown"
        if resp is None:
            print(f"Uploaded {measurement} {len(lines)} lines to InfluxDB")
```

之后通过上面的 `Uploader` 类派生出不同的子类来处理不同的 below 数据，比如系统信息、网络信息等等。最后通过一个循环定时执行 below 导出数据并上传到 InfluxDB 即可。

具体的代码可以参考我在 GitHub 上开源的项目：[belowUploader](https://github.com/fatpandac/belowUploader)。

有了数据存储在 InfluxDB 之后，我们就可以使用 Grafana 来创建一个监控看板了。安装 Grafana 可以参考[官方文档](https://grafana.com/docs/grafana/latest/installation/)。这里我同样使用 Docker 来安装 Grafana：

```bash
docker run -d -p 3000:3000 --name=grafana grafana/grafana
```

安装完成之后，通过 `http://<Raspberry_Pi_IP>:3000` 访问 Grafana 的 Web 界面，默认帐号密码都是 `admin`。登录之后添加 InfluxDB 作为数据源，配置和之前创建的数据库信息一致。

接下来就可以创建一个 Dashboard 来展示树莓派的监控数据了。通过 InfluxDB 的查询语言得到想要的数据，然后通过 Grafana 根据需要添加不同的 Panel 来展示 CPU 使用率、内存使用情况、网络流量等等。比如下面的获取 CPU 使用率的查询语句：

```flux
from(bucket: "below-bucket")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "system_stats")
  |> filter(fn: (r) => r["Hostname"] == "raspi")
  |> filter(fn: (r) => r["_field"] == "Usage")
  |> last()
```

下面是一个简单的示例 Dashboard：
![Grafana Dashboard Example](/images/grafana_below_dashboard.png)

这个看板相应的配置文件可以在我的 GitHub 仓库中找到：[grafana_dashboard.json](https://github.com/Fatpandac/BelowUploader/blob/main/assets/grafana_dashboard.json)

通过以上步骤，就可以成功地将 below 数据存储到 InfluxDB 中，并通过 Grafana 打造了一个监控看板。这样我们就可以实时监控树莓派的各项系统资源使用情况，方便进行维护和管理。
