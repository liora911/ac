import { Extension } from "@tiptap/core";

type IndentOptions = {
  types: string[];
  minLevel: number;
  maxLevel: number;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;

      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading", "listItem", "blockquote", "codeBlock"],
      minLevel: 0,
      maxLevel: 24,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: this.options.minLevel,
            parseHTML: (element) =>
              parseInt(
                element.getAttribute("data-indent") ||
                  `${this.options.minLevel}`,
                10
              ),
            renderHTML: (attributes) => {
              if (attributes.indent === this.options.minLevel) {
                return {};
              }
              return {
                "data-indent": attributes.indent,
                style: `margin-left: ${attributes.indent * 20}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          let transaction = tr;

          state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || this.options.minLevel;
              const newIndent = Math.min(
                currentIndent + 1,
                this.options.maxLevel
              );
              if (newIndent !== currentIndent) {
                transaction = transaction.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: newIndent,
                });
              }
            }
          });

          if (dispatch) {
            dispatch(transaction);
          }
          return true;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          let transaction = tr;

          state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || this.options.minLevel;
              const newIndent = Math.max(
                currentIndent - 1,
                this.options.minLevel
              );
              if (newIndent !== currentIndent) {
                transaction = transaction.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: newIndent,
                });
              }
            }
          });

          if (dispatch) {
            dispatch(transaction);
          }
          return true;
        },
    };
  },
});
