import { google } from 'googleapis';

import { Converter } from './converter.js';
import { Log } from './log.js';

// initialize the Youtube API library
const youtube = google.youtube('v3');

class YTFacade {

    static async Auth() {
        const auth = new google.auth.GoogleAuth({
            keyFile: 'auth/ytlinksearcher-robot.json',
            //keyFile: 'auth/ytlinksearcher2-robot.json',
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
            order: 'relevance',
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
        
        if (!searchResults) {
            return null;
        }
        
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
                            durationSeconds: Converter.convertISO8601ToSeconds(current.contentDetails.duration),
                            views: current.statistics.viewCount,
                            likes: current.statistics.likeCount,
                            first: index === 0,
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

        let lengthLowerThreshold = 120;
        let lengthUpperThreshold = 480;

        let finalRank = detailInfo.rank;

        // overranks licensed videos 
        if (detailInfo.licensed === true && 
            detailInfo.durationSeconds >= lengthLowerThreshold && 
            detailInfo.durationSeconds <= lengthUpperThreshold && 
            detailInfo.views >= 100000) {
            finalRank += 5;
        }
        
        // ranks videos over threshold and underanks short videos
        if (detailInfo.durationSeconds >= lengthLowerThreshold && 
            detailInfo.durationSeconds <= lengthUpperThreshold) {
            finalRank += 1;
        } else {
            finalRank -= 5;
        }

        // ransks first video
        if (detailInfo.first) {
            finalRank += 1;
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
        if (detailInfo.title.search(new RegExp(searchInfo.music, "i")) != -1 || 
            detailInfo.title.search(new RegExp(searchInfo.artist, "i")) != -1) {
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

        // down-ranks videos with SHORT on title / description
        if (detailInfo.title.search(new RegExp("COVER", "i")) != -1) {
            finalRank -= 5;
        }

        return finalRank;
    }
}

export { YTFacade };