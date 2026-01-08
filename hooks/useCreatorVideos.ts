import { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { YouTubeVideo } from '../components/Creator/YouTubeVideoCard';

/**
 * Custom hook for managing Creator Dashboard video operations
 * Encapsulates all video-related state and actions
 */
export function useCreatorVideos() {
    const [channelUrl, setChannelUrl] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<Id<"users"> | null>(null);

    // Convex Hooks
    const videos = useQuery(api.videos.listByUser, currentUserId ? { userId: currentUserId } : "skip") as YouTubeVideo[] | undefined;
    const createUser = useMutation(api.users.create);
    const disconnectChannel = useMutation(api.users.disconnectYouTubeChannel);
    const clearVideos = useMutation(api.videos.clearUserVideos);
    const deleteBlueprint = useMutation(api.blueprints.remove);

    const myBlueprints = useQuery(api.blueprints.listByUser, currentUserId ? { userId: currentUserId } : "skip");
    const fetchChannelVideosAction = useAction(api.actions.ytProcessor.fetchChannelVideos);
    const processVideoAction = useAction(api.actions.ytProcessor.processVideo);

    // Get current user
    const userData = useQuery(api.users.get, currentUserId ? { userId: currentUserId } : "skip");

    // Initialize user on mount
    useEffect(() => {
        const storedId = localStorage.getItem("blueprinty_user_id");

        if (storedId) {
            setCurrentUserId(storedId as Id<"users">);
        } else {
            createUser({ name: "Felix D.", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" })
                .then(id => {
                    localStorage.setItem("blueprinty_user_id", id);
                    setCurrentUserId(id);
                });
        }
    }, [createUser]);

    // Handle cases where ID exists but document was deleted
    useEffect(() => {
        if (currentUserId && userData === null) {
            console.warn("User ID not found in database, resetting...");
            localStorage.removeItem("blueprinty_user_id");
            setCurrentUserId(null);
        }
    }, [currentUserId, userData]);

    const handleConnect = async (isLoadMore = false) => {
        const handleToUse = isLoadMore
            ? userData?.youtubeChannelHandle
            : (channelUrl || userData?.youtubeChannelHandle);

        if (!currentUserId || !handleToUse) return;

        setIsConnecting(true);

        try {
            const handle = handleToUse.includes('youtube.com/')
                ? `@${handleToUse.split('/').pop()}`
                : (handleToUse.startsWith('@') ? handleToUse : `@${handleToUse}`);

            await fetchChannelVideosAction({
                userId: currentUserId,
                channelHandle: handle,
                loadMore: isLoadMore
            });

        } catch (e) {
            console.error("Failed to fetch videos", e);
            alert("Failed to fetch channel data.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!currentUserId) return;
        if (confirm("Czy na pewno chcesz odłączyć kanał i usunąć zaimportowane filmy? Plany podróży pozostaną nienaruszone.")) {
            try {
                await disconnectChannel({ userId: currentUserId });
                await clearVideos({ userId: currentUserId });
                setChannelUrl('');
            } catch (e) {
                console.error("Failed to disconnect", e);
            }
        }
    };

    const handleDeleteBlueprint = async (id: Id<"blueprints">) => {
        if (confirm("Czy na pewno chcesz usunąć ten plan? Zniknie on również z widoku podróżników.")) {
            try {
                await deleteBlueprint({ blueprintId: id });
            } catch (e) {
                console.error("Failed to delete blueprint", e);
            }
        }
    };

    const handleProcessVideo = async (video: YouTubeVideo, onSuccess: (blueprintId: string) => void) => {
        console.log("Processing video:", video);
        try {
            const result: any = await (processVideoAction as any)({
                videoId: video._id as Id<"videos">,
                youtubeUrl: `https://youtube.com/watch?v=${video.youtubeVideoId}`
            });

            console.log("AI Result:", result);
            if (result.success && result.blueprintId) {
                onSuccess(result.blueprintId);
            }
        } catch (e) {
            console.error("AI Processing failed", e);
            alert("AI Processing failed. Check your API keys and ensure video has transcript.");
        }
    };

    const handleLoadMore = () => handleConnect(true);

    const isConnected = !!userData?.youtubeChannelHandle;
    const hasMore = !!userData?.nextPageToken;

    return {
        // State
        channelUrl,
        setChannelUrl,
        isConnecting,
        currentUserId,
        videos,
        myBlueprints,
        userData,
        isConnected,
        hasMore,
        // Actions
        handleConnect,
        handleDisconnect,
        handleDeleteBlueprint,
        handleProcessVideo,
        handleLoadMore,
    };
}
