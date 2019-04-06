// @ts-check
/// <reference lib="esnext.asynciterable" />
// Must reference esnext.asynciterable lib, since octokit uses AsyncIterable internally
const Octokit = require("@octokit/rest");
const fs = require("fs");

const requester = process.env.requesting_user;
const source = process.env.source_issue;
const postedComment = process.env.status_comment;
console.log(`Loading fragment from ${process.argv[3]}...`);
const outputTableText = fs.readFileSync(process.argv[3], { encoding: "utf8" });
console.log(`Fragment contents:
${outputTableText}`);

const gh = new Octokit();
gh.authenticate({
    type: "token",
    token: process.argv[2]
});

async function main() {
    const existingComment = await gh.issues.getComment({
        owner: "Microsoft",
        repo: "TypeScript",
        comment_id: +postedComment
    });

    const gist = await gh.gists.create({
        files: { "index.md": { content: outputTableText } },
        description: `Perf results for ${existingComment.data.html_url}`,
        public: true
    });

    await gh.issues.createComment({
        number: +source,
        owner: "Microsoft",
        repo: "TypeScript",
        body: `@${requester}\The results of the perf run you requested are in! They can be found at: ${gist.data.html_url}`
    });

    await gh.issues.updateComment({
        owner: "Microsoft",
        repo: "TypeScript",
        comment_id: +postedComment,
        body: `${existingComment.data.body}\n\nUpdate: [The results are in!](${gist.data.html_url})`
    });
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});