
export class Image {
    // Class property initialization with default values.
    // The DOM property holds references to the main and inner elements of the image component.
    DOM = {
        el: null,   // Holds the reference to the main DOM element with class 'content__img'.
        inner: null, // Holds the reference to the inner DOM element with class 'content__img-inner'.
    };
    // Default style properties for the image, initialized with initial values.
    defaultStyle = {
        scale: 1,   // Scale factor of the image, initialized to 1 (original size).
        x: 0,       // Horizontal position of the image, initialized to 0.
        y: 0,       // Vertical position of the image, initialized to 0.
        opacity: 0  // Opacity of the image, initialized to 0 (completely transparent).
    };
    // Property to hold the animation timeline for the image.
    timeline = null;
    // Holds the bounding rectangle of the image element.
    rect = null;

    /**
     * Constructor for the Image class. Initializes the instance, sets up DOM references, and binds events.
     * @param {HTMLElement} DOM_el - The main DOM element for the image, expected to have a child with class 'content__img-inner'.
     */
    constructor(DOM_el) {
        // Assign the provided DOM element to the 'el' property of the 'DOM' object.
        this.DOM.el = DOM_el;
        // Find and assign the inner element (with class 'content__img-inner') to the 'inner' property of the 'DOM' object.
        this.DOM.inner = this.DOM.el.querySelector('.content__img-inner');
        
        // Call the getRect method to calculate and store the size and position of the image element.
        this.getRect();
        
        // Call the initEvents method to set up event listeners for the image element.
        this.initEvents();
    }

    /**
     * The initEvents method sets up event handlers for the image element, particularly for the window resize event.
     * @returns {void}
     */
    initEvents() {
        // Define the resize method to reset image styles and recalculate its size and position on window resize.
        this.resize = () => {
            // Reset the image styles to default values using GSAP.
            gsap.set(this.DOM.el, this.defaultStyle);
            
            // Recalculate and update the size and position of the image element.
            this.getRect();
        };

        // Add a window resize event listener that calls the defined resize method to handle image adjustments on window resize.
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * The getRect method calculates and stores the size and position of the image element in the 'rect' property.
     * @returns {void}
     */
    getRect() {
        // Use the getBoundingClientRect method to calculate and assign the size and position of the image element to the 'rect' property.
        this.rect = this.DOM.el.getBoundingClientRect();
    }
}