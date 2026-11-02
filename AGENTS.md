<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Workspace sample data and workflow step definitions live in src/lib/clients.ts; the approval rule (canImplement) is tested in src/test/approval.test.ts. Why: one place to swap in real storage later.
- The imported sign-in page lives at /sign-in with its own scoped CSS; new UI uses the theme tokens in src/styles.css. Why: keeps the imported clone isolated.
