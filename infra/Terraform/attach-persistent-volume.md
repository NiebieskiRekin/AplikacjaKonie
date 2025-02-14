docs: <https://cloud.google.com/compute/docs/disks/format-mount-disk-linux#gcloud>

# Location

`/dev/disk/by-id/google-persistent-disk-1`
or
`/dev/disk/by-id/$(terraform output postgres_disk_device_name)`

# Format

```bash
sudo mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard /dev/disk/by-id/google-persistent-disk-1
```

# Mount

```bash
sudo mkdir -p /mnt/disks/pg_data
sudo mount -o discard,defaults /dev/disk/by-id/google-persistent-disk-1 /mnt/disks/pg_data
sudo chmod a+rw /mnt/disks/pg_data
```

# configure FStab

```bash
sudo blkid /dev/disk/by-id/google-persistent-disk-1
```

> `/dev/disk/by-id/google-persistent-disk-1: UUID="efd59af0-5e91-4976-9dfb-1274b1de9533" BLOCK_SIZE="4096" TYPE="ext4"`

Open the /etc/fstab file in a text editor and create an entry that includes the UUID. For example:

```
UUID=efd59af0-5e91-4976-9dfb-1274b1de9533 /mnt/disks/pg_data ext4 discard,defaults,nofail 0 2
```

# Setup database

Create a data directory

```bash
mkdir -p /mnt/disks/pg_data/data
```

Set permissions

```bash
docker_UID=$(docker compose exec -it postgres id -g postgres) # 70
docker_GID=$(docker compose exec -it postgres id -g postgres) # 70
sudo chown 70:70 -R /mnt/disks/pg_data/data
```
