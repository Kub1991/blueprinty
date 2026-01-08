/**
 * YouTube API Service
 * Handles all YouTube Data API v3 interactions
 */

const YT_API_KEY = process.env.YOUTUBE_API_KEY;

export interface ChannelInfo {
    channelId: string;
    uploadsPlaylistId: string;
}

export interface VideoItem {
    videoId: string;
    title: string;
    thumbnailUrl: string;
    duration: string;
    publishedAt: string;
}

export interface PlaylistFetchResult {
    videos: VideoItem[];
    nextPageToken?: string;
}

/**
 * Fetch channel details by ID to get the uploads playlist
 */
export async function fetchChannelDetails(channelId: string): Promise<string | null> {
    if (!YT_API_KEY) throw new Error("Missing YOUTUBE_API_KEY");

    const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,id&id=${channelId}&key=${YT_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

/**
 * Resolve a YouTube handle to a channel ID and uploads playlist
 */
export async function resolveChannelHandle(handle: string): Promise<ChannelInfo | null> {
    if (!YT_API_KEY) throw new Error("Missing YOUTUBE_API_KEY");

    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

    // Try direct forHandle lookup first
    const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails&forHandle=${encodeURIComponent(cleanHandle)}&key=${YT_API_KEY}`;
    const handleRes = await fetch(handleUrl);
    const handleData = await handleRes.json();

    if (handleData.items && handleData.items.length > 0) {
        return {
            channelId: handleData.items[0].id,
            uploadsPlaylistId: handleData.items[0].contentDetails.relatedPlaylists.uploads,
        };
    }

    // Fallback to search
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&key=${YT_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.items && searchData.items.length > 0) {
        const channelId = searchData.items[0].id.channelId;
        const uploadsPlaylistId = await fetchChannelDetails(channelId);
        if (uploadsPlaylistId) {
            return { channelId, uploadsPlaylistId };
        }
    }

    return null;
}

/**
 * Fetch videos from an uploads playlist with pagination support
 */
export async function fetchPlaylistVideos(
    uploadsPlaylistId: string,
    pageToken?: string,
    maxResults: number = 15
): Promise<PlaylistFetchResult> {
    if (!YT_API_KEY) throw new Error("Missing YOUTUBE_API_KEY");

    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${YT_API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const playlistRes = await fetch(playlistUrl);
    const playlistData = await playlistRes.json();

    if (!playlistData.items) {
        throw new Error("Failed to fetch playlist items from YouTube API");
    }

    // Fetch durations for filtering
    const videoIds = playlistData.items.map((v: any) => v.contentDetails.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YT_API_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    const durationMap: Record<string, string> = {};
    const validVideoIds = new Set<string>();

    detailsData.items?.forEach((item: any) => {
        const duration = item.contentDetails.duration;
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

        let totalSeconds = 0;
        if (match) {
            totalSeconds += (parseInt(match[1] || '0') * 3600);
            totalSeconds += (parseInt(match[2] || '0') * 60);
            totalSeconds += (parseInt(match[3] || '0'));

            const h = match[1] ? `${match[1]}:` : '';
            const m = match[2] ? match[2].padStart(2, '0') : '00';
            const s = match[3] ? match[3].padStart(2, '0') : '00';
            durationMap[item.id] = `${h}${m}:${s}`;
        }

        // Exclude videos <= 60 seconds (Shorts)
        if (totalSeconds > 60) {
            validVideoIds.add(item.id);
        } else {
            console.log(`[YoutubeService] Filtered out Short: ${item.id} (${totalSeconds}s)`);
        }
    });

    const videos: VideoItem[] = [];
    for (const item of playlistData.items) {
        const videoId = item.contentDetails.videoId;
        if (validVideoIds.has(videoId)) {
            videos.push({
                videoId,
                title: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                duration: durationMap[videoId] || "0:00",
                publishedAt: item.snippet.publishedAt,
            });
        }
    }

    return {
        videos,
        nextPageToken: playlistData.nextPageToken,
    };
}
