---
title: Building a Raspberry Pi Monitoring Dashboard with below and Grafana
date: 2025-12-30
tags:
  - Grafana
  - below
  - Raspberry Pi
categories:
  - Tech
---

> [!info]
> This article was auto-translated using ChatGPT.

A while ago, I came across an article on Hacker News introducing a tool called [below](https://github.com/facebookincubator/below), an open-source Linux system monitoring tool by Facebook. It features powerful functionalities, allowing users to view system resource usage over time via a TUI, and also export those data. For more details, check out [below's introduction article](https://developers.facebook.com/blog/post/2021/09/21/below-time-travelling-resource-monitoring-tool/). So, I decided to deploy below on my Raspberry Pi and export its data to build a monitoring dashboard with Grafana.

<!-- more -->

To install below, refer to the [official tutorial](https://github.com/facebookincubator/below#quickstart). Once installed, run the following commands to keep below running in the background to collect data:

```bash
sudo cp etc/below.service /etc/systemd/system
sudo systemctl daemon-reload
sudo systemctl start below
```

Now the data collection has started. You can use the `below dump` command to export data in your desired format, such as CSV, JSON, etc. The following command exports system information data in CSV format:

```bash
below dump system -d --begin 1m --raw -O csv
```

With this command, you can obtain the data you need. The next step is to store the data and integrate it with Grafana. The recommended data source for Grafana is InfluxDB, so you'll need to install InfluxDB and create a database to store the data exported by below. You can refer to the [official documentation](https://docs.influxdata.com/influxdb3/core/install/#install) for installing InfluxDB. Here, I choose to use Docker for installing InfluxDB, as it makes management easier:

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

Once the Docker container is running, you can access InfluxDB's web interface via `http://<Raspberry_Pi_IP>:8086` to complete the initial setup. The password corresponds to the value of `DOCKER_INFLUXDB_INIT_PASSWORD` and the username corresponds to `DOCKER_INFLUXDB_INIT_USERNAME`.

Next, you need to write a tool to upload the data exported by below into InfluxDB. Here, I use Python and the `influxdb-client` library to interact with InfluxDB. Below is a simple example code (some unimportant parts are omitted):

```python
class Uploader:
    token: str
    bucket: str
    org: str
    url: str
    interval: int
    write_api: WriteApi

    def __init__(self):
        # Read environment variable configuration
        write_client = InfluxDBClient(url=self.url, token=self.token, org=self.org)
        self.write_api = write_client.write_api(write_options=SYNCHRONOUS)

    # Convert CSV data to InfluxDB Line Protocol
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

    # Upload data to InfluxDB
    def upload_lines(self, lines: list[str]):
        resp = self.write_api.write(
            bucket=self.bucket, org=self.org, record="\n".join(lines)
        )
        measurement = lines[0].split(",")[0] if lines else "unknown"
        if resp is None:
            print(f"Uploaded {measurement} {len(lines)} lines to InfluxDB")
```

You can then derive subclasses of the `Uploader` class to handle different types of below data, such as system info, network info, etc. Finally, use a loop to periodically execute below to export and upload data to InfluxDB.

The full code is available in my open-source project on GitHub: [belowUploader](https://github.com/fatpandac/belowUploader).

Once the data is stored in InfluxDB, you can create a monitoring dashboard with Grafana. Refer to the [official documentation](https://grafana.com/docs/grafana/latest/installation/) to install Grafana. Again, I'm using Docker for installing Grafana:

```bash
docker run -d -p 3000:3000 --name=grafana grafana/grafana
```

After installation, go to `http://<Raspberry_Pi_IP>:3000` to access Grafana’s web interface. The default username and password are both `admin`. Log in and add InfluxDB as a data source, using the same database configuration as before.

Next, you can create a Dashboard to display the monitoring data from the Raspberry Pi. Use InfluxDB's query language to retrieve the data you want and add different panels in Grafana as needed, e.g., for CPU usage, memory usage, network traffic, etc. For example, the query below retrieves CPU usage:

```flux
from(bucket: "below-bucket")
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "system_stats")
  |> filter(fn: (r) => r["Hostname"] == "raspi")
  |> filter(fn: (r) => r["_field"] == "Usage")
  |> last()
```

Here’s a simple example Dashboard:
![Grafana Dashboard Example](/images/grafana_below_dashboard.png)

The corresponding configuration file for this dashboard can be found in my GitHub repo: [grafana_dashboard.json](https://github.com/Fatpandac/BelowUploader/blob/main/assets/grafana_dashboard.json)

By following these steps, you can successfully store below data in InfluxDB and use Grafana to build a monitoring dashboard. This allows you to monitor various system resource usages on your Raspberry Pi in real-time, making maintenance and management easier.
