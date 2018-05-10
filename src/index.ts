#!/usr/bin/env node

import * as LibFs from 'mz/fs';
import * as LibOs from 'os';
import * as LibPath from 'path';
import * as LibUtil from 'util';

import * as program from 'commander';
import * as removeValue from 'remove-value';
import * as rimraf from 'rimraf';
import * as mkdir from 'mkdirp';

const rimrafp = LibUtil.promisify(rimraf) as (path: string, options?: rimraf.Options) => void;
const mkdirp = LibUtil.promisify(mkdir) as (path: string) => void;

const pkg = require('../package.json');

const MONEYWIZ_DIR = LibPath.join(LibOs.homedir(), '/Library/Containers/com.moneywiz.mac/Data/MoneyWizBackups');

const BACKUP_LIMIT = 5;
const BACKUP_DIR_NAME = 'MoneyWiz2Backup';

program.version(pkg.version)
    .description('MoneyWiz backup application, supports only MacOS & MoneyWiz2')
    .option('-d, --dest <dir>', 'directory of backup destination')
    .option('-n, --dir_name <string>', `directory name of backup files: $dest/$name/backup_files, default is "${BACKUP_DIR_NAME}"`)
    .option('-m, --max_backups <number>', `max history backups remained, default is ${BACKUP_LIMIT}`)
    .parse(process.argv);

const BACKUP_DEST = (program as any).dest === undefined ? undefined : (program as any).dest;
const BACKUP_NAME = (program as any).dir_name === undefined ? BACKUP_DIR_NAME : (program as any).dir_name;
const BACKUP_MAX_COUNT = (program as any).max_backups === undefined ? BACKUP_LIMIT : parseInt((program as any).max_backups);

class MoneyWizBackup {

    public async run() {
        console.log('Backup starting ...');

        await this._validate();
        await this._backup();
    }

    private async _validate() {
        console.log('Backup validating ...');

        if (!BACKUP_DEST) {
            console.log('No destination specified!');
            process.exit(1);
        }
        if (!(await LibFs.stat(BACKUP_DEST)).isDirectory()) {
            console.log('Destination is not a directory!');
            process.exit(1);
        }
        if (LibOs.platform() !== 'darwin') {
            console.log('Only MacOS supported!');
            process.exit(1);
        }
        if (!(await LibFs.stat(MONEYWIZ_DIR)).isDirectory()) {
            console.log(`No MoneyWiz2 data found, files shall be: ${MONEYWIZ_DIR}`);
            process.exit(1);
        }
    }

    private async _backup() {
        await this._prepareBackupDest();
        await this._backupFiles();
    }

    private async _prepareBackupDest() {
        console.log('Preparing backup destination ...');

        const backupDest = LibPath.join(BACKUP_DEST, BACKUP_NAME);


        if (!(await LibFs.exists(backupDest))) {
            await mkdirp(backupDest);
        }

        console.log(`Backup destination generated: ${backupDest}`);
    }

    private async _backupFiles() {
        console.log('Backup files ...');

        const sourceBackups = removeValue(await LibFs.readdir(MONEYWIZ_DIR), '.DS_Store');

        for (let sourceFile of sourceBackups) {
            await LibFs.copyFile(LibPath.join(MONEYWIZ_DIR, sourceFile), LibPath.join(BACKUP_DEST, BACKUP_NAME, sourceFile));
        }
        console.log('Copying files done ...');

        // delete backups exceeded limit
        const existingBackups = removeValue(await LibFs.readdir(LibPath.join(BACKUP_DEST, BACKUP_NAME)), '.DS_Store');

        let deleteTargets = [];
        if (existingBackups.length >= BACKUP_MAX_COUNT) {
            const delta = existingBackups.length - BACKUP_MAX_COUNT;
            deleteTargets = existingBackups.slice(0, delta); // remove old backups
        }

        for (let deleteTarget of deleteTargets) {
            const deleteTargetFullPath = LibPath.join(BACKUP_DEST, BACKUP_NAME, deleteTarget);
            await rimrafp(deleteTargetFullPath);
            console.log(`Old backup deleted: ${deleteTargetFullPath}`);
        }
    }

}

new MoneyWizBackup().run().then(_ => _).catch(_ => console.log(_));

process.on('uncaughtException', (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});

process.on('unhandledRejection', (error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
});