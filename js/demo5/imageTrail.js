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
    lastAngle = 0; // track last image's angle
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
        
        // If the calculated distance is greater than the defined threshold, show the next image and update lastMousePos.
        if ( distance > this.threshold ) {
            this.showNextImage();
            lastMousePos = mousePos;
        }

        // Smoothly interpolate between cached mouse position and current mouse position for smoother visual effects.
        cacheMousePos.x = lerp(cacheMousePos.x || mousePos.x, mousePos.x, 0.1);
        cacheMousePos.y = lerp(cacheMousePos.y || mousePos.y, mousePos.y, 0.1);

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
        // Calculate the horizontal and vertical distances between the current and last mouse positions.
        let dx = mousePos.x - cacheMousePos.x;
        let dy = mousePos.y - cacheMousePos.y;

        // Calculate angle in degrees
        this.angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Adjust angle here if necessary
        if (this.angle < 0) {
            this.angle += 360; // Normalize negative angles
        }

        // Optionally, adjust angles in specific quadrants if needed
        if (this.angle > 90 && this.angle <= 270) {
            this.angle += 180; // Flip the image if it is in the 2nd or 3rd quadrant
        }

        // Determine the movement direction
        const isMovingClockwise = this.angle >= this.lastAngle;

        // Store the current angle for the next mouse move event
        this.lastAngle = this.angle;

        // Adjust the startAngle based on movement direction
        let startAngle = isMovingClockwise ? this.angle - 10 : this.angle + 10;

        // Compute the Euclidean distance between the current and last mouse positions. This represents the direct line distance regardless of direction.
        let distance = Math.sqrt(dx * dx + dy * dy); // Calculate the distance
    
        // The next steps involve "normalizing" the distance vector. Normalization refers to adjusting the length of a vector to 1 while keeping its direction constant.
        // This is especially useful for simplifying calculations when you're only interested in vector direction and not its magnitude.

        // Check to avoid division by zero if the distance is not zero.
        if (distance !== 0) {
            dx /= distance; // Normalize the x component of the distance vector.
            dy /= distance; // Normalize the y component of the distance vector.
        }

        // The x and y components are now parts of a unit vector in the direction of the mouse movement.
        // However, we want the animation to be perceptible, so we scale the components by a factor.
        // Here, the factor is calculated based on the original distance, dividing it by a constant to lessen the effect, to avoid overly rapid movement.

        // Adjust the x and y components of the unit vector by scaling. 
        // The scaling factor is the original distance divided by 150, ensuring the movement is noticeable yet smooth.
        dx *= distance/150; // Scale the normalized x component.
        dy *= distance/150; // Scale the normalized y component.

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
        .fromTo(img.DOM.el, {
            opacity: 1,
            filter: 'brightness(80%)',
            scale: 0.1,
            zIndex: this.zIndexVal,
            x: cacheMousePos.x - img.rect.width/2 ,
            y: cacheMousePos.y - img.rect.height/2,
            rotation: startAngle
        }, {
            duration: 1,
            ease: 'power2',
            scale: 1,
            filter: 'brightness(100%)',
            x: mousePos.x - img.rect.width/2 + (dx*70),
            y: mousePos.y - img.rect.height/2 + (dy*70),
            rotation: this.lastAngle
        }, 0)
        // then make it disappear
        .to(img.DOM.el, {
            duration: 0.4,
            ease: 'expo',
            opacity: 0
        }, 0.5)
        .to(img.DOM.el, {
            duration: 1.5,
            ease: 'power4',
            x: "+=" + (dx * 120), // Adjust the multiplier as needed
            y: "+=" + (dy * 120),  // Adjust the multiplier as needed
        }, 0.05)
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