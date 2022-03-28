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

                let chosenViews = videoDetails[0];
                let chosenViewsID = videoDetails[0].id;

                // sort videos by its rank and then by view count
                videoDetails.sort((first, second) => {
                    if (first.rank === second.rank) {
                        return second.views - first.views;
                    }
                    return second.rank - first.rank;
                })

                let chosenRank = videoDetails[0];
                let chosenRankID = videoDetails[0].id;
                
                Log.debugVideoDetails(videoDetails, [chosenViewsID, chosenRankID]);

                Log.info(`chosed rank video: [ id: ${chosenRank.id}, duration: ${chosenRank.durationSeconds}, views: ${chosenRank.views}, licensed: ${chosenRank.licensed}, rank: ${chosenRank.rank} ]`);
                Log.info(`chosed view video: [ id: ${chosenViews.id}, duration: ${chosenViews.durationSeconds}, views: ${chosenViews.views}, licensed: ${chosenViews.licensed}, rank: ${chosenViews.rank} ]`);

                row.getCell(Database.COLUMN_RANK_LINK_INDEX).value = `https://www.youtube.com/watch?v=${chosenRank.id}`;
                row.getCell(Database.COLUMN_RANK_DURATION_INDEX).value = chosenRank.duration;
                row.getCell(Database.COLUMN_RANK_VIEWS_INDEX).value = chosenRank.views;

                row.getCell(Database.COLUMN_FIRST_LINK_INDEX).value = `https://www.youtube.com/watch?v=${chosenViews.id}`;
                row.getCell(Database.COLUMN_FIRST_DURATION_INDEX).value = chosenViews.duration;
                row.getCell(Database.COLUMN_FIRST_VIEWS_INDEX).value = chosenViews.views;
            }
        }
    }

    database.saveWorksheet();

    Log.info('done...');
}

