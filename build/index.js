#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const LibFs = require("mz/fs");
const LibOs = require("os");
const LibPath = require("path");
const LibUtil = require("util");
const program = require("commander");
const removeValue = require("remove-value");
const rimraf = require("rimraf");
const mkdir = require("mkdirp");
const rimrafp = LibUtil.promisify(rimraf);
const mkdirp = LibUtil.promisify(mkdir);
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
const BACKUP_DEST = program.dest === undefined ? undefined : program.dest;
const BACKUP_NAME = program.dir_name === undefined ? BACKUP_DIR_NAME : program.dir_name;
const BACKUP_MAX_COUNT = program.max_backups === undefined ? BACKUP_LIMIT : parseInt(program.max_backups);
class MoneyWizBackup {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Backup starting ...');
            yield this._validate();
            yield this._backup();
        });
    }
    _validate() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Backup validating ...');
            if (!BACKUP_DEST) {
                console.log('No destination specified!');
                process.exit(1);
            }
            if (!(yield LibFs.stat(BACKUP_DEST)).isDirectory()) {
                console.log('Destination is not a directory!');
                process.exit(1);
            }
            if (LibOs.platform() !== 'darwin') {
                console.log('Only MacOS supported!');
                process.exit(1);
            }
            if (!(yield LibFs.stat(MONEYWIZ_DIR)).isDirectory()) {
                console.log(`No MoneyWiz2 data found, files shall be: ${MONEYWIZ_DIR}`);
                process.exit(1);
            }
        });
    }
    _backup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._prepareBackupDest();
            yield this._backupFiles();
        });
    }
    _prepareBackupDest() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Preparing backup destination ...');
            const backupDest = LibPath.join(BACKUP_DEST, BACKUP_NAME);
            if (!(yield LibFs.exists(backupDest))) {
                yield mkdirp(backupDest);
            }
            console.log(`Backup destination generated: ${backupDest}`);
        });
    }
    _backupFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Backup files ...');
            const sourceBackups = removeValue(yield LibFs.readdir(MONEYWIZ_DIR), '.DS_Store');
            for (let sourceFile of sourceBackups) {
                yield LibFs.copyFile(LibPath.join(MONEYWIZ_DIR, sourceFile), LibPath.join(BACKUP_DEST, BACKUP_NAME, sourceFile));
            }
            console.log('Copying files done ...');
            // delete backups exceeded limit
            const existingBackups = removeValue(yield LibFs.readdir(LibPath.join(BACKUP_DEST, BACKUP_NAME)), '.DS_Store');
            let deleteTargets = [];
            if (existingBackups.length >= BACKUP_MAX_COUNT) {
                const delta = existingBackups.length - BACKUP_MAX_COUNT;
                deleteTargets = existingBackups.slice(0, delta); // remove old backups
            }
            for (let deleteTarget of deleteTargets) {
                const deleteTargetFullPath = LibPath.join(BACKUP_DEST, BACKUP_NAME, deleteTarget);
                yield rimrafp(deleteTargetFullPath);
                console.log(`Old backup deleted: ${deleteTargetFullPath}`);
            }
        });
    }
}
new MoneyWizBackup().run().then(_ => _).catch(_ => console.log(_));
process.on('uncaughtException', (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});
process.on('unhandledRejection', (error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
});
//# sourceMappingURL=index.js.map