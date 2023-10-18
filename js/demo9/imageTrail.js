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

let winsize = {width: window.innerWidth, height: window.innerHeight};
window.addEventListener('resize', () => {
    winsize = {width: window.innerWidth, height: window.innerHeight};
});

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
    // Rotation and transform (z) values and cached values
    rotation = {x: 0, y: 0};
    cachedRotation = {...this.rotation};
    zValue = 0;
    cachedZValue = 0;
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
        cacheMousePos.x = lerp(cacheMousePos.x || mousePos.x, mousePos.x, 0.1);
        cacheMousePos.y = lerp(cacheMousePos.y || mousePos.y, mousePos.y, 0.1);

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
     * The `showNextImage` function is responsible for displaying, animating, and managing the next image in the sequence.
     * It increments the zIndexVal, selects the next image, stops ongoing animations, and defines a series of GSAP animations.
     * @returns {void} 
     */
    showNextImage() {
        // Get the window's center coordinates
        const centerX = winsize.width / 2;
        const centerY = winsize.height / 2;

        // Calculate the mouse position relative to the center of the window
        const relX = mousePos.x - centerX;
        const relY = mousePos.y - centerY;

        // Convert these distances into rotation values (these constants can be adjusted)
        // Here we're saying the full width/height of the window corresponds to a 30 degree rotation
        this.rotation.x = -(relY / centerY) * 30;
        this.rotation.y = (relX / centerX) * 30;
        // Cache these values
        this.cachedRotation = { ...this.rotation };

        // Calculate the distance of the mouse from the center.
        const distanceFromCenter = Math.sqrt(relX * relX + relY * relY);
        // Assuming the maximum distance is the diagonal of the screen.
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        // Calculate the proportion of the distance to the maximum possible (which is the diagonal).
        const proportion = distanceFromCenter / maxDistance;
        // Map this to the Z-axis range (-600 to 600). The overall range is 1200.
        this.zValue = proportion * 1200 - 600;
        // Cache this value
        this.cachedZValue = this.zValue;

        // Now, calculate brightness based on z-value. Assume the brightness should be between 0.5 and 1.5 for effect.
        // Normalize the zValue from range -600 to 600 to a range of 0.5 to 1.5 for brightness.
        // As the zValue increases, the brightness increases, meaning the object is closer and thus brighter.
        const normalizedZ = (this.zValue + 600) / 1200; // This will convert the range from -600 - 600 to 0 - 1.
        const brightness = 0.2 + (normalizedZ * 2.3); // This will map the 0 - 1 range into 0.5 - 2.5 (adjust if necessary).

        // Increment zIndexVal for next image.
        ++this.zIndexVal;
    
        // Select the next image in the sequence, or revert to the first image if at the end of the sequence.
        this.imgPosition = this.imgPosition < this.imagesTotal-1 ? this.imgPosition+1 : 0;
        
        // Retrieve the Image object for the selected position.
        const img = this.images[this.imgPosition];
        
        // Stop any ongoing GSAP animations on the target image element to prepare for new animations.
        gsap.killTweensOf(img.DOM.el);

        // Define GSAP timeline.
        img.timeline = gsap.timeline({
            onStart: () => this.onImageActivated(),
            onComplete: () => this.onImageDeactivated()
        })
        .set(this.DOM.el, {
            perspective: 1000
        }, 0)
        .fromTo(img.DOM.el, {
            opacity: 1,
            z: 0,
            scale: 1 + (this.cachedZValue / 1000),
            zIndex: this.zIndexVal,
            x: cacheMousePos.x - img.rect.width/2 ,
            y: cacheMousePos.y - img.rect.height/2,
            rotationX: this.cachedRotation.x,
            rotationY: this.cachedRotation.y,
            filter: `brightness(${brightness})`
        }, {
            duration: 1,
            ease: 'expo',
            scale: 1 + (this.zValue / 1000),
            x: mousePos.x - img.rect.width/2,
            y: mousePos.y - img.rect.height/2,
            rotationX: this.rotation.x,
            rotationY: this.rotation.y,
        }, 0)
        // then make it disappear
        .to(img.DOM.el, {
            duration: 0.4,
            ease: 'power2',
            opacity: 0,
            z: -800
        }, 0.3)
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