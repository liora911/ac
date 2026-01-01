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
 * Converts oklch/oklab colors to rgb format that html2canvas can parse.
 * This is needed because html2canvas doesn't support modern CSS color functions.
 */
function convertModernColorsToRgb(element: HTMLElement): void {
  const allElements = element.querySelectorAll("*");
  const elementsToProcess = [element, ...Array.from(allElements)] as HTMLElement[];

  elementsToProcess.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;

    const computedStyle = window.getComputedStyle(el);
    const colorProperties = [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
      "textDecorationColor",
      "boxShadow",
    ];

    colorProperties.forEach((prop) => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && (value.includes("oklch") || value.includes("oklab"))) {
        // Get the computed RGB value by creating a temporary element
        const temp = document.createElement("div");
        temp.style.color = value;
        document.body.appendChild(temp);
        const rgbValue = window.getComputedStyle(temp).color;
        document.body.removeChild(temp);

        // Apply the RGB value directly
        el.style.setProperty(prop, rgbValue);
      }
    });
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

  // Convert oklch/oklab colors to rgb for html2canvas compatibility
  convertModernColorsToRgb(clonedElement);

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

  // Temporarily add to DOM for capture
  clonedElement.style.position = "absolute";
  clonedElement.style.left = "-9999px";
  clonedElement.style.top = "0";
  clonedElement.style.width = element.offsetWidth + "px";
  document.body.appendChild(clonedElement);

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
