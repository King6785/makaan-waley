const Image = require("@11ty/eleventy-img");
const fs = require("fs");
const path = require("path");

// Icon macro as a global function
const icons = {
  home: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.55 5.45 21 6 21H9M19 10L21 12M19 10V20C19 20.55 18.55 21 18 21H15M9 21V15H15V21M9 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  building: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M3 21H21M3 7H21M6 21V7M18 21V7M10 21V17H14V21M10 11H11M13 11H14M10 15H11M13 15H14M10 7V3H14V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  architecture: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M2 20H22M4 20V10M20 20V10M12 4L4 10H20L12 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 20V15C9 14.45 9.45 14 10 14H14C14.55 14 15 14.45 15 15V20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  interior: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21V12H15V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  default: `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/></svg>`
};

function getIcon(name) {
  return icons[name] || icons.default;
}

module.exports = function(eleventyConfig) {
  // Copy static assets
  eleventyConfig.addPassthroughCopy({"www.wehouse.in/images": "images"});
  eleventyConfig.addPassthroughCopy({"www.wehouse.in/css": "css"});
  eleventyConfig.addPassthroughCopy({"www.wehouse.in/js": "js"});
  eleventyConfig.addPassthroughCopy({"www.wehouse.in/fonts": "fonts"});
  eleventyConfig.addPassthroughCopy({"www.wehouse.in/admin": "admin"});
  eleventyConfig.addPassthroughCopy({"www.wehouse.in/content": "content"});

  // Watch content JSON for changes
  eleventyConfig.addWatchTarget("www.wehouse.in/content/");

  // Global data from JSON
  eleventyConfig.addGlobalData("site", () => {
    const contentPath = path.join(__dirname, "www.wehouse.in/content/site-content.json");
    return JSON.parse(fs.readFileSync(contentPath, "utf-8"));
  });

  // Add icon as a shortcode
  eleventyConfig.addShortcode("icon", getIcon);

  // Shortcodes for common patterns
  eleventyConfig.addShortcode("year", () => new Date().getFullYear());

  // Image optimization shortcode
  eleventyConfig.addNunjucksAsyncShortcode("image", async function(src, alt, sizes, cls) {
    if (!src) return "";
    const fullSrc = path.join(__dirname, "www.wehouse.in", src);
    if (!fs.existsSync(fullSrc)) {
      console.warn(`Image not found: ${fullSrc}`);
      return `<img src="${src}" alt="${alt || ""}"${cls ? ` class="${cls}"` : ""}>`;
    }
    let metadata = await Image(fullSrc, {
      widths: [400, 800, 1200, 1600],
      formats: ["webp", "jpeg"],
      outputDir: "./_site/images/optimized",
      urlPath: "/images/optimized/",
      filenameFormat: function(id, src, width, format, options) {
        const ext = path.extname(src);
        const name = path.basename(src, ext);
        return `${name}-${width}w.${format}`;
      }
    });
    const lowsrc = metadata.jpeg[0];
    const highsrc = metadata.jpeg[metadata.jpeg.length - 1];
    const source = Object.values(metadata).map(imageFormat => {
      return `  <source type="image/${imageFormat[0].format}" srcset="${imageFormat.map(entry => entry.srcset).join(", ")}" sizes="${sizes || "100vw"}">`;
    }).join("\n");
    return `<picture>
${source}
  <img src="${lowsrc.url}" alt="${alt || ""}" loading="lazy" decoding="async"${cls ? ` class="${cls}"` : ""}>
</picture>`;
  });

  // Inline SVG shortcode
  eleventyConfig.addShortcode("inlineSvg", function(src) {
    const fullSrc = path.join(__dirname, "www.wehouse.in", src);
    if (fs.existsSync(fullSrc)) {
      return fs.readFileSync(fullSrc, "utf-8");
    }
    return `<!-- SVG not found: ${src} -->`;
  });

  // Configuration
  return {
    dir: {
      input: "www.wehouse.in",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "html", "json", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    passthroughFileCopy: true
  };
};