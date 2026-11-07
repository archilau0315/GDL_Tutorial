#!/bin/sh
# 远端解包：/tmp/gdl_dist.tar.gz -> 站点资源目录
# 目录由调用方通过环境变量 T 传入
set -e
: "${T:?缺少目标目录}"
mkdir -p "$T"
tar -xzf /tmp/gdl_dist.tar.gz -C "$T"
chown -R www:www "$T"
find "$T" -type d -exec chmod 755 {} +
find "$T" -type f -exec chmod 644 {} +
rm -f /tmp/gdl_dist.tar.gz
echo "EXTRACT_OK $T"
