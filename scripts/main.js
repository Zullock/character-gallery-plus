import CGPlusApplication from "./character-gallery-plus.js";


Hooks.on("renderGalleryApplication", (context, options, data) => {
    globalThis.CGPlus = game.modules.get("character-gallery-plus");
    CGPlus.application = new CGPlusApplication();
    CGPlus.application.overrideSearchFilter();
});

