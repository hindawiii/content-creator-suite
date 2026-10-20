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

## Frontend architecture
- Self-host the interface variable font through package CSS; keep editor font choices independent so interface reliability does not restrict content styling.
- Express interface colors and text sizes through global semantic tokens; chart and overlay styling must reference the same tokens to avoid page-specific palette drift.
- Keep primary mobile destinations and an accessible More dialog in the shared layout; preserve access to every section without shrinking navigation labels.
