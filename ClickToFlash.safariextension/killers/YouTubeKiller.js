function YouTubeKiller() {	
	this.sourcePatterns = ["youtube.com", "youtube-nocookie.com", "ytimg.com"];
	this.flashVarsPatterns = ["youtube.com", "youtube-nocookie.com", "ytimg.com"];
	this.badgeLabel = "YouTube";
	this.hdBadgeLabel = "YouTube HD";
}

YouTubeKiller.prototype.processElement = function(element, callback) {
	var elementID = element.elementID;
	var flashvars = element.getAttribute("flashvars");
	var videoID = getFlashVariable(flashvars, "video_id");
	var videoHash = getFlashVariable(flashvars, "t");
	var placeholderElement = document.getElementById("ClickToFlashPlaceholder" + elementID);
	
	var availableFormats = [];
	var formatInfo = unescape(getFlashVariable(flashvars, "fmt_url_map")).split("|");
	for (i = 0; i < formatInfo.length-1; i += 2) {
		availableFormats[formatInfo[i]] = formatInfo[1+1];
	}
	if (!availableFormats[18]) {
		// Format 18 (360p h264) tends not to be listed, but it
		// should exist for every video. Just add it manually
		// Hopefully 18 exists for every video, or this throws
		// this whole thing out of whack
		availableFormats[18] = "http://www.youtube.com/get_video?fmt=18&video_id=" + videoID + "&t=" + videoHash;
	}
	
	var videoURL = "http://www.youtube.com/get_video?fmt=18&video_id=" + videoID + "&t=" + videoHash;
	var hdVideoURL = null;
	
	// Get the highest-quality version set by the user
	var format = 18;
	var badgeLabel = "YouTube";
	if (availableFormats[37]) {
		hdVideoURL = "http://www.youtube.com/get_video?fmt=37&video_id=" + videoID + "&t=" + videoHash;
	} else if (availableFormats[22]) {
		hdVideoURL = "http://www.youtube.com/get_video?fmt=22&video_id=" + videoID + "&t=" + videoHash;
	}
	
	callback(this, element, videoURL, hdVideoURL);
}