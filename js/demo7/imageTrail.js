// Importing utility functions from 'utils.js'
import { getPointerPos, getMouseDistance, getNewPosition, lerp } from '../utils.js';
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
    visibleImagesCount = 0;
    // Mouse distance from the previous trigger, required to show the next image
    threshold = 80;
    // The total number of visible images
    visibleImagesTotal = 9;

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

        // Restriction on maximum visible images
        this.visibleImagesTotal = Math.min(this.visibleImagesTotal, this.imagesTotal-1)

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
     * The `showNextImage` function is responsible for displaying, animating, and managing the next image in the sequence.
     * It increments the zIndexVal, selects the next image, stops ongoing animations, and defines a series of GSAP animations.
     * @returns {void} 
     */
    showNextImage() {
        // Increment zIndexVal for next image.
        ++this.zIndexVal;
    
        // Select the next image in the sequence, or revert to the first image if at the end of the sequence.
        this.imgPosition = this.imgPosition < this.imagesTotal-1 ? this.imgPosition+1 : 0;

        // Retrieve the Image object for the selected position.
        const img = this.images[this.imgPosition];
        
        ++this.visibleImagesCount;

        // Stop any ongoing GSAP animations on the target image element to prepare for new animations.
        gsap.killTweensOf(img.DOM.el);

        // Random scale value
        const scaleValue = gsap.utils.random(0.5, 1.6,);
        
        img.timeline = gsap.timeline({
            onStart: () => this.onImageActivated(),
            onComplete: () => this.onImageDeactivated(),
        })
        .fromTo(img.DOM.el, {
            scale: scaleValue - Math.max(gsap.utils.random(0.2,0.6), 0),
            rotationZ: 0,
            opacity: 1,
            zIndex: this.zIndexVal,
            x: cacheMousePos.x - img.rect.width/2 ,
            y: cacheMousePos.y - img.rect.height/2
        }, {
            duration: 0.4,
            ease: 'power3',
            scale: scaleValue,
            rotationZ: gsap.utils.random(-3, 3),
            x: mousePos.x - img.rect.width/2,
            y: mousePos.y - img.rect.height/2
        }, 0);

        // This block of code handles the situation where the number of images currently visible on the screen exceeds a predefined limit, 
        // which is set in [settings.visibleImagesTotal]. When there are too many images, it ensures that the oldest image (the "last in queue") 
        // is hidden to maintain the desired number of visible images.
        
        // Check if the count of visible images has exceeded the specified limit.
        if ( this.visibleImagesCount >= this.visibleImagesTotal ) {
            // Calculate the position of the image that is last in the visibility queue.
            // It's the oldest visible image and needs to be hidden next.
            const lastInQueue = getNewPosition(this.imgPosition, this.visibleImagesTotal, this.images);
            
            // Retrieve the Image object that needs to be hidden.
            const img = this.images[lastInQueue];
            
            // Animate the oldest visible image to gradually disappear, making room for new images in the scene.
            gsap.to(img.DOM.el, {
                duration: 0.4,
                ease: 'power4',
                opacity: 0,
                scale: 1.3,
                onComplete: () => {
                    if (this.activeImagesCount === 0) {
                        this.isIdle = true;
                    }
                }
            });
        }
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
    }
}