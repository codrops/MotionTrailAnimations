// 'preloadImages' is a utility function that handles the preloading of images to ensure they are fully loaded before being used.
import { preloadImages } from '../utils.js';
// 'ImageTrail' is a class designed to manage and animate a sequence of images, reacting to mouse movements.
import { ImageTrail } from './imageTrail.js';

// Preload all images
preloadImages('.content__img-inner').then(() => {
    // Once all images are preloaded, remove the 'loading' class from the body element.
    document.body.classList.remove('loading');
    
    // Instantiate a new ImageTrail object, initializing it with the element that has the class 'content'.
    // The ImageTrail instance starts managing and animating the sequence of images within the specified element, reacting to mouse movements.
    new ImageTrail(document.querySelector('.content'));
});
