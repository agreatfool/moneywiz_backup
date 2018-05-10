MoneyWiz2 Backup
================

Backup MoneyWiz2 data. Only MacOS & MoneyWiz2 supported.

## Install
```
npm install -g moneywiz_backup
```

## How to use
```
moneywiz-backup -h

  Usage: moneywiz-backup [options]

  MoneyWiz backup application, supports only MacOS & MoneyWiz2

  Options:

    -V, --version               output the version number
    -d, --dest <dir>            directory of backup destination
    -n, --dir_name <string>     directory name of backup files: $dest/$name/backup_files, default is "MoneyWiz2Backup"
    -m, --max_backups <number>  max history backups remained, default is 5
    -h, --help                  output usage information
```

```
# backup to ~/Dropbox, and use default dir name, and keep only 1 backups
moneywiz-backup -d ~/Dropbox -m 1
```

## Actually done
```
Official backups:
/Users/???/Library/Containers/com.moneywiz.mac/Data/MoneyWizBackups/*
=>
/${Dest}/${$BackupName}/*
```