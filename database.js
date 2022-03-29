import path from 'path';
import exceljs from 'exceljs';
import moment from 'moment';

import { Log } from './log.js';

class Database {

    static COLUMN_ID_INDEX = 1;
    static COLUMN_MUSIC_INDEX = 2;
    static COLUMN_ARTIST_INDEX = 3;
    static COLUMN_ANIME_INDEX = 4;

    static COLUMN_RANK_LINK_INDEX = 6;
    static COLUMN_RANK_DURATION_INDEX = 7;
    static COLUMN_RANK_VIEWS_INDEX = 8;

    static COLUMN_FIRST_LINK_INDEX = 9;
    static COLUMN_FIRST_DURATION_INDEX = 10;
    static COLUMN_FIRST_VIEWS_INDEX = 11;

    constructor(path) {
        this.path = path;
        this.workbook = new exceljs.Workbook();
    }

    isHeaderRow(rowNumber) {
        return rowNumber === 1;
    }

    async loadWorksheet() {
        Log.info(`loading database: [${this.path}]`);

        await this.workbook.xlsx.readFile(this.path);
    
        this.worksheet = this.workbook.worksheets[0];
    }
    
    async saveWorksheet() {
        let datepart = moment(new Date()).format('YYYYMMDD_HHmmss');
        let destinationPath = `${path.dirname(this.path)}${path.sep}${path.basename(this.path, path.extname(this.path))}_${datepart}${path.extname(this.path)}`;
        Log.info(`saving database: [${destinationPath}]`);
        await this.workbook.xlsx.writeFile(destinationPath);
    }
}

export { Database };