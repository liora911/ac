import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface DownloadPDFOptions {
  filename?: string;
  scale?: number;
  backgroundColor?: string;
  format?: "a4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
}

/**
 * Converts modern CSS color functions to rgb format that html2canvas can parse.
 * This is needed because html2canvas doesn't support oklch, oklab, lch, lab, color(), etc.
 * Must be called AFTER element is in the DOM so getComputedStyle works.
 */
function convertModernColorsToRgb(element: HTMLElement): void {
  const allElements = element.querySelectorAll("*");
  const elementsToProcess = [
    element,
    ...Array.from(allElements),
  ] as HTMLElement[];

  // Modern color functions that html2canvas doesn't support
  const unsupportedColorPatterns = [
    "oklch",
    "oklab",
    "lch",
    "lab(",
    "color(",
    "color-mix",
    "hwb(",
  ];

  const colorProperties = [
    "color",
    "background-color",
    "border-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "text-decoration-color",
    "fill",
    "stroke",
  ];

  elementsToProcess.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;

    const computedStyle = window.getComputedStyle(el);

    colorProperties.forEach((prop) => {
      const value = computedStyle.getPropertyValue(prop);
      if (!value || value === "none" || value === "transparent") return;

      const hasUnsupportedColor = unsupportedColorPatterns.some((pattern) =>
        value.toLowerCase().includes(pattern)
      );

      if (hasUnsupportedColor) {
        // The browser has already computed the RGB value internally
        // We just need to force it to be applied as inline style
        // by reading and re-setting the computed value
        const rgbValue = computedStyle.getPropertyValue(prop);

        // For properties that return rgb/rgba, use them directly
        if (rgbValue.startsWith("rgb")) {
          el.style.setProperty(prop, rgbValue, "important");
        } else {
          // Fallback: create temp element to get browser-computed rgb
          const temp = document.createElement("div");
          temp.style.cssText = `${prop}: ${value} !important; position: absolute; visibility: hidden;`;
          document.body.appendChild(temp);
          const computedRgb = window.getComputedStyle(temp).getPropertyValue(prop);
          document.body.removeChild(temp);
          if (computedRgb) {
            el.style.setProperty(prop, computedRgb, "important");
          }
        }
      }
    });

    // Handle box-shadow separately (can contain multiple colors)
    const boxShadow = computedStyle.getPropertyValue("box-shadow");
    if (boxShadow && boxShadow !== "none") {
      const hasUnsupportedColor = unsupportedColorPatterns.some((pattern) =>
        boxShadow.toLowerCase().includes(pattern)
      );
      if (hasUnsupportedColor) {
        // Replace with a simple shadow or remove it
        el.style.setProperty("box-shadow", "none", "important");
      }
    }
  });
}

/**
 * Downloads an HTML element as a PDF file.
 * Handles Next.js Image components by replacing them with regular img tags.
 * Converts modern CSS colors (oklch/oklab) to rgb for html2canvas compatibility.
 *
 * @param element - The HTML element to capture
 * @param options - Configuration options for the PDF
 * @returns Promise that resolves when download is complete
 */
export async function downloadElementAsPDF(
  element: HTMLElement,
  options: DownloadPDFOptions = {}
): Promise<void> {
  const {
    filename = "download.pdf",
    scale = 2,
    backgroundColor = "#ffffff",
    format = "a4",
    orientation = "portrait",
  } = options;

  // Clone the element to manipulate it without affecting the original
  const clonedElement = element.cloneNode(true) as HTMLElement;

  // Replace Next.js Image components with regular img tags for html2canvas
  const nextImages = clonedElement.querySelectorAll("img[data-nimg]");
  nextImages.forEach((img) => {
    const imgElement = img as HTMLImageElement;
    const src = imgElement.src;
    const newImg = document.createElement("img");
    newImg.src = src;
    newImg.style.cssText = imgElement.style.cssText;
    newImg.style.width = "100%";
    newImg.style.height = "100%";
    newImg.style.objectFit = "cover";
    newImg.crossOrigin = "anonymous";
    imgElement.parentNode?.replaceChild(newImg, imgElement);
  });

  // Also handle images inside picture elements (used by Next.js Image)
  const pictureElements = clonedElement.querySelectorAll("picture");
  pictureElements.forEach((picture) => {
    const img = picture.querySelector("img");
    if (img) {
      const newImg = document.createElement("img");
      newImg.src = img.src;
      newImg.style.width = "100%";
      newImg.style.height = "100%";
      newImg.style.objectFit = "cover";
      newImg.crossOrigin = "anonymous";
      picture.parentNode?.replaceChild(newImg, picture);
    }
  });

  // Temporarily add to DOM for capture (needed for getComputedStyle to work)
  clonedElement.style.position = "absolute";
  clonedElement.style.left = "-9999px";
  clonedElement.style.top = "0";
  clonedElement.style.width = element.offsetWidth + "px";
  document.body.appendChild(clonedElement);

  // Convert modern CSS colors to rgb AFTER element is in DOM
  convertModernColorsToRgb(clonedElement);

  try {
    // Wait for images to load
    const images = clonedElement.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map((img) => {
        return new Promise<void>((resolve) => {
          if ((img as HTMLImageElement).complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        });
      })
    );

    const canvas = await html2canvas(clonedElement, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF(
      orientation === "portrait" ? "p" : "l",
      "mm",
      format
    );

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(
      imgData,
      "PNG",
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );
    pdf.save(filename);
  } finally {
    // Always remove cloned element
    document.body.removeChild(clonedElement);
  }
}
