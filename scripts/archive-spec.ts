import { slug as slugify } from "@annervisser/slug";

const result = await new Deno.Command("git", {
  args: ["branch", "--show-current"],
  stdout: "piped",
}).output();

const branch = new TextDecoder().decode(result.stdout).trim().replace("/", "-");
const filename = slugify(branch);

await Deno.mkdir("specs", { recursive: true });
await Deno.copyFile("spec.md", `specs/${filename}.md`);
await Deno.remove("spec.md");

console.log(`Archived spec.md → specs/${filename}.md`);
