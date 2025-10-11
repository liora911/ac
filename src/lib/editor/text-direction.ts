import { Extension } from "@tiptap/core";

type TextDirectionOptions = {
  types: string[];
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textDirection: {
      /**
       * Set the text direction
       */
      setTextDirection: (direction: "ltr" | "rtl") => ReturnType;
      /**
       * Unset the text direction
       */
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
      setTextDirection:
        (direction) =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { dir: direction })
          );
        },
      unsetTextDirection:
        () =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { dir: null })
          );
        },
    };
  },
});
