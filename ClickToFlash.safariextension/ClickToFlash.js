function ClickToFlash() {
	this.elementMapping = new Array();
	
	var _this = this;
	this.nodeInsertedTrampoline = function(event) {
		_this.nodeInserted(event);
	}
}

ClickToFlash.prototype.nodeInserted = function(event) {
	if (event.target instanceof HTMLEmbedElement) {
		this.removeFlash();
	}
}

ClickToFlash.prototype.startListening = function() {
	document.addEventListener("DOMNodeInserted", this.nodeInsertedTrampoline, false);
}

ClickToFlash.prototype.stopListening = function() {
	document.removeEventListener("DOMNodeInserted", this.nodeInsertedTrampoline, false);
}

ClickToFlash.prototype.clickPlaceholder = function(event) {
	// Temporarily disable watching the DOM
	// Otherwise, we'll trigger ourselves by adding the <embed>
	this.stopListening();
	
	var clickedElement = event.target;
	
	while (clickedElement.className != "clickToFlashPlaceholder") {
		clickedElement = clickedElement.parentNode;
	}
	
	var embedID = parseInt(clickedElement.id.replace("ClickToFlashPlaceholder", ""));

	var embedElement = this.elementMapping[embedID];
	clickedElement.parentNode.replaceChild(embedElement, clickedElement);

	setTimeout(this.startListening, 500);
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

ClickToFlash.prototype.processYouTubeElement = function(element) {
	var flashvars = element.getAttribute("flashvars");
	var videoID = this.getFlashVariable(flashvars, "video_id");
	var videoHash = this.getFlashVariable(flashvars, "t");

	// Check if there's an h264 version available
	var h264URL = "http://www.youtube.com/get_video?fmt=18&video_id=" + videoID + "&t=" + videoHash;
	var h264exists = true;

	if (h264exists) {
		var videoURL = h264URL;

		// Check if there's a high-res h264 version available
		var youTubeShouldUseHighResH264 = true;
		if (youTubeShouldUseHighResH264) {
			var highResH264URL = "http://www.youtube.com/get_video?fmt=22&video_id=" + videoID + "&t=" + videoHash;
			var highResH264exists = true;
			if (highResH264exists) {
				videoURL = highResH264URL;
			}
		}

		var videoElement = document.createElement("video");
		videoElement.src = videoURL;
		videoElement.setAttribute("controls", "controls");
		if (this.getFlashVariable(flashvars, "autoplay") == "1") {
			videoElement.setAttribute("autoplay", "autoplay");
		}
		videoElement.style = element.style;
		videoElement.style.width = element.offsetWidth + "px";
		videoElement.style.height = element.offsetHeight + "px";

		element.parentNode.replaceChild(videoElement, element);
	} else {
		// No h264 version available, so treat it like a normal element
		this.processFlashElement(element); 
	}
}

ClickToFlash.prototype.processFlashElement = function(element) {
	// Check if it's already in the mapping dictionary
	// If so, the user must have clicked it already
	for (j = 0; j < this.elementMapping.length; j++) {
		if (this.elementMapping[j] == element) {
			continue;
		}
	}

	var placeholderElement = document.createElement("div");
	placeholderElement.style = element.style;
	placeholderElement.style.width = element.offsetWidth + "px";
	placeholderElement.style.height = element.offsetHeight + "px";
	placeholderElement.className = "clickToFlashPlaceholder";

	var id = this.elementMapping.length;
	this.elementMapping[id] = element;
	placeholderElement.id = "ClickToFlashPlaceholder" + id;

	var clickHandler = this;
	placeholderElement.onclick = function(event){clickHandler.clickPlaceholder(event)};

	element.parentNode.replaceChild(placeholderElement, element);
	
	// Don't display the logo if the box is too small
	if (placeholderElement.offsetWidth > 100 && placeholderElement.offsetHeight > 50) {
		var verticalPositionElement = document.createElement("div");
		verticalPositionElement.className = "logoVerticalPosition";
		placeholderElement.appendChild(verticalPositionElement);

		var horizontalPositionElement = document.createElement("div");
		horizontalPositionElement.className = "logoHorizontalPosition";
		verticalPositionElement.appendChild(horizontalPositionElement);

		var logoElement = document.createElement("div");
		logoElement.innerHTML = "Flash";
		logoElement.className = "logo";
		horizontalPositionElement.appendChild(logoElement);
	}
}

ClickToFlash.prototype.removeFlash = function() {
	this.stopListening();
	
	var embedElements = document.getElementsByTagName("embed");
	var objectElements = document.getElementsByTagName("object");
	var flashElements = [];
	for (i = 0; i < objectElements.length; i++) {
		flashElements[flashElements.length] = objectElements[i];
	}
	for (i = 0; i < embedElements.length; i++) {
		flashElements[flashElements.length] = embedElements[i];
	}
	
	for (i = 0; i < flashElements.length; i++) {
		var element = flashElements[i];
		
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
				return;
			}
		}

		this.processFlashElement(element);
	}

	this.startListening();
}