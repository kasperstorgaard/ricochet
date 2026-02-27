type ImportGroup = "third-party" | "project";

export default {
  name: "ricochet-imports",
  rules: {
    /**
     * All cross-folder project imports must use the #/ alias.
     * Same-folder relative imports (e.g. ./board.ts) are allowed.
     */
    "use-hash-alias": {
      create(context) {
        return {
          ImportDeclaration(node) {
            const source = node.source.value;

            if (getImportGroup(source) === "third-party") return;
            if (source.startsWith("#/")) return;

            // Allow same-folder: ./filename.ext (no nested path)
            if (source.startsWith("./") && !source.slice(2).includes("/")) {
              return;
            }

            context.report({
              node: node.source,
              message: `Use '#/' alias instead of relative path: "${source}"`,
              fix(fixer) {
                const matcher = /((?:[.]{0,2}\/)+)(.*)/;
                const corrected = source.replace(matcher, '"#/$2"');

                return fixer.replaceText(node.source, corrected);
              },
            });
          },
        };
      },
    },

    /**
     * Imports must be split into two groups separated by exactly one blank
     * line:
     *   1. Third-party (bare specifiers, npm:, jsr:, etc.)
     *   2. Project (#/ and same-folder ./)
     * No blank lines are allowed within a group.
     */
    "import-groups": {
      create(context) {
        return {
          Program(node) {
            const text = context.sourceCode.text;
            const body = node.body as Deno.lint.Node[];

            const importIndices: number[] = [];
            for (let i = 0; i < body.length; i++) {
              if (body[i].type === "ImportDeclaration") importIndices.push(i);
            }

            for (let k = 1; k < importIndices.length; k++) {
              // Skip if non-import code sits between these two imports
              if (importIndices[k] - importIndices[k - 1] > 1) continue;

              const prev =
                body[importIndices[k - 1]] as Deno.lint.ImportDeclaration;
              const curr =
                body[importIndices[k]] as Deno.lint.ImportDeclaration;

              const prevGroup = getImportGroup(prev.source.value);
              const currGroup = getImportGroup(curr.source.value);

              const prevEndLine = lineAt(text, prev.range[1]);
              const currStartLine = lineAt(text, curr.range[0]);
              const blankLines = currStartLine - prevEndLine - 1;

              if (prevGroup === currGroup) {
                if (blankLines > 0) {
                  context.report({
                    node: curr,
                    message: "No blank lines within an import group",
                  });
                }
              } else if (
                prevGroup === "project" && currGroup === "third-party"
              ) {
                context.report({
                  node: curr,
                  message:
                    "Third-party imports must come before project imports",
                });
              } else if (blankLines !== 1) {
                context.report({
                  node: curr,
                  message:
                    `Expected one blank line between import groups, found ${blankLines}`,
                  // TODO: add a fixer that removes all blank in imports, adds one exactly in between the groups
                });
              }
            }
          },
        };
      },
    },

    /**
     * Within each import group, imports must be sorted alphabetically by
     * module specifier (case-insensitive). Provides an auto-fix.
     */
    "import-sort": {
      create(context) {
        return {
          Program(node) {
            const imports = (node.body as Deno.lint.Node[]).filter(
              isImportDecl,
            );

            if (imports.length <= 1) return;

            let groupStart = 0;

            for (let i = 1; i <= imports.length; i++) {
              const isEnd = i === imports.length;
              const isNewGroup = !isEnd &&
                getImportGroup(imports[i].source.value) !==
                  getImportGroup(imports[groupStart].source.value);

              if (isEnd || isNewGroup) {
                const group = imports.slice(groupStart, i);

                for (let j = 1; j < group.length; j++) {
                  const prevVal = group[j - 1].source.value.toLowerCase();
                  const currVal = group[j].source.value.toLowerCase();

                  if (currVal < prevVal) {
                    const sorted = [...group].sort((a, b) =>
                      a.source.value
                        .toLowerCase()
                        .localeCompare(b.source.value.toLowerCase())
                    );

                    context.report({
                      node: group[j].source,
                      message: `Import "${
                        group[j].source.value
                      }" should be sorted before "${
                        group[j - 1].source.value
                      }"`,
                      fix(fixer) {
                        return group.map((imp, idx) =>
                          fixer.replaceText(
                            imp,
                            context.sourceCode.getText(sorted[idx]),
                          )
                        );
                      },
                    });
                    break; // One report per group; the fix sorts the whole group
                  }
                }

                groupStart = i;
              }
            }
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;

/**
 * Returns the 1-indexed line number for a character offset within source text.
 */
function lineAt(text: string, offset: number): number {
  return text.slice(0, offset).split("\n").length;
}

function getImportGroup(specifier: string): ImportGroup {
  if (
    specifier.startsWith("#/") ||
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    specifier.startsWith("/")
  ) {
    return "project";
  }
  return "third-party";
}

function isImportDecl(
  node: Deno.lint.Node,
): node is Deno.lint.ImportDeclaration {
  return node.type === "ImportDeclaration";
}
