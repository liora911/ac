import { Extension } from "@tiptap/core";

type TextDirectionOptions = {
  types: string[];
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textDirection: {
      setTextDirection: (direction: "ltr" | "rtl") => ReturnType;

      unsetTextDirection: () => ReturnType;
    };
  }
}

export const TextDirection = Extension.create<TextDirectionOptions>({
  name: "textDirection",

  addOptions() {
    return {
      types: ["heading", "paragraph"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: null,
            parseHTML: (element) => element.getAttribute("dir"),
            renderHTML: (attributes) => {
              if (!attributes.dir) {
                return {};
              }
              return { dir: attributes.dir };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      // Apply to EVERY configured type in the selection — not `.every()`,
      // which short-circuits on the first type that doesn't match the current
      // node (e.g. "heading" when you're in a paragraph) and silently does
      // nothing. `.map` runs them all; succeed if any node was updated.
      setTextDirection:
        (direction) =>
        ({ commands }) => {
          return this.options.types
            .map((type) => commands.updateAttributes(type, { dir: direction }))
            .some(Boolean);
        },
      unsetTextDirection:
        () =>
        ({ commands }) => {
          return this.options.types
            .map((type) => commands.updateAttributes(type, { dir: null }))
            .some(Boolean);
        },
    };
  },
});
