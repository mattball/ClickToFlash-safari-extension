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
	if (event.target.className == "logo") {
		clickedElement = clickedElement.parentNode;
	}
	
	var embedID = parseInt(clickedElement.id.replace("ClickToFlashPlaceholder", ""));

	var embedElement = this.elementMapping[embedID];
	clickedElement.parentNode.replaceChild(embedElement, clickedElement);

	setTimeout(this.startListening, 500);
}

ClickToFlash.prototype.removeFlash = function() {
	this.stopListening();
	
	var embedElements = document.getElementsByTagName("embed");
	for (i = 0; i < embedElements.length; i++) {
		var element = embedElements[i];

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

		var logoElement = document.createElement("div");
		logoElement.innerHTML = "Flash";
		logoElement.className = "logo";
		placeholderElement.appendChild(logoElement);

		var id = this.elementMapping.length;
		this.elementMapping[id] = element;
		placeholderElement.id = "ClickToFlashPlaceholder" + id;
		placeholderElement.setAttribute("contextmenu", "ClickToFlashContextMenu");

	//	placeholderElement.onclick = function(){return clickPlaceholder(id)};
		var clickHandler = this;
		placeholderElement.onclick = function(event){clickHandler.clickPlaceholder(event)};

		element.parentNode.replaceChild(placeholderElement, element);

		// Position the logo correctly
		logoElement.style.left = (placeholderElement.offsetWidth - logoElement.offsetWidth)/2.0 + "px";
		logoElement.style.top = (placeholderElement.offsetHeight - logoElement.offsetHeight)/2.0 + "px";

		// Don't display the logo if the box is too small
		if (placeholderElement.offsetWidth < 100 || placeholderElement.offsetHeight < 50) {
			logoElement.style.display = "none";
		}
	}

	this.startListening();
}

new ClickToFlash().removeFlash();