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

	this.startListening();
}