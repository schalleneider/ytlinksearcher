import { google } from 'googleapis';

import { Helper } from './helper.js';
import { Log } from './log.js';

// initialize the Youtube API library
const youtube = google.youtube('v3');

class YTFacade {

    static async Auth() {
        const auth = new google.auth.GoogleAuth({
            keyFile: 'auth/ytlinksearcher-robot.json',
            scopes: [
                'https://www.googleapis.com/auth/cloud-platform',
                'https://www.googleapis.com/auth/youtube'
            ],
        });
    
        google.options({auth});
    }

    static async Search(searchInfo) {
        Log.info(`searching youtube for: [${searchInfo.id} : ${searchInfo.music} ${searchInfo.artist}]`);
    
        const searchListParams = {
            part: 'id,snippet',
            order: 'viewCount',
            type: 'video',
            q: searchInfo.music + ' ' + searchInfo.artist,
        };
    
        return youtube.search.list(searchListParams)
            .then((response) => {
                if (response.status === 200) {
    
                    let searchResults = [];
                    let items = [...response.data.items];
                    
                    for (let index = 0; index < items.length; index++) {
                
                        const current = items[index];
                
                        let resultInfo = {
                            videoId: current.id.videoId,
                            title: current.snippet.title,
                            description: current.snippet.description
                        };
            
                        searchResults.push(resultInfo);
                        
                        //Log.debug(JSON.stringify(resultInfo));
                    }
            
                    return searchResults;
                }
            })
            .catch((error) => {
                Log.error(`error while searching video information for: [${searchInfo.id} : ${searchInfo.music} ${searchInfo.artist}]`);
                Log.fatal(error);
            });
    }
    
    static async VideoDetails(searchInfo, searchResults) {
        Log.info(`listing video details for: [${searchInfo.id} : ${searchInfo.music} ${searchInfo.artist}]`);
    
        let videoIdList = [];
    
        for (let index = 0; index < searchResults.length; index++) {
            videoIdList.push(searchResults[index].videoId);
        }
    
        const videosListParams = {
            part: [
                'contentDetails',
                'statistics'
            ],
            id: videoIdList
        };
    
        return youtube.videos.list(videosListParams)
            .then((response) => {
                if (response.status === 200) {
                    
                    let videoDetails = [];
                    let items = [...response.data.items];
                    
                    for (let index = 0; index < items.length; index++) {
                
                        const current = items[index];
                
                        let currentSearchInfo = searchResults.find((item) => item.videoId === current.id);
                        
                        let detailInfo = {
                            id: current.id,
                            title: currentSearchInfo.title,
                            description: currentSearchInfo.description,
                            licensed: current.contentDetails.licensedContent,
                            duration: current.contentDetails.duration,
                            durationSeconds: Helper.convertISO8601ToSeconds(current.contentDetails.duration),
                            views: current.statistics.viewCount,
                            likes: current.statistics.likeCount,
                            rank: 0
                        };

                        detailInfo.rank = this.Rank(searchInfo, detailInfo);
            
                        videoDetails.push(detailInfo);

                        //Log.debug(JSON.stringify(detailInfo));
                    }
            
                    return videoDetails;
                }
            })
            .catch((error) => {
                Log.error(`error while searching video information for: [${searchInfo.id} : ${searchInfo.music} ${searchInfo.artist}]`);
                Log.fatal(error);
            });
    }

    static Rank(searchInfo, detailInfo) {

        let finalRank = detailInfo.rank;

        // overranks licensed videos
        if (detailInfo.licensed === true) {
            finalRank += 5;
        }
        
        // ranks videos over 100 seconds and underanks short videos
        if (detailInfo.durationSeconds >= 100) {
            finalRank += 1;
        } else {
            finalRank -= 5;
        }

        // ranks videos over 100K views
        if (detailInfo.views >= 100000) {
            finalRank += 1;
        }

        // ranks videos over 1K likes
        if (detailInfo.likes >= 1000) {
            finalRank += 1;
        }

        // ranks videos with artist / music on title or 
        if (detailInfo.title.search(new RegExp(searchInfo.music, "i")) != -1 || detailInfo.title.search(new RegExp(searchInfo.artist, "i")) != -1) {
            finalRank += 1;
        }
        
        // ranks videos with artist on title
        if (detailInfo.title.search(new RegExp(searchInfo.artist, "i")) != -1) {
            finalRank += 1;
        }

        // down-ranks videos with TV on title / description
        if (detailInfo.title.search(new RegExp("TV", "i")) != -1) {
            finalRank -= 1;
        }
        
        // down-ranks videos with SHORT on title / description
        if (detailInfo.title.search(new RegExp("SHORT", "i")) != -1) {
            finalRank -= 1;
        }

        return finalRank;
    }
}

export { YTFacade };