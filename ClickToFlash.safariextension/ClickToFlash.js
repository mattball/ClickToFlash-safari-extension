function ClickToFlash() {
	this.elementMapping = new Array();
	this.videoElementMapping = new Array();
	
	this.settings = null;
	
	var _this = this;	
	this.respondToMessage = function(event) {
		if (event.name == "getSettings") {
			_this.getSettings(event);
		}
	}
	
	this.handleBeforeLoadEventTrampoline = function(event) {
		_this.handleBeforeLoadEvent(event);
	}
	
	this.nodeInsertedTrampoline = function(event) {
		if (event.target.className == "ClickToFlashPlaceholder") {
			alert("Resize");
		}
	}
	
	safari.self.addEventListener("message", this.respondToMessage, false);
	document.addEventListener("beforeload", this.handleBeforeLoadEventTrampoline, true);
	document.addEventListener("DOMNodeInsertedIntoDocument", this.nodeInsertedTrampoline, true);
}

ClickToFlash.prototype.handleBeforeLoadEvent = function(event) {
	const element = event.target;
	
	if (element instanceof HTMLEmbedElement || element instanceof HTMLObjectElement) {
		if (element.allowedToLoad)
			return;
			
		element.elementID = this.elementMapping.length;
		this.settings = safari.self.tab.canLoad(event, "getSettings");
			
		event.preventDefault();
		this.processFlashElement(element);
	}
}

ClickToFlash.prototype.clickPlaceholder = function(event) {
	var clickedElement = event.target;
	
	while (clickedElement.className != "clickToFlashPlaceholder") {
		clickedElement = clickedElement.parentNode;
	}
	
	var elementID = parseInt(clickedElement.id.replace("ClickToFlashPlaceholder", ""));

	var element = this.videoElementMapping[elementID];
	if (!element) {
		element = this.elementMapping[elementID];
		element.allowedToLoad = true;
	}
	
	clickedElement.parentNode.replaceChild(element, clickedElement);
}

ClickToFlash.prototype.getFlashVariable = function(flashVars, key) {
	var vars = flashVars.split("&");
	for (var i=0; i < vars.length; i++) {
		var keyValuePair = vars[i].split("=");
		if (keyValuePair[0] == key) {
			return keyValuePair[1];
		}
	}
	return null;
}

ClickToFlash.prototype.isSIFRText = function(element) {
	return (element.className == "sIFR-flash" || element.getAttribute("sifr"));
}

ClickToFlash.prototype.processYouTubeElement = function(element) {
	if (!this.settings["useH264"]) {
		return;
	}
	
	var elementID = element.elementID;
	var flashvars = element.getAttribute("flashvars");
	var videoID = this.getFlashVariable(flashvars, "video_id");
	var videoHash = this.getFlashVariable(flashvars, "t");
	var placeholderElement = document.getElementById("ClickToFlashPlaceholder" + elementID);
	
	var availableFormats = [];
	var formatInfo = unescape(this.getFlashVariable(flashvars, "fmt_url_map")).split("|");
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

	// Get the highest-quality version <= the resolution set by the user
	var format = 18;
	var badgeLabel = "YouTube";
	if (this.settings["youTubeResolution"] == "1080p" && availableFormats[37]) {
		format = 37;
		badgeLabel = "YouTube 1080p";
	} else if ((this.settings["youTubeResolution"] == "1080p" || this.settings["youTubeResolution"] == "720p") && availableFormats[22]) {
		format = 22;
		badgeLabel = "YouTube 720p";
	}
	var videoURL = "http://www.youtube.com/get_video?fmt=" + format + "&video_id=" + videoID + "&t=" + videoHash;
	
	// Create the video element
	var videoElement = document.createElement("video");
	videoElement.src = videoURL;
	videoElement.setAttribute("controls", "controls");
	if (this.getFlashVariable(flashvars, "autoplay") == "1") {
		videoElement.setAttribute("autoplay", "autoplay");
	}
	videoElement.style = placeholderElement.style;
	videoElement.style.width = placeholderElement.offsetWidth + "px";
	videoElement.style.height = placeholderElement.offsetHeight + "px";
	this.videoElementMapping[elementID] = videoElement;
	
	// Change the placeholder text to "YouTube"
	var placeholderLogoInset = placeholderElement.firstChild.firstChild.firstChild.childNodes[0];
	placeholderLogoInset.innerHTML = badgeLabel;
	var placeholderLogo = placeholderElement.firstChild.firstChild.firstChild.childNodes[1];
	placeholderLogo.innerHTML = badgeLabel;
}

ClickToFlash.prototype.processFlashElement = function(element) {
	// Check if it's already in the mapping dictionary
	// If so, the user must have clicked it already
	if (this.elementMapping[element.elementID]) {
		return;
	}
	
	// Deal with sIFR first
	if (this.isSIFRText(element)) {
		var autoloadSIFR = this.settings["sifrReplacement"];
		if (this.settings["sifrReplacement"] == "autoload") {
			// Just stop processing. The flash movie will
			// continue being loaded
			return;
		}
	}

	var placeholderElement = document.createElement("div");
	placeholderElement.style = element.style;
	placeholderElement.style.width = element.offsetWidth + "px";
	placeholderElement.style.height = element.offsetHeight + "px";
	placeholderElement.className = "clickToFlashPlaceholder";
	
	var id = element.elementID;
	this.elementMapping[id] = element;
	placeholderElement.id = "ClickToFlashPlaceholder" + id;

	var clickHandler = this;
	placeholderElement.onclick = function(event){clickHandler.clickPlaceholder(event)};

	if (element.parentNode) {
		element.parentNode.replaceChild(placeholderElement, element);
	}
	
	var verticalPositionElement = document.createElement("div");
	verticalPositionElement.className = "logoVerticalPosition";
	placeholderElement.appendChild(verticalPositionElement);

	var horizontalPositionElement = document.createElement("div");
	horizontalPositionElement.className = "logoHorizontalPosition";
	verticalPositionElement.appendChild(horizontalPositionElement);

	var logoContainer = document.createElement("div");
	logoContainer.className = "logoContainer";
	horizontalPositionElement.appendChild(logoContainer);
	
	var logoElement = document.createElement("div");
	logoElement.innerHTML = "Flash";
	logoElement.className = "logo";
	logoContainer.appendChild(logoElement);
	
	var logoInsetElement = document.createElement("div");
	logoInsetElement.innerHTML = "Flash";
	logoInsetElement.className = "logo inset";
	logoContainer.appendChild(logoInsetElement);
	
	// Wait until the placeholder has a width and height, then
	// check if we should minify or hide the badge
	var badgeHide = function() {
		if (placeholderElement.offsetWidth > 0 && logoElement.offsetWidth > 0 && placeholderElement.offsetHeight > 0 && logoElement.offsetHeight > 0) {
			// If the badge is too big, try displaying it at half size
			if ((placeholderElement.offsetWidth - 4) < logoElement.offsetWidth || (placeholderElement.offsetHeight - 4) < logoElement.offsetHeight) {
				logoContainer.className = "logoContainer mini";
			}

			// If it's still too big, just hide it
			if ((placeholderElement.offsetWidth - 4) < logoElement.offsetWidth || (placeholderElement.offsetHeight - 4) < logoElement.offsetHeight) {
				logoContainer.style.display = "none";
			}
		} else {
			setTimeout(badgeHide, 100);
		}
	};
	badgeHide();
	
	// Deal with h264 YouTube videos
	var youTubeShouldUseH264 = true;
	if (youTubeShouldUseH264) {
		var flashvars = element.getAttribute("flashvars");
		var src = element.src;
		var fromYouTube = (src && src.indexOf("youtube.com") != -1) ||
		                  (src && src.indexOf("youtube-nocookie.com") != -1) ||
		                  (src && src.indexOf("ytimg.com") != -1) ||
		                  (flashvars && flashvars.indexOf("youtube.com") != -1) ||
		                  (flashvars && flashvars.indexOf("youtube-nocookie.com") != -1) ||
		                  (flashvars && flashvars.indexOf("ytimg.com") != -1);

		if (fromYouTube) {
			this.processYouTubeElement(element);
		}
	}
}

var CTF = new ClickToFlash();
