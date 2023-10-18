// Importing utility functions from 'utils.js'
import { getPointerPos, getMouseDistance, lerp } from '../utils.js';
import { Image } from '../image.js';

// Initial declaration of mouse position variables with default values
let mousePos, lastMousePos, cacheMousePos;
mousePos = {x: 0, y: 0}; // current mouse position
cacheMousePos = {...mousePos}; // previous mouse position
lastMousePos = {...mousePos}; // stores the position of the mouse at the time the most recent image was displayed, serving as a reference point for calculating the distance the cursor has moved in subsequent frames

// This function will be used to handle both mouse and touch events
const handlePointerMove = (ev) => {
    // If it's a touch event, we'll use the first touch point
    if (ev.touches) {
        mousePos = getPointerPos(ev.touches[0]);
    } else {
        // If it's a mouse event, proceed as usual
        mousePos = getPointerPos(ev);
    }
};

// Adding an event listener to the window to update mouse position on mousemove event
window.addEventListener('mousemove', handlePointerMove);
window.addEventListener('touchmove', handlePointerMove);

export class ImageTrail {
    // Class properties initialization
    DOM = {el: null}; // Object to hold DOM elements
    images = []; // Array to store Image objects
    imagesTotal = 0; // Variable to store total number of images
    imgPosition = 0; // Variable to store the position of the upcoming image
    zIndexVal = 1; // z-index value for the upcoming image
    activeImagesCount = 0; // Counter for active images
    isIdle = true; // Flag to check if all images are inactive
    // Mouse distance from the previous trigger, required to show the next image
    threshold = 80;

    /**
     * Constructor for the ImageTrail class.
     * Initializes the instance, sets up the DOM elements, creates Image objects for each image element, and starts the rendering loop.
     * @param {HTMLElement} DOM_el - The parent DOM element containing all image elements.
     */
    constructor(DOM_el) {
        // Store the reference to the parent DOM element.
        this.DOM.el = DOM_el;

        // Create and store Image objects for each image element found within the parent DOM element.
        this.images = [...this.DOM.el.querySelectorAll('.content__img')].map(img => new Image(img));
        
        // Store the total number of images.
        this.imagesTotal = this.images.length;

        const onPointerMoveEv = () => {
			// Initialize cacheMousePos with the current mousePos values.
            // This is necessary to have a reference point for the initial mouse position.
			cacheMousePos = {...mousePos};
			// Initiate the rendering loop.
            requestAnimationFrame(() => this.render());
			// Remove this mousemove event listener after it runs once to avoid reinitialization.
			window.removeEventListener('mousemove', onPointerMoveEv);
            window.removeEventListener('touchmove', onPointerMoveEv);
		};
		// Set up an initial mousemove event listener to run onMouseMoveEv once.
        window.addEventListener('mousemove', onPointerMoveEv);
        window.addEventListener('touchmove', onPointerMoveEv);
    }

    /**
     * The `render` function is the main rendering loop for the `ImageTrail` class, updating images based on mouse movement.
     * It calculates the distance between the current and the last mouse position, then decides whether to show the next image.
     * @returns {void} 
     */
    render() {
        // Calculate distance between current mouse position and last recorded mouse position.
        let distance = getMouseDistance(mousePos, lastMousePos);
        
        // Smoothly interpolate between cached mouse position and current mouse position for smoother visual effects.
        cacheMousePos.x = lerp(cacheMousePos.x || mousePos.x, mousePos.x, 0.3);
        cacheMousePos.y = lerp(cacheMousePos.y || mousePos.y, mousePos.y, 0.3);

        // If the calculated distance is greater than the defined threshold, show the next image and update lastMousePos.
        if ( distance > this.threshold ) {
            this.showNextImage();
            lastMousePos = mousePos;
        }

        // If all images are inactive (isIdle is true) and zIndexVal is not 1, reset zIndexVal to avoid endless incrementation.
        if ( this.isIdle && this.zIndexVal !== 1 ) {
            this.zIndexVal = 1;
        }

        // Request the next animation frame, creating a recursive loop for continuous rendering.
        requestAnimationFrame(() => this.render());
    }

    /**
     * Based on the speed of the mouse, calculates a size value within a specific range.
     * The function maps the speed to a size multiplier, ensuring that higher speeds result in larger sizes.
     * It uses a maximum speed threshold to normalize the size adjustment.
     * 
     * @param {number} speed - The current speed of the mouse movement.
     * @param {number} minSize - The minimum size limit for the transformation.
     * @param {number} maxSize - The maximum size limit for the transformation.
     * @returns {number} - The adjusted size value.
     */
    mapSpeedToSize(speed, minSize, maxSize) {
        const maxSpeed = 200; 
        return minSize + (maxSize - minSize) * Math.min(speed / maxSpeed, 1);
    }

    /**
     * Determines the brightness level based on the mouse speed, staying within defined limits.
     * The faster the mouse movement, the higher the brightness, with a maximum speed threshold for normalization.
     * 
     * @param {number} speed - Current speed of the mouse movement.
     * @param {number} minBrightness - Minimum brightness level allowed.
     * @param {number} maxBrightness - Maximum brightness level allowed.
     * @returns {number} - The calculated brightness level.
     */
    mapSpeedToBrightness(speed, minBrightness, maxBrightness) {
        const maxSpeed = 70; 
        return minBrightness + (maxBrightness - minBrightness) * Math.min(speed / maxSpeed, 1);
    };

    /**
     * Adjusts the blur effect based on the current speed of the mouse, ensuring it remains within a specific range.
     * Higher speeds result in more blur. A maximum speed threshold is used for normalization purposes.
     * 
     * @param {number} speed - The current speed of the mouse movement.
     * @param {number} minBlur - The minimum blur effect allowed.
     * @param {number} maxBlur - The maximum blur effect allowed.
     * @returns {number} - The computed blur value.
     */
    mapSpeedToBlur(speed, minBlur, maxBlur) {
        const maxSpeed = 90; 
        return minBlur + (maxBlur - minBlur) * Math.min(speed / maxSpeed, 1);
    };

    /**
     * Modifies the grayscale level of an image based on the mouse's speed, within set minimum and maximum boundaries.
     * Faster movements lead to higher grayscale levels. A maximum speed is defined to normalize the grayscale adjustment.
     * 
     * @param {number} speed - The detected speed of the mouse movement.
     * @param {number} minGrayscale - The lowest permissible grayscale level.
     * @param {number} maxGrayscale - The highest permissible grayscale level.
     * @returns {number} - The adjusted grayscale level.
     */
    mapSpeedToGrayscale(speed, minGrayscale, maxGrayscale) {
        const maxSpeed = 90; 
        return minGrayscale + (maxGrayscale - minGrayscale) * Math.min(speed / maxSpeed, 1);
    };

    /**
     * The `showNextImage` function is responsible for displaying, animating, and managing the next image in the sequence.
     * It increments the zIndexVal, selects the next image, stops ongoing animations, and defines a series of GSAP animations.
     * @returns {void} 
     */
    showNextImage() {
        // Calculate the horizontal and vertical distances between the current and last mouse positions.
        let dx = mousePos.x - cacheMousePos.x; 
        let dy = mousePos.y - cacheMousePos.y;
        
        // Compute the Euclidean distance between the current and last mouse positions. This represents the direct line distance regardless of direction.
        let speed = Math.sqrt(dx * dx + dy * dy);

        // Increment zIndexVal for next image.
        ++this.zIndexVal;
    
        // Select the next image in the sequence, or revert to the first image if at the end of the sequence.
        this.imgPosition = this.imgPosition < this.imagesTotal-1 ? this.imgPosition+1 : 0;
        
        // Retrieve the Image object for the selected position.
        const img = this.images[this.imgPosition];
        
        let scaleFactor = this.mapSpeedToSize(speed, 0.3, 2); // Assuming min scale of 0.3 and max scale of 2
        let brightnessValue = this.mapSpeedToBrightness(speed, 0, 1.3); // Assuming min brightness of 0 (0%) and max brightness of 1.3 (130%)
        let blurValue = this.mapSpeedToBlur(speed, 20, 0);
        let grayscaleValue = this.mapSpeedToGrayscale(speed, 600, 0);

        // Stop any ongoing GSAP animations on the target image element to prepare for new animations.
        gsap.killTweensOf(img.DOM.el);

        // Define GSAP timeline.
        img.timeline = gsap.timeline({
            onStart: () => this.onImageActivated(),
            onComplete: () => this.onImageDeactivated()
        })
        .fromTo(img.DOM.el, {
            opacity: 1,
            scale: 0,
            zIndex: this.zIndexVal,
            x: cacheMousePos.x - img.rect.width/2 ,
            y: cacheMousePos.y - img.rect.height/2
        }, {
            duration: 0.8,
            ease: 'power3',
            scale: scaleFactor,
            filter: `grayscale(${grayscaleValue*100}%) brightness(${brightnessValue*100}%) blur(${blurValue}px)`,
            x: mousePos.x - img.rect.width/2,
            y: mousePos.y - img.rect.height/2
        }, 0)
        /* Inner image */
        .fromTo(img.DOM.inner, {
            scale: 2
        }, {
            duration: 0.8,
            ease: 'power3',
            scale: 1
        }, 0)
        /* Inner image */
        // then make it disappear
        .to(img.DOM.el, {
            duration: 0.4,
            ease: 'power3.in',
            opacity: 0,
            scale: 0.2
        }, 0.45);
    }
    
    /**
     * onImageActivated function is called when an image's activation (display) animation begins.
     * It increments the activeImagesCount and sets isIdle flag to false.
     * @returns {void}
     */
    onImageActivated = () => {
        // Increment the counter for active images.
        this.activeImagesCount++;

        // Set the isIdle flag to false as there's at least one active image.
        this.isIdle = false;
    }

    /**
     * onImageDeactivated function is called when an image's deactivation (disappearance) animation ends.
     * It decrements the activeImagesCount and sets isIdle flag to true if no images are active.
     * @returns {void}
     */
    onImageDeactivated = () => {
        // Decrement the counter for active images.
        this.activeImagesCount--;

        // If there are no active images, set the isIdle flag to true.
        if (this.activeImagesCount === 0) {
            this.isIdle = true;
        }
    }
}