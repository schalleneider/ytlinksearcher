import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Log } from './log.js';
import { Database } from './database.js';
import { YTFacade } from './ytfacade.js';

// initialize the yargs parameters
const argv = yargs(hideBin(process.argv)).argv;

main();

async function main() {

    YTFacade.Auth();

    const databasePath = path.resolve(argv.database);

    let database = new Database(databasePath);

    await database.loadWorksheet();

    for (let rowNumber = 1; rowNumber < database.worksheet.rowCount + 1; rowNumber++) {
        
        const row = database.worksheet.getRow(rowNumber);
        
        // skip header row
        if (!database.isHeaderRow(rowNumber)) {

            let searchInfo = {
                id: row.getCell(Database.COLUMN_ID_INDEX).value,
                music: row.getCell(Database.COLUMN_MUSIC_INDEX).value,
                artist: row.getCell(Database.COLUMN_ARTIST_INDEX).value,
                anime: row.getCell(Database.COLUMN_ANIME_INDEX).value
            };

            let searchResults = await YTFacade.Search(searchInfo);
            let videoDetails = await YTFacade.VideoDetails(searchInfo, searchResults);

            if (videoDetails) {

                // sort videos by its rank and then by view count
                videoDetails.sort((first, second) => {
                    if (first.rank === second.rank) {
                        return second.views - first.views;
                    }
                    return second.rank - first.rank;
                })

                Log.debugVideoDetails(videoDetails);

                var chosen = videoDetails[0];
                
                Log.info(`chosed video: [ id: ${chosen.id}, duration: ${chosen.durationSeconds}, views: ${chosen.views}, licensed: ${chosen.licensed}, rank: ${chosen.rank} ]`);

                row.getCell(Database.COLUMN_LINK_INDEX).value = `https://www.youtube.com/watch?v=${chosen.id}`;
                row.getCell(Database.COLUMN_DURATION_INDEX).value = chosen.duration;
            }
        }
    }

    database.saveWorksheet();

    Log.info('done...');
}

