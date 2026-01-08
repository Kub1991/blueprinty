/**
 * Supadata Transcript Service
 * Handles fetching YouTube video transcripts via Supadata API
 */

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;

export interface TranscriptResult {
    transcript: string;
    isPartial: boolean;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractVideoId(youtubeUrl: string): string {
    try {
        const urlObj = new URL(youtubeUrl);
        return urlObj.searchParams.get("v") || youtubeUrl.split("/").pop() || "";
    } catch {
        return youtubeUrl.split("/").pop() || "";
    }
}

/**
 * Fetch transcript from Supadata API with timestamp formatting
 */
export async function fetchTranscript(videoId: string, lang: string = "pl"): Promise<TranscriptResult> {
    if (!SUPADATA_API_KEY) {
        throw new Error("Missing SUPADATA_API_KEY");
    }

    const response = await fetch(
        `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=${lang}`,
        { headers: { "x-api-key": SUPADATA_API_KEY } }
    );

    console.log(`[TranscriptService] Supadata status: ${response.status}`);

    if (!response.ok && response.status !== 206) {
        const errorText = await response.text();
        console.error("[TranscriptService] Supadata error:", errorText);
        throw new Error(`Supadata error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error === "transcript-unavailable" || data.message === "Transcript Unavailable") {
        throw new Error("Transkrypcja video niedostępna na YouTube (brak napisów).");
    }

    // Parse segments to include timestamps
    let segments: any[] = [];
    if (Array.isArray(data.content)) segments = data.content;
    else if (Array.isArray(data.segments)) segments = data.segments;
    else if (Array.isArray(data.transcript)) segments = data.transcript;

    let transcript = "";

    if (segments.length > 0) {
        console.log("[TranscriptService] First segment sample:", JSON.stringify(segments[0]));
        transcript = segments.map((seg: any) => {
            // Try multiple common field names for start time
            let start = seg.start ?? seg.startTime ?? seg.start_time ?? seg.offset ?? seg.s ?? 0;

            // Heuristic: if start is very large (e.g. > 10000), it's likely milliseconds.
            if (start > 10000) {
                start = start / 1000;
            }

            return `[${Math.floor(Number(start))}] ${seg.text || seg.content || seg.c || ""}`;
        }).join("\n");
    } else {
        transcript = data.content || data.transcript || data.text || "";
    }

    if (!transcript) {
        throw new Error("No transcript found for this video.");
    }

    const isPartial = response.status === 206;
    if (isPartial) {
        console.warn("[TranscriptService] Supadata returned partial content (206). Transcript might be truncated.");
    }

    console.log(`[TranscriptService] Transcript found, length: ${transcript.length}`);

    return { transcript, isPartial };
}
